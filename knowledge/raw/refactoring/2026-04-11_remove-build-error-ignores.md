---
title: Remove build error ignores from next.config.mjs
status: open
created: 2026-04-11
updated: 2026-04-11
effort: medium
category: security
module: next.config.mjs
---

# Remove build error ignores from next.config.mjs

## Finding
`next.config.mjs` has `ignoreDuringBuilds: true` and `ignoreBuildErrors: true`. This means broken code with type errors and lint violations deploys to production via Vercel auto-deploy. This is the single most dangerous configuration in the codebase — it nullifies every other quality control.

## Files
- `next.config.mjs` (lines 3-8)

## Suggested fix
1. First, run `npm run lint && npm run type-check` to assess the backlog
2. Fix type errors and lint violations
3. Remove both config blocks from `next.config.mjs`
4. Add GitHub Actions CI workflow to enforce quality gates on every PR
5. Enable branch protection on `main` requiring status checks to pass

## Priority
🔴 CRITICAL — This was identified as C2 in the CI/CD cross-cutting audit (audit_2026-04-11_cicd_crosscutting.md)
