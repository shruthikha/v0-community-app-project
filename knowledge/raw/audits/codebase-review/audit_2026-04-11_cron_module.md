# Audit: Cron Jobs (`app/api/cron`)

**Date**: 2026-04-11
**Type**: Module
**Focus**: Security, Performance, Code Quality, Architecture
**Scope**: `app/api/cron/check-return-dates/route.ts`, `app/api/cron/archive-announcements/route.ts`, `vercel.json`, `middleware.ts`

## Context

Full-depth audit of the two cron job routes in the Ecovilla Community Platform. Both are scheduled via Vercel Cron to run daily at midnight UTC. The audit covers security vulnerabilities, performance bottlenecks, code quality issues, and architectural concerns.

## Prior Work

- `audit_2026-04-11_api_crosscutting.md` — Prior API audit mentioned `/api/cron/` in inventory but did not deep-dive
- `audit_2026-04-11_full_codebase.md` — Full codebase scan, no cron-specific findings
- No prior cron-specific audits found in `knowledge/raw/audits/`
- No wiki patterns for cron jobs found in `knowledge/wiki/`

## Files Audited

| File | Lines | Purpose |
|------|-------|---------|
| `app/api/cron/check-return-dates/route.ts` | 182 | Daily check for upcoming/overdue return dates, sends notifications |
| `app/api/cron/archive-announcements/route.ts` | 94 | Daily archive of expired announcements |
| `vercel.json` | 12 | Cron schedule definitions |
| `lib/supabase/server.ts` | 30 | SSR client (anon key, RLS-bound) |
| `lib/supabase/admin.ts` | 26 | Admin client (service_role, RLS-bypass) |
| `app/actions/notifications.ts` | 301 | Notification CRUD server actions |
| `lib/notification-utils.ts` | 200 | Notification title/message generators |
| `middleware.ts` | 10 | Next.js middleware (runs on ALL routes including cron) |

---

## Findings

### Critical

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| C1 | **RLS blocks all `exchange_transactions` reads** — `createServerClient()` uses anon key with no user session. RLS policies require `borrower_id = auth.uid()` or `lender_id = auth.uid()`. Since `auth.uid()` is NULL, **the cron silently returns zero results every day**. No reminders or overdue notifications are ever sent. | `check-return-dates/route.ts:25-43` | Switch to `createAdminClient()` (service_role) to bypass RLS |
| C2 | **RLS blocks all `announcements` reads/updates** — Same root cause as C1. The `announcements` table RLS requires tenant admin role. **Expired announcements are never archived.** | `archive-announcements/route.ts:18,52-63` | Switch to `createAdminClient()` (service_role) to bypass RLS |
| C3 | **CRON_SECRET authentication is optional** — Both routes only enforce auth if `CRON_SECRET` env var is set. If missing (common in dev, possible in misconfigured prod), **anyone on the internet can call these endpoints**. Once C1/C2 are fixed with service_role, this becomes a critical attack vector. | Both route files | Make `CRON_SECRET` mandatory — fail closed, not open. Return 500 if not configured. |

### High

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| H1 | **N+1 query pattern** — For each transaction, up to 6 DB calls (3 existence checks + 3 inserts). At 1000 transactions = 6,000 queries. Will timeout on Vercel serverless limits. | `check-return-dates/route.ts:73-165` | Batch existence checks into single query, batch-insert notifications. Reduces to ~3 queries total. |
| H2 | **`createNotification()` return value not checked** — Failed notifications are silently dropped. Counters increment regardless of success. No logging of failures. | `check-return-dates/route.ts:95,125,152` | Check return value, log failures, adjust counters accordingly |
| H3 | **No Vercel function timeout protection** — No `maxDuration` export. With N+1 pattern, will timeout at ~50-100 transactions on Hobby plan (10s limit). | Both route files | Add `export const maxDuration = 60` and timeout-aware processing loop with early exit |
| H4 | **Error responses leak internal details** — `archive-announcements` returns `details: String(error)` and `details: fetchError.message`. Exposes DB schema, RLS violations, internal URLs. | `archive-announcements/route.ts:31-34,67-70,89-91` | Return generic error messages; log details server-side only |
| H5 | **Middleware unnecessarily processes cron requests** — Every cron invocation runs `updateSession()` which calls `supabase.auth.getUser()`. Wasted DB call, adds 100-200ms latency. | `middleware.ts:9`, `lib/supabase/middleware.ts:42-43` | Exclude `/api/cron/*` from middleware matcher |
| H6 | **`notifications_insert_service` RLS policy too permissive** — Policy allows any authenticated user to insert notifications for any recipient. While cron usage is legitimate, the policy creates a broader vulnerability. | `clean_schema_final.sql:4406` | Tighten INSERT policy to `service_role` only, or require `recipient_id = auth.uid()` |

### Medium

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| M1 | **Date filtering done in JS instead of database** — Fetches ALL active transactions, filters in JavaScript. Wastes data transfer and memory at scale. | `check-return-dates/route.ts:57-59,83,113` | Push date filtering to DB with `.lt()` and `.gte()`/`.lte()` on `expected_return_date` |
| M2 | **`as any` type cast on join result** — Bypasses TypeScript type checking. If join shape changes, won't be caught at compile time. | `check-return-dates/route.ts:79` | Define proper interface for query result type |
| M3 | **Inconsistent Supabase client import** — `check-return-dates` imports `createServerClient`, `archive-announcements` imports `createClient`. Same function, different names. | Both route files | Standardize on `createServerClient` |
| M4 | **Hardcoded lender overdue message bypasses utility** — Borrower uses `generateNotificationMessage()`, lender constructs inline. Inconsistent format, locale-dependent. | `check-return-dates/route.ts:157` | Use utility function consistently for both borrower and lender |
| M5 | **No shared cron middleware/wrapper pattern** — Auth verification, logging, error handling duplicated across both routes. Adding a third cron requires copy-pasting ~20 lines. | Both route files | Create `withCronHandler()` wrapper in `lib/cron.ts` |
| M6 | **Both crons fire simultaneously at midnight** — Compete for DB connections. Fine now, but at scale could cause connection pool exhaustion. | `vercel.json` | Stagger schedules (e.g., archive at 00:00, returns at 00:30) |

### Low

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| L1 | **Magic number "2 days" hardcoded** — Reminder threshold not configurable. Requires code change to adjust. | `check-return-dates/route.ts:59` | Extract to constant or env var: `REMINDER_DAYS_BEFORE` |
| L2 | **No structured logging or metrics** — Only `console.log`/`console.error`. No JSON logs, no metrics, no alerting integration. | Both route files | Add structured JSON logging with job metadata, duration, counts |
| L3 | **Duplicate entries in `NotificationType` union** — `exchange_request_cancelled`, `exchange_listing_archived`, `exchange_listing_unflagged`, `request_status_changed`, `request_admin_reply` appear twice. TypeScript deduplicates but signals copy-paste drift. | `types/notifications.ts` | Deduplicate and organize the type definition |
| L4 | **No dry-run / preview mode** — No way to preview what a cron run would do without executing it. | Both route files | Support `?dry-run=true` query parameter |
| L5 | **Logs announcement titles (potential PII)** — `archive-announcements` logs full announcement titles which could contain sensitive community information. | `archive-announcements/route.ts:47-49` | Log only IDs in production, full details in dev only |
| L6 | **Cron response exposes internal data** — `archive-announcements` returns full list of archived announcements with IDs, titles, tenant_ids. Provides reconnaissance data. | `archive-announcements/route.ts:76-86` | Return only counts in response |

---

## Understanding Mapping

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Cron Scheduler                     │
│              Schedule: 0 0 * * * (daily midnight)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Middleware (unnecessary)                │
│  - updateSession() → supabase.auth.getUser()                │
│  - Session timeout check (2-hour)                           │
│  - Adds ~100-200ms latency per cron invocation              │
└──────────────────────────┬──────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
┌───────────────────────┐   ┌─────────────────────────────┐
│ check-return-dates    │   │ archive-announcements       │
│                       │   │                             │
│ 1. CRON_SECRET check  │   │ 1. CRON_SECRET check        │
│ 2. createServerClient │   │ 2. createClient             │
│    (anon key, RLS) ❌ │   │    (anon key, RLS) ❌        │
│ 3. Fetch transactions │   │ 3. Fetch expired announcements│
│ 4. Loop per txn:      │   │ 4. Batch update status      │
│    - 3x SELECT check  │   │ 5. Return summary           │
│    - 3x INSERT notif  │   │                             │
│ 5. Return summary     │   │                             │
└───────────┬───────────┘   └─────────────┬───────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  - exchange_transactions (RLS: borrower/lender only)        │
│  - announcements (RLS: tenant admins only)                  │
│  - notifications (RLS: insert_service allows any auth user) │
│  - tenants (for slug resolution)                            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: check-return-dates

1. Vercel Cron → GET `/api/cron/check-return-dates`
2. Middleware runs `updateSession()` (wasted)
3. Route checks `CRON_SECRET` (optional)
4. Creates `createServerClient()` → anon key → **RLS blocks all reads**
5. Queries `exchange_transactions` WHERE status='picked_up' AND expected_return_date IS NOT NULL
6. Fetches tenant slugs for action URLs
7. For each transaction:
   - Checks if reminder needed (due within 2 days, not yet sent)
   - Checks if overdue (past due date, not yet notified)
   - Calls `createNotification()` server action for each notification
8. Returns summary JSON

### Data Flow: archive-announcements

1. Vercel Cron → GET `/api/cron/archive-announcements`
2. Middleware runs `updateSession()` (wasted)
3. Route checks `CRON_SECRET` (optional)
4. Creates `createClient()` → anon key → **RLS blocks all reads**
5. Queries `announcements` WHERE status='published' AND auto_archive_date <= now
6. Batch updates status to 'archived'
7. Returns summary JSON with archived announcement details

### Dependencies

```
app/api/cron/check-return-dates/route.ts
  ├── @/lib/supabase/server (createServerClient)
  ├── @/app/actions/notifications (createNotification)
  │   └── @/lib/supabase/server (createServerClient)
  └── @/lib/notification-utils (generateNotificationTitle, generateNotificationMessage)

app/api/cron/archive-announcements/route.ts
  └── @/lib/supabase/server (createClient)
```

---

## Recommendations

### Immediate (This Sprint)

- [ ] **C1 + C2: Switch both crons to `createAdminClient()`** — This is the single most critical fix. Without it, the crons silently do nothing. Both routes should import from `@/lib/supabase/admin` and use `createAdminClient()` which uses the service_role key to bypass RLS.
- [ ] **C3: Make `CRON_SECRET` mandatory** — Fail closed. If `CRON_SECRET` is not configured, return 500 with "Server misconfiguration". Never allow unauthenticated access to system-level operations.
- [ ] **H1: Batch the N+1 queries** — Fetch all existing notifications in one query, build a Set for O(1) lookup, collect all notifications to insert, then batch-insert. Reduces 1000 transactions × 6 queries → ~3 queries total.
- [ ] **H4: Remove error detail leakage** — Remove `details: String(error)` and `details: fetchError.message` from all error responses. Log internally, return generic messages.

### Short-term (Next Sprint)

- [ ] **H2: Check `createNotification()` return values** — Log failures, adjust counters, consider retry logic for transient failures.
- [ ] **H3: Add `maxDuration` and timeout protection** — Export `maxDuration = 60` and add timeout-aware processing loop with early exit.
- [ ] **H5: Exclude `/api/cron/*` from middleware** — Add `api/cron` to the middleware matcher exclusion pattern.
- [ ] **H6: Tighten `notifications_insert_service` RLS policy** — Restrict to `service_role` only, since system notifications should only be created by cron jobs/server actions with admin access.
- [ ] **M1: Push date filtering to database** — Use `.lt()` and `.gte()`/`.lte()` on `expected_return_date` instead of filtering in JavaScript.
- [ ] **M5: Create `withCronHandler()` wrapper** — Extract shared auth, logging, and error handling into a reusable wrapper in `lib/cron.ts`.

### Long-term (Backlog)

- [ ] **M6: Stagger cron schedules** — Move `check-return-dates` to `30 0 * * *` to avoid simultaneous DB load.
- [ ] **L1: Make reminder threshold configurable** — Extract to env var `REMINDER_DAYS_BEFORE`.
- [ ] **L2: Add structured logging** — JSON logs with job metadata, duration, counts for monitoring/alerting.
- [ ] **L3: Deduplicate `NotificationType` union** — Clean up duplicate entries.
- [ ] **L4: Add dry-run mode** — Support `?dry-run=true` query parameter for testing.
- [ ] **L5: Environment-aware logging** — Log full details in dev, IDs only in production.
- [ ] **L6: Trim cron response data** — Return only counts, not full lists of processed items.
- [ ] **M2: Fix `as any` type cast** — Define proper interface for join result.
- [ ] **M3: Standardize import names** — Use `createServerClient` consistently.
- [ ] **M4: Use utility for lender message** — Consistent notification message generation.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Crons silently failing** | Certain (current state) | High — No reminders/overdue notifications sent, no announcements archived | Fix C1+C2 immediately |
| **Unauthenticated endpoint exposure** | High (if CRON_SECRET missing) | Critical — Once C1+C2 fixed, anyone can trigger system operations | Fix C3 before C1+C2 |
| **Vercel function timeout** | Medium (at ~50-100 transactions) | High — Partial processing, no retry | Fix H3 + H1 |
| **Notification spam via race condition** | Low | Medium — Rapid cron calls could create duplicate notifications | Add idempotency key or lock |
| **Connection pool exhaustion** | Low (current scale) | Medium — Both crons + middleware auth calls compete for connections | Fix H5 + M6 |
| **Error detail leakage** | Medium | Low-Medium — Exposes internal structure to attackers | Fix H4 |

---

## Overall Assessment

| Dimension | Grade | Rationale |
|-----------|-------|-----------|
| **Security** | **D** | Critical RLS mismatch means crons don't work; optional auth is dangerous; error responses leak details |
| **Performance** | **D+** | Severe N+1 query pattern; JS-side date filtering; no timeout protection |
| **Code Quality** | **C+** | Functional but inconsistent patterns; `as any` cast; no shared abstractions |
| **Architecture** | **C-** | No cron wrapper pattern; middleware interference; no observability; no idempotency guarantees |

### Bottom Line

The cron module has a **fundamental architectural mismatch**: it was written assuming the anon-key client could perform system-level operations, but RLS policies correctly prevent this. The result is that these crons **silently do nothing** — they return success with zero processed records every day. This is arguably worse than being broken loudly, because no one notices.

The good news: the fixes are straightforward and localized. The core logic is sound; it just needs the right credentials, proper auth enforcement, and batch query optimization.

---

*Audit completed: 2026-04-11*
*Next audit recommended: After fixes are applied (Q2 2026)*
