---
title: Fix prototype pollution in i18n t() function
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: security
module: lib/i18n/context.tsx
---

# Fix prototype pollution in i18n t() function

## Finding
The `t()` function in `context.tsx` uses `k in value` to check if a key exists in the translation object. This checks the prototype chain, allowing malicious keys like `__proto__`, `constructor`, or `hasOwnProperty` to leak internal function source code or cause unexpected behavior.

Lines 51 and 58 both use `k in value` — both the primary and fallback traversal loops are vulnerable.

## Files
- `lib/i18n/context.tsx` (lines 51, 58)

## Suggested fix
1. Replace `k in value` with `Object.hasOwn(value, k)` in both loops
2. Add key validation regex: `/^[a-zA-Z0-9_.-]+$/` at the start of `t()`
3. Reject invalid keys with `console.warn` and return the key as-is
