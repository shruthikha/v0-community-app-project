---
title: Server Actions Patterns
---

# Server Actions Patterns

Server actions should be written with explicit validation, clear return contracts, and careful auth boundaries.

## Common rules

- Validate user input with Zod before mutation.
- Avoid leaking sensitive details through error responses.
- Use rate limiting for abuse-prone actions.
- Keep action return shapes consistent.

## Related

- `knowledge/wiki/patterns/zod-validation.md`
- `knowledge/wiki/lessons/password-reset-rate-limiting.md`
- `knowledge/wiki/patterns/backend-first-auth.md`