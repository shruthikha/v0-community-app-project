---
title: Type-Safe Data Layer Pattern
---

# Type-Safe Data Layer Pattern

The data layer should expose explicit types for inputs, outputs, and relation shapes rather than relying on `any` or loosely typed casts.

## Why it matters

The data layer sits near the persistence boundary. Type holes there spread outward into actions, routes, and UI components, making regressions harder to detect.

## Pattern

- Define explicit interfaces for query results.
- Export shared types for filters and mutation payloads.
- Replace `any` with discriminated unions or concrete types.
- Add tests before refactoring large query modules.

## Related files

- `lib/data/*.ts`
- `app/onboarding.ts`
- `knowledge/wiki/lessons/database-column-strictness.md`

## Notes

This pattern is a strong candidate for staged cleanup rather than one large rewrite.