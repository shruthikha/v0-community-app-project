# Refactoring Opportunity: Dashboard API Type Safety

**Status**: Open  
**Discovered**: 2026-04-11  
**Audit**: `knowledge/raw/audits/audit_2026-04-11_dashboard-api.md`  
**Severity**: HIGH

## Problem

The dashboard API module has significant type safety issues:

1. `calculateStat(supabase: any, ...)` — loses all Supabase type inference
2. `const priorityItems: any[] = []` — no type for priority feed items
3. 12 `@ts-ignore` comments in `priority/route.ts` for nested join results
4. Two different `AVAILABLE_STATS` definitions with different schemas

## Affected Files

- `app/api/dashboard/stats/route.ts:30` — `supabase: any`
- `app/api/dashboard/priority/route.ts:161` — `priorityItems: any[]`
- `app/api/dashboard/priority/route.ts:247-355` — 12 `@ts-ignore` comments
- `app/api/dashboard/stats/route.ts:5-21` — local AVAILABLE_STATS
- `lib/dashboard/stats-config.ts:12-117` — canonical AVAILABLE_STATS

## Proposed Refactoring

1. Define `PriorityItem` interface matching the API response shape
2. Type the `calculateStat` function's supabase parameter using `SupabaseClient` from generated types
3. Remove all `@ts-ignore` comments by properly typing nested Supabase join results
4. Consolidate `AVAILABLE_STATS` to single source in `lib/dashboard/stats-config.ts`

## Effort Estimate

- **Complexity**: Medium
- **Time**: 2-3 hours
- **Risk**: Low (type-only changes, no runtime behavior change)
- **Dependencies**: Generated Supabase TypeScript types must be up to date

## Acceptance Criteria

- [ ] Zero `any` types in dashboard API routes
- [ ] Zero `@ts-ignore` comments in dashboard API routes
- [ ] Single `AVAILABLE_STATS` definition imported everywhere
- [ ] `tsc --noEmit` passes with strict mode
- [ ] No runtime behavior changes
