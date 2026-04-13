# Refactoring Opportunity: GitHub Actions CI Pipeline

**Date**: 2026-04-11
**Author**: @orchestrator/audit
**Source**: audit_2026-04-11_testing_gaps_crosscutting.md (Finding C1)
**Status**: Proposed
**Priority**: Critical

## Problem

No GitHub Actions workflows exist. The codebase has:
- `npm run lint` — not run in CI
- `npm run type-check` — not run in CI
- `npm run test` — not run in CI
- `npm run build` — Vercel auto-builds but `next.config.mjs` ignores errors

This means broken code can be merged without any automated verification.

## Proposed Solution

Create `.github/workflows/ci.yml` with:

```yaml
name: CI
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test -- --run
      - run: npm run build
```

## Benefits

- Catches lint errors, type errors, and test failures before merge
- Prevents broken builds from reaching Vercel
- Provides confidence for refactoring work
- Required for any serious testing strategy

## Effort

- **Estimate**: 1-2 hours
- **Risk**: Low — CI-only change
- **Dependencies**: None

## Acceptance Criteria

- [ ] Workflow runs on push and PR
- [ ] All 4 steps pass on current `main`
- [ ] Fails appropriately when lint/type-check/test fails
- [ ] Node version matches project requirements
- [ ] Caching configured for `node_modules`
