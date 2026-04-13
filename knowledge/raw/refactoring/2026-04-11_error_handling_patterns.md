---
title: Inconsistent error handling patterns in app directory
status: open
created: 2026-04-11
updated: 2026-04-11
priority: medium
category: readability
author: @investigator/audit
---

# Inconsistent Error Handling Patterns

## Finding
Three different error handling patterns observed in the `app/` directory:
1. Server Actions: `{ success: true }` on failure (anti-enumeration)
2. API Routes: `NextResponse.json({ error })`
3. Some Actions: `throw new Error()`

This inconsistency makes it difficult to understand error flow and properly handle errors in calling code.

## Files
- `app/actions/*.ts`
- `app/api/v1/*.ts`
- `lib/api/response.ts`
- `lib/api/errors.ts`

## Recommendation
Standardize on a single error handling pattern:
- Use `lib/api/errors.ts` custom error classes (ValidationError, AuthenticationError)
- Consistent return type from server actions
- Document the pattern in `knowledge/wiki/patterns/server-actions.md`

## Status
**Open** - Documented in audit_2026-04-11_app_module.md