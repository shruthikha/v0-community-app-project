---
title: Supabase Storage RLS
description: Storage bucket policies, tenant folder isolation
categories: [storage, supabase, security]
sources: [log_2026-03-19_rio_storage_bucket.md, log_2026-03-21_rio_s4_2_ingest_trigger.md, log_2026-03-20_documents_bucket.md]
---

# Supabase Storage RLS

## Bucket Creation

Create bucket via SQL:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 5242880);  -- 5MB limit
```

## Tenant Folder Isolation

Use folder-level isolation:

```
tenants/{tenant_id}/documents/{document_id}/{filename}
```

Storage policy:

```sql
CREATE POLICY "storage_tenant_isolation" ON storage.objects
FOR SELECT USING (
  (storage.foldername(name))[1] = (
    SELECT tenant_id::text FROM users WHERE id = auth.uid()
  )
);
```

⚠️ Common bug: `name` incorrectly qualified as `users.name`.

## Storage RLS Patterns

### Fail-Closed Default

```sql
-- Default deny
CREATE POLICY "deny_all" ON storage.objects
FOR ALL USING (false) WITH CHECK (false);
```

### Public/Private Buckets

```sql
-- Private: Require auth
CREATE POLICY "private_read" ON storage.objects
FOR SELECT USING (
  auth.uid() IS NOT NULL
);
```

---

## Related

- [rls-security-hardening](./rls-security-hardening.md)