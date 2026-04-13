---
title: Service Role vs User Session
---

# Service Role vs User Session

A service role represents elevated server-side trust, while a user session represents an authenticated end user with RLS constraints.

## Core distinction

- **User session**: subject to RLS and ownership rules.
- **Service role**: bypasses RLS and must be guarded by explicit server-side authorization.

## Why it matters

Many security issues come from confusing these two layers. The service role is not a substitute for checking the caller's permissions.

## Related

- `knowledge/wiki/patterns/security-patterns.md`
- `knowledge/wiki/patterns/backend-first-auth.md`
- `knowledge/wiki/patterns/admin-client-authorization.md`