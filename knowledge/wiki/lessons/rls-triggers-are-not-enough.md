---
title: Triggers Are Not Enough for Tenant Isolation
---

# Triggers Are Not Enough for Tenant Isolation

Do not rely on a trigger alone to populate tenant-scoping columns for sensitive tables.

## Why it matters

If a trigger fails, is bypassed, or receives incomplete metadata, the row can be inserted without a tenant identifier. That creates a security gap for RLS policies that expect the field to be present.

## Pattern

1. Populate tenant fields as early as possible.
2. Add constraints that reject rows with missing tenant identifiers.
3. Make the RLS policy assume the field is required, not optional.
4. Review migrations for nullable tenant columns.

## Related files

- `knowledge/wiki/patterns/supabase-multi-tenancy.md`
- `knowledge/wiki/patterns/mastra-rls.md`
- `supabase/migrations/*`

## Notes

This is especially important for Río and Mastra tables that infer tenant data from metadata or settings.