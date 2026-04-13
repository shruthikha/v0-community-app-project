# Audit: Dashboard API (`app/api/dashboard/`)

**Date**: 2026-04-11  
**Type**: Module  
**Focus**: Security, Performance, Code Quality, Understanding  
**Scope**: `app/api/dashboard/` (3 route files), `lib/dashboard/stats-config.ts`, consumers (`PriorityFeed.tsx`, `StatsGrid.tsx`)

---

## Context

Full analysis of the Dashboard API module — the endpoints that power the resident dashboard's priority feed and stats grid. This module is user-facing, called on every dashboard load, and directly impacts perceived performance.

---

## Prior Work

### Wiki Patterns (Relevant)
- **Wiki reference:** `knowledge/wiki/patterns/default-query-limits.md` — tenant-scoped lists need default limits
- **Wiki reference:** `knowledge/wiki/patterns/batch-rpc-counts.md` — batch RPC for count enrichment
- **Wiki reference:** `knowledge/wiki/patterns/security-patterns.md` — BFF-first security, PII redaction

### Existing Audits
- `audit_2026-04-11_full_codebase.md` — Flagged "Dashboard N sequential queries" (Finding #5, HIGH) and "Client-side check-in filtering" (Finding #6, HIGH)
- `audit_2026-04-11_api_crosscutting.md` — Listed `/api/dashboard/` as "⚠️ Partial — Performance only — No security audit"
- `audit_2026-04-11_app_module.md` — Listed "Unoptimized dashboard stats" as HIGH severity

### Build Logs
- `knowledge/raw/refactoring/2026-04-11_debug_console_removal.md` — References `lib/dashboard/stats-config.ts` unknown persona log

---

## Understanding Mapping

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Resident Dashboard Page                      │
│  ┌──────────────────────┐    ┌───────────────────────────────┐  │
│  │   StatsGrid.tsx      │    │   PriorityFeed.tsx            │  │
│  │   useSWR + fetch     │    │   useSWR + 30s refresh        │  │
│  │   GET/POST /stats    │    │   GET /priority               │  │
│  └──────────┬───────────┘    └───────────────┬───────────────┘  │
└─────────────┼────────────────────────────────┼──────────────────┘
              │                                │
              ▼                                ▼
┌─────────────────────────┐    ┌──────────────────────────────────┐
│ /api/dashboard/stats/   │    │ /api/dashboard/priority/         │
│ route.ts (GET + POST)   │    │ route.ts (GET)                   │
│ - 12 stat definitions   │    │ - 9 parallel DB queries          │
│ - calculateStat()       │    │ - enrichment query for events    │
│ - config persistence    │    │ - scoring + sorting              │
└──────────┬──────────────┘    └──────────┬───────────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (via createClient)                  │
│  Tables: users, events, announcements, check_ins,               │
│          exchange_transactions, exchange_listings,              │
│          event_rsvps, saved_events, announcement_reads,         │
│          resident_requests, neighborhoods                       │
└─────────────────────────────────────────────────────────────────┘
```

### Route Inventory

| Route | Methods | Purpose | Lines |
|-------|---------|---------|-------|
| `/api/dashboard/stats/route.ts` | GET, POST | Fetch/calculate dashboard stats; persist user config | 275 |
| `/api/dashboard/stats/config/route.ts` | POST | Alternative config endpoint (duplicates POST in stats/route.ts) | 58 |
| `/api/dashboard/priority/route.ts` | GET | Compute priority feed with scoring algorithm | 394 |

### Data Flow — Stats (GET)

1. Auth check via `supabase.auth.getUser()`
2. Fetch `dashboard_stats_config` + `tenant_id` from `users` table
3. Parse config (handles legacy object vs array format)
4. `Promise.all()` calls `calculateStat()` for each configured stat
5. Each stat = 1 DB query (sequential within Promise.all, but supabase client is shared)
6. Returns `{ stats, config, available, scope }`

### Data Flow — Priority (GET)

1. Auth check via `supabase.auth.getUser()`
2. Fetch resident record (role = "resident")
3. `Promise.all()` of 9 parallel queries (announcements, reads, RSVPs, saved events, check-ins, exchange requests, confirmed, lender due, borrower due)
4. Enrichment query for events (second round, sequential)
5. Process all results into `priorityItems[]` with scoring
6. Sort by type → score → timestamp
7. Return top 6 items

### Consumers

| Consumer | File | API Used |
|----------|------|----------|
| StatsGrid | `components/dashboard/StatsGrid.tsx` | GET/POST `/api/dashboard/stats` |
| PriorityFeed | `components/ecovilla/dashboard/PriorityFeed.tsx` | GET `/api/dashboard/priority` |
| Event RSVP actions | `components/event-rsvp-quick-action.tsx` | `mutate('/api/dashboard/priority')` |
| Event detail RSVP | `app/t/[slug]/dashboard/events/[eventId]/event-rsvp-section.tsx` | `mutate('/api/dashboard/priority')` |
| Stats test page | `app/t/[slug]/dashboard/stats-test/page.tsx` | GET/POST both endpoints |

---

## Findings

### Critical

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| C1 | **Duplicate config endpoints** — Two POST endpoints do the same thing with different validation | `stats/route.ts:243-275` vs `stats/config/route.ts:5-58` | Consolidate into one endpoint; remove `/stats/config/route.ts` |
| C2 | **No rate limiting on any dashboard endpoint** | All 3 route files | Add rate limiting — PriorityFeed polls every 30s, could be abused |

### High

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| H1 | **N sequential DB queries in stats endpoint** — `Promise.all` calls `calculateStat()` N times (up to 12), each making a separate DB query | `stats/route.ts:219-228` | Use batch RPC or single query with multiple COUNTs |
| H2 | **Client-side check-in filtering** — Fetches ALL active check-ins with `ended_at IS NULL`, filters by duration in JS | `stats/route.ts:86-100` | Create RPC `get_active_checkins_count(tenant_id)` with server-side date arithmetic |
| H3 | **`any` type on supabase parameter** — `calculateStat(supabase: any, ...)` loses all type safety | `stats/route.ts:30` | Type the supabase parameter properly |
| H4 | **Priority route uses `any[]` for priorityItems** — `const priorityItems: any[] = []` | `priority/route.ts:161` | Define `PriorityItem` interface |
| H5 | **Excessive `@ts-ignore` comments** — 12 instances in priority route | `priority/route.ts:247-355` | Fix type definitions for nested Supabase join results |
| H6 | **No tenant isolation verification in priority route** — Only checks `role = "resident"` but doesn't verify user belongs to the tenant they're querying | `priority/route.ts:26-36` | Add explicit tenant context validation |

### Medium

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| M1 | **Stats config POST has no input validation** — `stats/route.ts:250-254` only checks `Array.isArray` and length ≤ 13, but doesn't validate stat IDs | `stats/route.ts:250-254` | Add validation against `AVAILABLE_STATS` |
| M2 | **Inconsistent config validation between two POST endpoints** — `stats/config/route.ts` validates stat IDs and requires exactly 4; `stats/route.ts` doesn't | Both POST endpoints | Unify validation logic |
| M3 | **PriorityFeed fetcher has no auth headers** — `fetcher = (url) => fetch(url).then(res => res.json())` relies on cookies only | `PriorityFeed.tsx:70` | Add credentials: 'include' explicitly |
| M4 | **StatsGrid fetcher has no auth headers** — Same issue | `StatsGrid.tsx:10` | Add credentials: 'include' explicitly |
| M5 | **Priority route returns 404 for non-residents** — If user has `tenant_admin` role, they get 404 instead of priority feed | `priority/route.ts:33-36` | Support all authenticated roles or return empty feed |
| M6 | **Hardcoded score constants** — Priority scores are magic numbers at top of file | `priority/route.ts:5-13` | Extract to config file or database |
| M7 | **Description truncation can produce broken strings** — `description?.substring(0, 100) + "..."` may cut mid-word or mid-HTML | `priority/route.ts:170,227` | Use word-boundary-aware truncation |
| M8 | **`dangerouslySetInnerHTML` in PriorityFeed** — Description from API is rendered as HTML | `PriorityFeed.tsx:538` | Sanitize HTML or use plain text |

### Low

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| L1 | **Console.log in production code** — `[Dashboard/Stats] Success: Loaded config...` | `stats/route.ts:197` | Remove or convert to structured logging |
| L2 | **Stats test page should not be in production** | `app/t/[slug]/dashboard/stats-test/page.tsx` | Gate behind dev-only flag or remove |
| L3 | **localStorage for dismissed items** — `dismissed_priority_items` stored in localStorage, not synced across devices | `PriorityFeed.tsx:98-101` | Consider server-side dismissal tracking |
| L4 | **SWR refreshInterval of 30s may cause unnecessary load** | `PriorityFeed.tsx:78` | Consider increasing to 60s or using on-demand revalidation |
| L5 | **`stats/config/route.ts` imports from `lib/dashboard/stats-config.ts` but `stats/route.ts` defines its own `AVAILABLE_STATS`** — Two sources of truth | `stats/route.ts:5-21` vs `stats/config/route.ts:3` | Use single source of truth |

---

## Security Analysis

### Auth Enforcement
- **All routes** use `createClient()` (anon key, RLS-enforced) — ✅ Good
- **All routes** call `supabase.auth.getUser()` — ✅ Good
- **Middleware** runs `updateSession()` on all requests — ✅ Good
- **No route** uses `createAdminClient()` — ✅ Good (RLS is respected)

### Tenant Isolation
- **Stats route**: Uses `userData.tenant_id` from DB — ✅ Good
- **Priority route**: Uses `resident.tenant_id` from DB — ✅ Good
- **Both** scope queries to tenant — ✅ Good

### Input Validation
- **Stats POST**: Minimal validation (array check + length) — ⚠️ Weak
- **Stats/config POST**: Better validation (array + length + ID validation) — ✅ Good
- **Priority GET**: No user input — ✅ N/A

### Data Exposure
- **Priority route** returns user names, avatars, listing titles — appropriate for dashboard context
- **No PII leakage** detected beyond what's expected for a dashboard
- **`dangerouslySetInnerHTML`** in PriorityFeed is a potential XSS vector if description contains unsanitized HTML — ⚠️ Medium risk

### Rate Limiting
- **No rate limiting** on any dashboard endpoint — 🔴 Critical gap
- PriorityFeed auto-refreshes every 30s, meaning each active dashboard generates 2 requests/minute
- At scale (1000 concurrent users), this is 2000 requests/minute to these endpoints alone

---

## Performance Analysis

### Stats Endpoint

| Metric | Current | Impact | Recommendation |
|--------|---------|--------|---------------|
| DB queries per request | N (up to 12) | HIGH | Batch into single query or use RPC |
| Client-side filtering | Check-ins (fetch all, filter in JS) | MEDIUM | Server-side filtering via RPC |
| Caching | None | HIGH | Add SWR stale-while-revalidate with reasonable stale time |
| Response size | Small (4 stat objects) | LOW | Acceptable |

**Estimated current cost**: 4-12 sequential DB queries per dashboard load  
**Optimized cost**: 1-2 queries (batched)

### Priority Endpoint

| Metric | Current | Impact | Recommendation |
|--------|---------|--------|---------------|
| DB queries per request | 9 parallel + 1 enrichment | MEDIUM | Good parallelism, but could reduce with batch RPCs |
| Data fetched | Up to 50 announcements, 5 check-ins, all exchange transactions | MEDIUM | Add tighter limits |
| Sorting | In-memory sort of all items, then slice(0,6) | LOW | Acceptable for small datasets |
| Response size | Up to 6 items | LOW | Acceptable |

**Estimated current cost**: 10 DB queries per dashboard load  
**Optimized cost**: 5-6 queries (batched exchange queries)

### Combined Dashboard Load

A full dashboard page load triggers:
1. Stats GET (4-12 queries)
2. Priority GET (10 queries)
3. Plus other widgets (events, announcements, etc.)

**Total: 14-22+ DB queries per page load** — This is the primary performance concern.

---

## Code Quality Analysis

### Type Safety: C-

| Issue | Count | Severity |
|-------|-------|----------|
| `any` types | 3+ (`supabase: any`, `priorityItems: any[]`, `otherParty: any`) | HIGH |
| `@ts-ignore` comments | 12 | HIGH |
| Missing return type on `calculateStat` | 1 | MEDIUM |
| Inconsistent `AVAILABLE_STATS` definitions | 2 (route.ts vs stats-config.ts) | HIGH |

### Consistency: C

| Issue | Details |
|-------|---------|
| Two config endpoints | `stats/route.ts` POST and `stats/config/route.ts` POST do the same thing |
| Two `AVAILABLE_STATS` arrays | One in `stats/route.ts`, one in `lib/dashboard/stats-config.ts` — different schemas |
| Inconsistent validation | Stats POST doesn't validate IDs; config POST does |
| Mixed error handling | Some routes return `{ error }`, others throw |

### Maintainability: B-

| Aspect | Assessment |
|--------|-----------|
| Code organization | Clear route structure, but priority route is 394 lines in one function |
| Separation of concerns | Business logic (scoring, stat calculation) mixed with route handlers |
| Testability | Low — no tests, tight coupling to Supabase client |
| Documentation | Inline comments explain intent but no API docs |

---

## Recommendations

### Immediate (This Sprint)

- [ ] **C1: Remove duplicate `/api/dashboard/stats/config/route.ts`** — Consolidate into `stats/route.ts` POST. The config route has better validation; migrate that logic.
- [ ] **C2: Add rate limiting** — At minimum, 10 req/10s per user on both endpoints. Use the same pattern as `withAuth` middleware.
- [ ] **H1: Batch stats queries** — Replace N sequential queries with a single multi-count query or batch RPC. Target: 1-2 queries instead of 4-12.
- [ ] **H2: Server-side check-in filtering** — Create RPC `get_active_checkins_count(tenant_id)` to eliminate client-side filtering.

### Short-term (Next Sprint)

- [ ] **H3-H5: Fix type safety** — Remove `any` types, eliminate `@ts-ignore` comments, define `PriorityItem` interface
- [ ] **H6: Add tenant context validation** — Verify user's tenant matches the route's tenant scope
- [ ] **M1-M2: Unify input validation** — Single validation function for stats config
- [ ] **M8: Sanitize HTML in PriorityFeed** — Use DOMPurify or switch to plain text rendering
- [ ] **L5: Single source of truth for AVAILABLE_STATS** — Move to `lib/dashboard/stats-config.ts` and import everywhere

### Medium-term (Backlog)

- [ ] **Add caching layer** — Consider Redis or Next.js revalidate for stats (change infrequently)
- [ ] **Extract business logic** — Move scoring algorithm and stat calculation to `lib/dashboard/` for testability
- [ ] **Add tests** — Unit tests for `calculateStat()`, integration tests for both endpoints
- [ ] **Increase SWR refresh interval** — 60s instead of 30s for PriorityFeed
- [ ] **Server-side dismissal tracking** — Replace localStorage with DB-backed dismissed items

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Rate limit abuse (DoS) | Medium | High | Add rate limiting |
| XSS via dangerouslySetInnerHTML | Low | High | Sanitize HTML input |
| Stats endpoint overload at scale | High | Medium | Batch queries + caching |
| Config inconsistency causing bugs | Medium | Low | Consolidate endpoints |
| Type errors in production | Medium | Medium | Remove `any` and `@ts-ignore` |

---

*Audit completed: 2026-04-11*  
*Next audit recommended: After immediate fixes are applied*
