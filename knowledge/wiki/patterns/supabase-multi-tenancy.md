---
source: nido_patterns
imported_date: 2026-04-08
---

# Supabase Multi-Tenancy Patterns

## Tenant Isolation (Non-Negotiable)

Every table MUST have a `tenant_id` column. When inserting data, ALWAYS include `tenant_id` from the session.

```typescript
const { error } = await supabase.from('events').insert({
  ...data,
  tenant_id: tenantId // Mandatory
})
```

## Storage Path-Prefixing

Use path-prefixing for Storage buckets instead of relying on RLS joins:

```sql
-- ✅ CORRECT: Path-prefixing
CREATE POLICY "Tenant isolation" ON storage.objects
FOR ALL USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
);
```

## RLS Default Disabled

Creating a table in Supabase does NOT enable RLS by default. You must explicitly run:

```sql
ALTER TABLE x ENABLE ROW LEVEL SECURITY;
```

## Views Security Bypass

Standard Views run with the owner's privileges, BYPASSING RLS on underlying tables. Use:

```sql
CREATE VIEW x WITH (security_invoker = true) AS SELECT ...;
```

## Audit Findings (2026-04-11)

### Trigger-Dependent tenant_id (HIGH)

Río tables rely on triggers (`sync_rio_metadata_to_columns`) to populate `tenant_id` from metadata JSONB. If trigger fails or metadata is missing, `tenant_id` is NULL, bypassing isolation.

**Fix:** Add CHECK constraint:
```sql
ALTER TABLE rio_documents ADD CHECK (tenant_id IS NOT NULL);
```

### Mastra Tables — current_setting() Without Fallback (HIGH)

Mastra tables use `current_setting('app.current_tenant')` without fallback. If not set, RLS policies may behave unpredictably.

**Fix:** Add explicit DENY policy and fallback:
```sql
COALESCE(current_setting('app.current_tenant', true), '00000000-0000-0000-0000-000000000000')
```

### users.tenant_id is NULLABLE (HIGH)

The core `users` table has nullable `tenant_id`, violating the multi-tenancy mandate. Migration needed to make NOT NULL with default handling.

### Interests/Skills USING(true) (HIGH)

RLS policies use `USING (true)` allowing ANY authenticated user to modify ANY row. Violates tenant isolation.

### Upload Path Missing tenant_id Prefix (CRITICAL)

Server-side `uploadFile()` uses `year/month/uuid-filename` — missing `tenant_id` prefix. RLS policies expect first folder to be `tenant_id`. Server-side uploads may be rejected by RLS or land in wrong tenant scope.

**Fix:** Match client-side pattern: `tenantId/year/month/uuid-filename`

### Junction Tables Without Explicit tenant_id (MEDIUM)

~10 junction tables lack `tenant_id`. Acceptable if access is controlled through parent tables that DO have `tenant_id`. Document these exceptions.

## Related

- `lessons/rls-policy-review-checklist.md` — RLS policy review checklist
- `lessons/rls-triggers-are-not-enough.md` — Trigger limitations
- `patterns/file-upload-security.md` — Upload tenant isolation
- `lessons/upload-tenant-mismatch.md` — Upload path mismatch