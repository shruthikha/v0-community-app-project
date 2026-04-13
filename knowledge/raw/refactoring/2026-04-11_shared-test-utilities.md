# Refactoring Opportunity: Shared Test Utilities

**Date**: 2026-04-11
**Author**: @orchestrator/audit
**Source**: audit_2026-04-11_testing_gaps_crosscutting.md (Finding M4)
**Status**: Proposed
**Priority**: High

## Problem

Every test file that tests server actions or API routes reimplements Supabase mocking from scratch. The existing tests show 3 different mock patterns:
1. Manual chainable builder (`events-availability.test.ts`)
2. Response sequence pattern (`events-series.test.ts`)
3. Table-specific builder factory (`exchange-transactions.test.ts`)

This duplication creates ~60% more boilerplate than necessary and discourages writing new tests.

## Proposed Solution

Create `lib/test/supabase-mock.ts` with:

```typescript
export function createMockSupabase(config?: {
  user?: { id: string; email: string; app_metadata?: any };
  tables?: Record<string, MockTableConfig>;
})

export function createChainableBuilder(responses: any[])
```

## Benefits

- Reduces test boilerplate by ~60%
- Consistent mock behavior across all test files
- Easier to add tests for 21 untested server actions
- Single place to update when Supabase client interface changes

## Effort

- **Estimate**: 2-3 hours
- **Risk**: Low — test-only code, no production impact
- **Dependencies**: None

## Acceptance Criteria

- [ ] `createMockSupabase()` returns chainable mock supporting `.from().select().eq().single()`
- [ ] `createChainableBuilder()` supports response sequences
- [ ] Table-specific mocking works (different responses per table)
- [ ] Auth mocking works (`auth.getUser()` returns configurable user)
- [ ] Existing tests can be migrated to use shared utilities
- [ ] Documentation in JSDoc comments
