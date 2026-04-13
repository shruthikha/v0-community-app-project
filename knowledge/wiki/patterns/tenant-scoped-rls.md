---
title: Tenant-Scoped RLS Pattern
---

# Tenant-Scoped RLS Pattern

Every user-facing table should include tenant scoping that is enforced by Row Level Security, not only by application code.

## Why it matters

Tenant boundaries are a core security boundary in the platform. If a table can be read or written without tenant checks, one bug can expose another tenant's data.

## Pattern

- Include a tenant identifier on user-facing rows.
- Enforce tenant checks in RLS policies.
- Avoid permissive `USING (true)` policies for shared tables.
- Treat nullable tenant identifiers as a defect unless explicitly justified.

## Related files

- `knowledge/wiki/patterns/supabase-multi-tenancy.md`
- `knowledge/wiki/patterns/mastra-rls.md`
- `supabase/migrations/*`

## Notes

This pattern also applies to junction tables and derived tables when they can influence access to tenant data.