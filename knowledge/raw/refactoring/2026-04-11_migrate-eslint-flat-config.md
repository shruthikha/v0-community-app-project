---
title: Migrate ESLint to flat config
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: tech-debt
module: .eslintrc.json, package.json
---

# Migrate ESLint to flat config

## Finding
The project uses `ESLINT_USE_FLAT_CONFIG=false` with ESLint 9.x, opting out of the new flat config system in favor of legacy `.eslintrc.json`. ESLint 10+ will remove legacy config support entirely. The current `.eslintrc.json` is minimal — only `next/core-web-vitals` — with no custom rules, no import ordering, and no `@typescript-eslint/no-explicit-any` enforcement.

## Files
- `.eslintrc.json`
- `package.json` (lint script uses `ESLINT_USE_FLAT_CONFIG=false`)

## Suggested fix
1. Create `eslint.config.mjs` with flat config format
2. Migrate `next/core-web-vitals` rules
3. Add `@typescript-eslint/no-explicit-any` as error
4. Add import ordering rules
5. Update `package.json` lint script to remove `ESLINT_USE_FLAT_CONFIG=false`
6. Test that lint still works correctly

## Priority
🟡 MEDIUM — Identified as M2 in the CI/CD cross-cutting audit
