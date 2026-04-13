---
title: Middleware Auth Flow
---

# Middleware Auth Flow

Middleware should refresh sessions, enforce inactivity rules, and avoid accidental session corruption on auth-related routes.

## Common rules

- Keep auth refresh logic centralized.
- Avoid redirect loops on recovery or confirmation routes.
- Treat cookie configuration as part of the auth boundary.
- Review timeouts and grace periods for consistency.

## Related

- `knowledge/wiki/lessons/session-timeout.md`
- `knowledge/wiki/lessons/password-reset-flow.md`
- `knowledge/wiki/concepts/service-role-vs-user-session.md`