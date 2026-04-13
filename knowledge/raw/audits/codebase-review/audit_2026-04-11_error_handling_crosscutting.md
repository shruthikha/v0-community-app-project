# Audit: Error Handling (Cross-Cutting)

**Date**: 2026-04-11
**Type**: Cross-cutting
**Focus**: Security, Performance, Code Quality, Understanding
**Scope**: `app/actions/`, `app/api/`, `lib/data/`, `lib/api/`, `lib/supabase/middleware.ts`, `components/`, `app/t/[slug]/`, `app/backoffice/`

## Context

This audit examines how errors are created, propagated, caught, and displayed across the entire Ecovilla Community Platform. Error handling is a cross-cutting concern that touches every layer: server actions, API routes, data access, middleware, and UI components. The goal is to identify security risks from error information leakage, performance impacts from error patterns, code quality issues from inconsistency, and map the full error flow architecture.

## Prior Work

### Existing Audits Referenced
- `knowledge/raw/audits/audit_2026-04-11_full_codebase.md` — Noted "3 different error handling patterns" as MEDIUM quality finding
- `knowledge/raw/audits/audit_2026-04-11_data_flow_crosscutting.md` — M4: "Inconsistent error handling patterns" across multiple files
- `knowledge/raw/audits/audit_2026-04-11_auth_crosscutting.md` — Noted inconsistent error handling in login flows
- `knowledge/raw/audits/audit_2026-04-11_api_crosscutting.md` — Mixed error handling noted (some routes return `{ error }`, others throw)
- `knowledge/raw/audits/audit_2026-04-11_cron_module.md` — M5: No shared cron middleware/wrapper pattern
- `knowledge/raw/audits/audit_2026-04-11_components_module.md` — HIGH: Add error boundaries; MEDIUM: Standardize error handling
- `knowledge/raw/audits/audit_2026-04-11_backoffice_module.md` — M5: Slug collision error handling leaks raw Supabase errors
- `knowledge/raw/audits/audit_2026-04-11_upload-api.md` — Error handler returns `error.message` directly to client

### Refactoring Opportunities
- `knowledge/raw/refactoring/2026-04-11_error_handling_patterns.md` — Documents 3 coexisting patterns, recommends standardization (status: open)
- `knowledge/raw/refactoring/2026-04-11_upload-error-leakage.md` — Upload route leaks `error.message` (status: open)

### Wiki Gaps
- `knowledge/wiki/documentation-gaps.md` — Explicitly lists missing `knowledge/wiki/patterns/standardized-error-handling.md`

### Wiki Patterns Referenced
- `knowledge/wiki/concepts/validation-boundary.md` — Where raw input becomes trusted data
- `knowledge/wiki/tools/api-route-patterns.md` — Route validation, auth, error handling expectations
- `knowledge/wiki/tools/server-actions-patterns.md` — Mutation boundary conventions
- `knowledge/wiki/patterns/zod-validation.md` — Zod at the boundary
- `knowledge/wiki/lessons/rate-limiting.md` — Try-catch scope for rate limiting
- `knowledge/wiki/lessons/pii-log-redaction.md` — Redact PII in logs
- `knowledge/wiki/lessons/bff-timeout-guards.md` — Timeout guard patterns

## Understanding Mapping: Error Flow Architecture

### Error Creation Points

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR CREATION POINTS                            │
│                                                                     │
│  Layer              Pattern                    Count                │
│  ──────────────────────────────────────────────────────────────     │
│  Server Actions     throw new Error()          10 files             │
│  Server Actions     return {success:false}     22 files             │
│  Server Actions     No try/catch               10 files             │
│  API Routes         NextResponse.json(error)   18+ files (legacy)   │
│  API Routes         errorResponse()            14 files (v1)        │
│  API Routes         No try/catch               3 files              │
│  Data Layer         Swallow + return []        7/7 files            │
│  Data Layer         Error not destructured     23 instances         │
│  Middleware         catch + log + continue     1 (supabase)         │
│  Middleware         catch + errorResponse()    3 (api wrapper)      │
│  UI Components      alert()                    24 calls, 14 files   │
│  UI Components      toast/sonner               ~280 calls, 40+ files│
│  UI Components      console.error only         ~71 calls, 35 files  │
│  UI Components      Silent (empty catch)       ~8 files             │
└─────────────────────────────────────────────────────────────────────┘
```

### Error Propagation Paths

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR PROPAGATION FLOW                           │
│                                                                     │
│  Path 1: Server Action → Component                                  │
│    action() → { success: false, error: "Supabase error message" }  │
│    → Component checks result.success → alert() or toast()           │
│    PROBLEM: Supabase error.message leaked to client                 │
│                                                                     │
│  Path 2: API Route → Client                                         │
│    route() → NextResponse.json({ error: error.message })            │
│    → Client receives raw DB error                                   │
│    PROBLEM: Internal details exposed                                │
│                                                                     │
│  Path 3: API Route (v1) → Client                                    │
│    route() → withTenantIsolation → errorResponse(APIError)          │
│    → Client receives { success: false, error: { message, code } }   │
│    GOOD: Structured, but message may still leak if APIError wraps   │
│          a raw Supabase error                                       │
│                                                                     │
│  Path 4: Data Layer → Caller                                        │
│    getEvents() → error → console.error → return []                  │
│    → Caller sees empty array, cannot distinguish "no data" vs "DB   │
│       down"                                                         │
│    PROBLEM: Error swallowed, caller has no signal                   │
│                                                                     │
│  Path 5: Middleware → Response                                      │
│    updateSession() → error → console.log → NextResponse.next()      │
│    → Request continues without auth refresh                         │
│    ACCEPTABLE: Graceful degradation for edge runtime                │
│                                                                     │
│  Path 6: UI Component → User                                        │
│    action() → !result.success → alert("Error message")              │
│    PROBLEM: alert() blocks thread, inaccessible, unstyled           │
└─────────────────────────────────────────────────────────────────────┘
```

### Error Response Shapes (3 Coexisting Standards)

| Shape | Used By | Files |
|-------|---------|-------|
| `{ success: false, error: string }` | Server actions (most) | ~20 files |
| `{ success: false, error: { message, code, details? } }` | v1 API routes | 14 files |
| `{ error: string }` | Legacy API routes | 18+ files |
| `throw new Error()` | Server actions (some) | 10 files |
| `[]` / `null` / `{}` | Data layer (on error) | 7 files |

## Findings

### Critical

| # | Finding | Files | Recommendation |
|---|---------|-------|---------------|
| C1 | **Systematic Supabase error.message leakage to clients** (~80+ instances) | Nearly every file in `app/actions/`, `app/api/` | Replace all `error.message` exposure with generic messages. Log full error server-side only. |
| C2 | **SQL injection pattern in announcements.ts** | `app/actions/announcements.ts:19` | Use parameterized query instead of string interpolation in `.not("id", "in", "(SELECT...)")` |
| C3 | **Unauthenticated sensitive endpoints** (5 files) | `app/api/upload/route.ts`, `app/api/upload/delete/route.ts`, `app/api/locations/route.ts`, `app/api/tenant/route.ts`, `app/api/tenant-map-center/route.ts` | Add auth checks. `upload/delete` is especially critical — anyone can delete files. |
| C4 | **Missing auth on server actions** (6 files) | `app/actions/interests.ts`, `tenant-features.ts`, `event-categories.ts`, `exchange-history.ts`, `neighborhoods.ts`, `neighbor-lists.ts` | Add `supabase.auth.getUser()` check to all exported functions |
| C5 | **No error boundaries anywhere in the app** | Entire `app/` directory | Add `error.tsx` at route level, `global-error.tsx` at root, React Error Boundary for client components |
| C6 | **TOCTOU race conditions in exchange transactions** | `app/actions/exchange-transactions.ts` (markItemPickedUp, markItemReturned, cancelTransaction) | Use atomic `SET available_quantity = available_quantity - $1` instead of read-then-update |

### High

| # | Finding | Files | Recommendation |
|---|---------|-------|---------------|
| H1 | **PII leakage in debug console.log statements** | `lib/data/residents.ts:158,169,179-184`, `app/actions/families.ts:280-298`, `app/actions/check-ins.ts:28-35,76-97`, `app/actions/reservations.ts:27` | Gate all debug logs behind `NODE_ENV !== 'production'` or remove entirely |
| H2 | **24 alert() calls in 14 files** | Exchange widgets, admin forms, backoffice forms | Replace with toast/sonner — alert() blocks main thread, inaccessible, breaks mobile UX |
| H3 | **Data layer systematically swallows all errors** | All 7 files in `lib/data/` | Return explicit error types or Result<T, E> so callers can distinguish "no data" from "DB down" |
| H4 | **All 5 getById functions don't destructure error** | `lib/data/residents.ts`, `events.ts`, `locations.ts`, `families.ts`, `resident-requests.ts` | Destructure `{ data, error }` and handle error explicitly |
| H5 | **No error handling in 3 API route files** | `app/api/locations/[tenantId]/route.ts`, `app/api/seed-event-categories/route.ts`, `app/api/seed-exchange-categories/route.ts` (partial) | Add try/catch to prevent unhandled exceptions |
| H6 | **Dual toast systems (shadcn useToast + sonner)** | ~40+ files using sonner, ~20+ using useToast | Consolidate to one system. Root layout has shadcn `<Toaster />` but many components import sonner directly |
| H7 | **~8 components with silent failures** (empty catch or console.error only) | `announcement-card.tsx`, `document-card.tsx`, `checkin-notification-card.tsx`, etc. | Show user-facing error feedback via toast |
| H8 | **Cron routes leak error details** | `app/api/cron/archive-announcements/route.ts:32,68,90` | Remove `details` field from error responses. Line 90 exposes `String(error)` which may include stack traces |

### Medium

| # | Finding | Files | Recommendation |
|---|---------|-------|---------------|
| M1 | **No Zod validation on 21 of 24 server action files** | All except `auth-actions.ts`, `documents.ts`, `events.ts` (partial) | Add Zod schemas for all action inputs |
| M2 | **No Zod validation on 8 API routes** | Various legacy routes | Add Zod or use ValidationError pattern |
| M3 | **14 enrichment sub-queries in data layer have no error handling** | `lib/data/events.ts`, `locations.ts`, `resident-requests.ts`, `check-ins.ts`, `exchange.ts` | Destructure and check errors on all enrichment queries |
| M4 | **No tenant context in error logs** | All `lib/data/*.ts` console.error calls | Include `tenantId` in error logs for multi-tenant debugging |
| M5 | **`context: any` in 7 v1 routes** | Routes using `withTenantIsolation` | Type as `TenantContext` |
| M6 | **No route-level loading.tsx or not-found.tsx** | Entire `app/` directory | Add streaming fallbacks and branded 404 page |
| M7 | **Inconsistent error return from read functions** | Server actions: some return `[]`, some `null`, some `{ success: false }` | Define a consistent contract for read operations |
| M8 | **Rate limiting fails open** | `lib/rate-limit.ts:31-36`, `lib/api/middleware.ts:74-77` | Fail closed in production — deny requests when rate limiting degrades |
| M9 | **Inline service role client creation** | `app/actions/families.ts:8-19`, `app/actions/events.ts:2191-2211` | Use centralized `createAdminClient()` instead of inline env var access |
| M10 | **Non-atomic delete-then-insert patterns** | `app/actions/profile.ts` (interests/skills), `app/actions/events.ts` (recurring events) | Wrap in transaction or use upsert |

### Low

| # | Finding | Files | Recommendation |
|---|---------|-------|---------------|
| L1 | **Inconsistent console.error log prefixes** | `lib/data/exchange.ts:311` missing `[prefix]` format | Standardize log prefix format across all files |
| L2 | **getLocationCounts silently swallows errors with zero logging** | `lib/data/locations.ts:467-469` | At minimum log the error |
| L3 | **Magic constants not centralized** | Timeout values, rate limits scattered across files | Extract to shared config |
| L4 | **`catch (error: any)` in multiple files** | Various | Type as `unknown` and narrow with instanceof |
| L5 | **Excessive console.log in production API routes** | `app/api/announcements/unread/[tenantId]/route.ts`, `app/api/tenant-map-center/route.ts` | Gate behind NODE_ENV check or use structured logger |

## Security Analysis

### Information Leakage Matrix

| Layer | What Leaks | Severity | Instances |
|-------|-----------|----------|-----------|
| Server Actions | Supabase `error.message` (table names, constraint names, RLS details) | CRITICAL | ~65+ |
| API Routes | Supabase `error.message`, upstream Railway agent errors, `String(error)` with stack | CRITICAL | ~14 |
| Cron Routes | Supabase `error.message`, `fetchError.message`, `String(error)` | HIGH | 4 |
| Data Layer | PII in console.log (user IDs, names, tenant IDs) | HIGH | 4 instances in residents.ts |
| Server Actions | Debug logs with coordinates, user IDs, family IDs | HIGH | 4 files |
| API Routes | User IDs and tenant IDs in console.error | MEDIUM | 12+ |
| UI Components | Full error objects in browser console | MEDIUM | 71 calls in 35 files |

### Attack Surface from Error Handling

1. **Schema Enumeration**: An attacker can trigger errors to learn table names, column names, constraint names, and RLS policy details from leaked `error.message` strings.
2. **File Deletion**: `app/api/upload/delete/route.ts` has no auth — anyone can delete files by URL, and errors leak internal paths.
3. **Injection Bypass**: `app/actions/rio-settings.ts` leaks injection detection patterns to the client (lines 41, 49), enabling attackers to craft bypass payloads.
4. **Tenant Data Exposure**: 3 API routes accept `tenantId` without verifying user membership, potentially allowing cross-tenant data access.

## Performance Analysis

| Issue | Impact | Files |
|-------|--------|-------|
| Error swallowing hides infrastructure failures | Users see empty states instead of error states, operators can't detect outages | All `lib/data/` files |
| No AbortController timeouts on AI routes | Can hang indefinitely on upstream failures | `app/api/v1/ai/threads/active/route.ts` |
| Non-atomic operations cause retry storms | Partial failures require full retry of multi-step operations | `app/actions/events.ts` (recurring), `app/actions/profile.ts` (interests) |
| Missing error boundaries cause full page crashes | Single component error crashes entire React tree | All client components |

## Code Quality Analysis

### Consistency Score by Layer

| Layer | Consistency | Notes |
|-------|------------|-------|
| v1 API Routes | ✅ Good | 12/14 use middleware + errorResponse/successResponse |
| Legacy API Routes | ❌ Poor | 18+ files with inline error handling, no standard |
| Server Actions | ❌ Poor | 3+ different patterns, some files mix within themselves |
| Data Layer | ⚠️ Consistently Bad | All 7 files swallow errors the same wrong way |
| UI Components | ❌ Poor | alert(), toast, sonner, console.error, silent — all coexist |
| Middleware | ✅ Good | Consistent try/catch with graceful degradation |
| Cron Routes | ⚠️ Mixed | Both have try/catch but leak error details differently |

### Pattern Maturity

| Pattern | Maturity | Coverage |
|---------|----------|----------|
| `lib/api/errors.ts` custom error classes | ✅ Well-designed | Used by 11 files |
| `lib/api/response.ts` response helpers | ✅ Well-designed | Used by 14 files |
| `lib/api/middleware.ts` wrappers | ✅ Well-designed | Used by 12 files |
| Zod validation | ⚠️ Partial | 3 server action files, 3 API routes |
| Error boundaries | ❌ Missing | 0 files |
| Standardized server action error contract | ❌ Missing | No convention |

## Recommendations

### Immediate (This Sprint) — 🔴 Blockers

- [ ] **C1: Stop leaking Supabase error.message to clients** — Create a helper like `sanitizeError(error)` that returns generic messages for client-facing errors while logging full details server-side. Apply to all ~80 instances.
- [ ] **C2: Fix SQL injection pattern** in `app/actions/announcements.ts:19` — Replace string interpolation with parameterized query.
- [ ] **C3: Add auth to unauthenticated endpoints** — Especially `upload/delete` which allows anyone to delete files.
- [ ] **C4: Add auth checks to 6 server action files** — `interests.ts`, `tenant-features.ts`, `event-categories.ts`, `exchange-history.ts`, `neighborhoods.ts`, `neighbor-lists.ts`.
- [ ] **C5: Add error boundaries** — At minimum: `app/t/[slug]/error.tsx`, `app/backoffice/error.tsx`, `app/global-error.tsx`.
- [ ] **C6: Fix TOCTOU race conditions** in `exchange-transactions.ts` — Use atomic quantity updates.

### Short-term (Next Sprint) — 🟡 Should Fix

- [ ] **H1: Remove/gate all debug console.log statements** — Gate behind `NODE_ENV !== 'production'` or remove.
- [ ] **H2: Replace all 24 alert() calls** with toast/sonner.
- [ ] **H3: Fix data layer error swallowing** — Return explicit error types so callers can distinguish "no data" from "DB down".
- [ ] **H4: Fix all 5 getById functions** to destructure and check errors.
- [ ] **H5: Add try/catch to 3 API routes** with no error handling.
- [ ] **H6: Consolidate toast systems** — Pick one (recommend sonner), migrate all components.
- [ ] **H7: Fix ~8 silent failure components** — Add user-facing error feedback.
- [ ] **H8: Fix cron route error leakage** — Remove `details` fields from error responses.

### Medium-term (Backlog) — 💭 Nice to Have

- [ ] **M1: Add Zod validation to all server actions** — Create shared schemas in `lib/validation/`.
- [ ] **M2: Add Zod validation to all API route handlers** — Use ValidationError + errorResponse pattern.
- [ ] **M3: Fix 14 enrichment sub-query error handling** in data layer.
- [ ] **M4: Add tenant context to all error logs**.
- [ ] **M5: Type `context` as `TenantContext`** in all v1 routes.
- [ ] **M6: Add route-level loading.tsx and not-found.tsx**.
- [ ] **M7: Define consistent error return contract** for read operations.
- [ ] **M8: Make rate limiting fail-closed** in production.
- [ ] **M9: Centralize service role client creation** — Remove inline env var access.
- [ ] **M10: Wrap non-atomic operations in transactions**.
- [ ] **Create `knowledge/wiki/patterns/standardized-error-handling.md`** — Document the chosen convention.
- [ ] **Integrate error tracking service** (Sentry/PostHog) for production error reporting.

## Files Analyzed

| Area | Files | Lines (approx) |
|------|-------|----------------|
| `app/actions/` | 24 files | ~8,000+ |
| `app/api/` | 41 files | ~5,000+ |
| `lib/data/` | 9 files | ~2,500+ |
| `lib/api/` | 4 files (errors, response, middleware, public-rate-limit) | ~400 |
| `lib/supabase/middleware.ts` | 1 file | 126 |
| `components/` | ~100+ files scanned | ~15,000+ |
| `app/t/[slug]/` | Route-level files scanned | — |
| `app/backoffice/` | Route-level files scanned | — |

---

*Audit completed: 2026-04-11*
*Agents invoked: @backend-specialist (server actions, API routes, data layer), @frontend-specialist (UI components)*
