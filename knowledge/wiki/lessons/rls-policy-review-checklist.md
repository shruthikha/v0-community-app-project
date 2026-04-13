# RLS Policy Review Checklist

> Systematic checklist for reviewing Row-Level Security policies during code review and audits.

## Pre-Flight Checks

- [ ] RLS is explicitly enabled: `ALTER TABLE x ENABLE ROW LEVEL SECURITY`
- [ ] All user-facing tables have `tenant_id` column
- [ ] `tenant_id` is NOT NULL (or has documented exception)

## Policy Review

### Dangerous Patterns

- [ ] **No `USING(true)`** — allows any authenticated user to access any row
- [ ] **No `USING(auth.uid() IS NOT NULL)`** — allows any authenticated user
- [ ] **No `WITH CHECK(true)`** — allows any authenticated user to insert

### Required Patterns

- [ ] SELECT policies check tenant membership: `tenant_id = auth.jwt() ->> 'tenant_id'`
- [ ] INSERT policies include tenant_id from JWT
- [ ] UPDATE policies check ownership AND tenant
- [ ] DELETE policies check ownership AND tenant

### Storage Bucket Policies

- [ ] Path prefix matches tenant_id: `(storage.foldername(name))[1] = auth.jwt() ->> 'tenant_id'`
- [ ] No authenticated SELECT without tenant scoping
- [ ] Bucket has `file_size_limit` set
- [ ] Bucket has `allowed_mime_types` set

### Trigger-Dependent tenant_id

- [ ] Tables that rely on triggers for tenant_id have CHECK constraint: `CHECK (tenant_id IS NOT NULL)`
- [ ] Trigger handles NULL metadata gracefully
- [ ] Trigger fires BEFORE INSERT

### current_setting() Usage

- [ ] Has fallback: `COALESCE(current_setting('app.current_tenant', true), '00000000-0000-0000-0000-000000000000')`
- [ ] Has explicit DENY policy for unset context
- [ ] Documented where `SET app.current_tenant` is called

### Junction Tables

- [ ] Documented why tenant_id is not needed (acceptable exception)
- [ ] Access controlled through parent tables that DO have tenant_id
- [ ] RLS policies reference parent table tenant checks

### Service Role Policies

- [ ] `notifications_insert_service` or similar restricted to `service_role` only
- [ ] Not accessible to `authenticated` role
- [ ] Documented which operations require service role

## Testing

- [ ] Test with resident user — can only see own tenant data
- [ ] Test with tenant admin — can see all tenant data
- [ ] Test with super admin — can see all data (if intended)
- [ ] Test with unauthenticated user — sees nothing
- [ ] Test cross-tenant access — blocked
- [ ] Test storage access — tenant-scoped paths only

## Related Patterns

- `patterns/supabase-multi-tenancy.md` — Multi-tenancy patterns
- `patterns/tenant-scoped-rls.md` — Tenant-scoped RLS
- `lessons/rls-security-hardening.md` — RLS security patterns
- `lessons/rls-triggers-are-not-enough.md` — Trigger limitations
