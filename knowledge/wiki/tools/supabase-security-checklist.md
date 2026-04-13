---
title: Supabase Security Checklist
---

# Supabase Security Checklist

Use this checklist when reviewing Supabase-backed features, migrations, or admin flows.

## Checklist

- Verify tenant isolation on all user-facing tables.
- Confirm service-role usage has explicit authorization checks.
- Review RLS policies for permissive `USING (true)` patterns.
- Ensure storage access matches bucket sensitivity.
- Check for nullable tenant identifiers or trigger-dependent scoping.

## Related

- `knowledge/wiki/patterns/supabase-multi-tenancy.md`
- `knowledge/wiki/patterns/tenant-scoped-rls.md`
- `knowledge/wiki/lessons/rls-triggers-are-not-enough.md`