---
title: Fix data layer error swallowing — return explicit error types
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: reliability
author: @orchestrator/audit
source: audit_2026-04-11_error_handling_crosscutting.md
---

# Fix Data Layer Error Swallowing

## Finding

All 7 data layer files in `lib/data/` systematically swallow errors by returning `[]`, `null`, or `{}` on failure. Callers cannot distinguish between "no data found" and "database is down." Additionally, all 5 `getById` functions don't destructure the `error` field from Supabase responses, making DB errors indistinguishable from legitimate "not found."

## Current State

| File | Main Query Error | Enrichment Errors | getById Error |
|------|-----------------|-------------------|---------------|
| `residents.ts` | Logged + return [] | N/A | Not destructured |
| `events.ts` | Logged + return [] | 4 unchecked | Not destructured |
| `locations.ts` | Logged + return [] | 5 unchecked | Not destructured |
| `families.ts` | Logged + return [] | N/A | Not destructured |
| `exchange.ts` | Logged + return [] | 1 unchecked | Not destructured |
| `check-ins.ts` | Logged + return [] | 3 unchecked | Not destructured |
| `resident-requests.ts` | Logged + return [] | 3 unchecked | Not destructured |

**Total**: 23 missing error checks, 14 enrichment queries with no error handling, 4 PII leakage instances in residents.ts

## Recommendation

1. **Define a Result type**:
   ```typescript
   export type DataResult<T> = 
     | { ok: true; data: T }
     | { ok: false; error: 'not_found' | 'db_error' | 'auth_error'; message: string }
   ```

2. **Fix all getById functions** to destructure and check `{ data, error }`

3. **Fix all 14 enrichment sub-queries** to check errors and log with tenant context

4. **Remove PII from debug logs** in `residents.ts` (lines 158, 169, 179-184)

5. **Add tenant context to all error logs** for multi-tenant debugging

## Impact

- **Reliability**: Callers can handle errors appropriately
- **Debugging**: Tenant context in logs enables faster triage
- **Security**: PII removed from production logs

## Effort

Medium — requires changing return types across 7 files and updating all callers.
