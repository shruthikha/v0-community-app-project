---
title: API Quality
---

# API Quality

API quality covers validation, auth checks, pagination, error handling, and PII-safe logging across route handlers.

## What good looks like

- Inputs are validated before use.
- Privileged access is authenticated and authorized.
- Responses are consistent and predictable.
- Logs avoid raw PII and secrets.

## Related

- `knowledge/wiki/tools/api-route-patterns.md`
- `knowledge/wiki/patterns/admin-client-authorization.md`
- `knowledge/wiki/patterns/zod-validation.md`