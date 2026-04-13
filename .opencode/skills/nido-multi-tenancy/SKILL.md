---
name: nido-multi-tenancy
description: Nido's multi-tenancy patterns for Supabase. Tenant isolation via tenant_id columns, RLS policies, storage path-prefixing, and Mastra+RLS initialization. Use when creating tables, writing queries, designing storage, or working with Río/Mastra.
---

# Nido Multi-Tenancy Patterns

Every data operation in Nido must respect tenant isolation. This is non-negotiable.

## Rule 1: Every User-Facing Table Has tenant_id

```sql
-- MANDATORY on all user-facing tables
tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
```

No exceptions. If a table stores data that belongs to a community (eco-village), it has `tenant_id`.

## Rule 2: RLS Enabled on Every Table

```sql
-- After CREATE TABLE, ALWAYS:
ALTER TABLE example ENABLE ROW LEVEL SECURITY;

-- Standard tenant isolation policy:
CREATE POLICY "Tenant isolation" ON example
FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

RLS defaults to **disabled** in Supabase. You must explicitly enable it.

## Rule 3: Storage Path-Prefixing

All file storage uses tenant-scoped paths: `/{tenant_id}/{filename}`

```sql
CREATE POLICY "Tenant isolation" ON storage.objects
FOR ALL USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
);
```

- Use **private** buckets for sensitive documents
- Clients access files via signed URLs, never direct URL access

## Rule 4: Mastra + RLS Initialization

Mastra (Río's agent framework) lacks session context for RLS. Use `initRls()`:

```typescript
// packages/rio-agent/src/lib/init-rls.ts
export async function initRls(pool: pg.Pool, tenantId: string, userId: string) {
  const client = await pool.connect();
  await client.query('SET LOCAL app.current_tenant = $1', [tenantId]);
  await client.query('SET LOCAL app.current_user = $1', [userId]);
  return client;
}
```

For Mastra framework tables (`mastra_*`), use metadata triggers to inherit `tenant_id`.

## Rule 5: Insert Operations Include tenant_id

Every insert must include `tenant_id` from the session:

```typescript
const { data: { user } } = await supabase.auth.getUser();
const tenantId = user?.app_metadata?.tenant_id;

const { data, error } = await supabase.from('events').insert({
  title: 'Community Meeting',
  tenant_id: tenantId, // NEVER omit this
  // ...
});
```

## Rule 6: Service Role Requires Auth Verification

NEVER use `service_role` without verifying the user first:

```typescript
// ✅ CORRECT
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Unauthorized');
// Check role: is_tenant_admin, etc.
// THEN use admin client for cross-table writes

// ❌ WRONG
const adminClient = createClient(url, serviceRoleKey);
// Using without any auth check = security vulnerability
```

## Rule 7: No Cross-Tenant Queries

No application code should ever query across tenants. If you need cross-tenant data (admin dashboard, analytics), use a dedicated admin route with explicit authorization checks.

## Audit Checklist

Before completing any data-touching work:
- [ ] All new tables have `tenant_id` column
- [ ] RLS enabled with tenant isolation policy
- [ ] Storage paths use `/{tenant_id}/` prefix
- [ ] Inserts include `tenant_id` from session
- [ ] No cross-tenant data access possible
- [ ] Service role guarded by auth check
- [ ] Mastra operations use `initRls()` helper
