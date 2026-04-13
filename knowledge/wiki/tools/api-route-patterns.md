---
title: API Route Patterns
---

# API Route Patterns

API routes should follow a consistent set of rules for validation, error handling, auth, and pagination.

## Common rules

- Validate request payloads before side effects.
- Use standardized error responses.
- Apply tenant and role checks before admin-level access.
- Prefer bounded queries and explicit pagination.

## Related

- `knowledge/wiki/patterns/admin-client-authorization.md`
- `knowledge/wiki/patterns/zod-validation.md`
- `knowledge/wiki/patterns/default-query-limits.md`
- `knowledge/wiki/patterns/security-patterns.md`