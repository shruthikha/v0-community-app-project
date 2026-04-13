---
title: Tenant Isolation
---

# Tenant Isolation

Tenant isolation is the rule that data from one tenant must not be visible or mutable by another tenant unless a specific super-admin workflow allows it.

## Core idea

Tenant isolation should be enforced in the database, client layer, and application logic. RLS and tenant-scoped queries are the primary guards, while backend authorization handles privileged exceptions.

## Related

- `knowledge/wiki/patterns/supabase-multi-tenancy.md`
- `knowledge/wiki/patterns/tenant-scoped-rls.md`
- `knowledge/wiki/lessons/rls-triggers-are-not-enough.md`