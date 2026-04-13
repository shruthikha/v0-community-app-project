---
title: Authorization Boundaries
---

# Authorization Boundaries

Authorization boundaries define where user permissions must be checked before privileged data access occurs.

## Core idea

Authentication answers who the user is. Authorization answers what they are allowed to do. When code uses admin clients, server actions, or service roles, the authorization boundary must be explicit and enforced before the privileged operation.

## Examples

- role checks before admin client usage
- tenant checks before cross-tenant reads
- ownership checks before updates

## Related

- `knowledge/wiki/patterns/backend-first-auth.md`
- `knowledge/wiki/patterns/admin-client-authorization.md`
- `knowledge/wiki/lessons/auth-verification.md`