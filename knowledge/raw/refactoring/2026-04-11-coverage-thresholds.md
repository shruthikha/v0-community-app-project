# Refactoring Opportunity: Coverage Thresholds in Vitest

**Date**: 2026-04-11
**Author**: @orchestrator/audit
**Source**: audit_2026-04-11_testing_gaps_crosscutting.md (Finding M5)
**Status**: Proposed
**Priority**: Medium

## Problem

`vitest.config.ts` has no coverage thresholds configured. Without thresholds:
- Coverage can regress without anyone noticing
- No incentive to write tests for untested code
- No measurable target for testing efforts

## Proposed Solution

Add to `vitest.config.ts`:

```typescript
{
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 20,    // Start low, increase over time
        functions: 20,
        branches: 15,
        statements: 20,
      },
      include: [
        'lib/**/*.ts',
        'app/actions/**/*.ts',
        'app/api/**/*.ts',
        'components/**/*.tsx',
      ],
      exclude: [
        'components/_deprecated/**',
        'components/library/**',  // shadcn upstream tested
        '**/*.test.ts',
        '**/*.stories.tsx',
      ],
    },
  },
}
```

## Benefits

- Measurable testing targets
- Prevents coverage regression
- Drives testing discipline
- Clear progress metric for testing sprints

## Effort

- **Estimate**: 30 minutes
- **Risk**: Low — config only, can start with very low thresholds
- **Dependencies**: None

## Acceptance Criteria

- [ ] `npm run test -- --coverage` runs without errors
- [ ] Thresholds set at achievable level (20% starting point)
- [ ] Excludes appropriate files (deprecated, shadcn, test files)
- [ ] Coverage report generated in CI
- [ ] Plan to increase thresholds documented
