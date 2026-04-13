---
title: Delete orphaned vitest.unit.config.ts
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: tech-debt
module: vitest.unit.config.ts
---

# Delete orphaned vitest.unit.config.ts

## Finding
`vitest.unit.config.ts` matches only one file (`app/actions/events-series.test.ts`) which is already matched by the `unit` project in `vitest.config.ts`. It uses different path resolution (`vite-tsconfig-paths` vs `resolve.alias`) and has `globals: true` while the main config doesn't. This creates risk of double test execution and config drift.

## Files
- `vitest.unit.config.ts` — delete entirely

## Suggested fix
1. Delete `vitest.unit.config.ts`
2. Verify `app/actions/events-series.test.ts` still runs via `vitest.config.ts` unit project
3. If standalone runner needed, add proper npm script aligned with main config

## Priority
🟡 MEDIUM — Identified as H5 in the CI/CD cross-cutting audit
