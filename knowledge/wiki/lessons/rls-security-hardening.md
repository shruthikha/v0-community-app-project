---
title: RLS Security Hardening
description: Row-Level Security patterns for multi-tenant Supabase apps
categories: [security, supabase, rls]
sources: [log_2026-03-22_st3_rls_fix.md, log_2026-03-21_rio_s4_2_ingest_trigger.md]
---

# RLS Security Hardening

## Patterns

### 1. Search Path Hijacking Prevention

Always set explicit search path in SECURITY DEFINER functions:

```sql
SET search_path = public, extensions, pg_catalog;
```

Prevents malicious function injection in extensions schema.

### 2. SERVICE_ROLE Guard

Fail-closed check on service_role:

```sql
CREATE OR REPLACE FUNCTION get_tenant_data(p_tenant_id UUID)
RETURNS TABLE(...) AS $$
BEGIN
  IF current_setting('app.session_role') = 'service_role' THEN
    -- Allow bypass for migrations/scripts
    RETURN;
  END IF;
  -- Normal RLS enforcement
END;
```

### 3. Auth UID Null Gate

RLS policies must check for unauthenticated requests:

```sql
CREATE POLICY "tenant_isolation" ON documents
FOR SELECT USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = auth.jwt()->>'tenant_id'
);
```

### 4. Cross-Tenant Write Prevention

Storage policies require tenant folder validation:

```sql
CREATE POLICY "storage_tenant_isolation" ON storage.objects
FOR INSERT WITH CHECK (
  (storage.foldername(name))[1] = (
    SELECT tenant_id::text FROM users WHERE id = auth.uid()
  )
);
```

---

## Related

- [supabase-multi-tenancy](../patterns/supabase-multi-tenancy.md)
- [security-patterns](../patterns/security-patterns.md)