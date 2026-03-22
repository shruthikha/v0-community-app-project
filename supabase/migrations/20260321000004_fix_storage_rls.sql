-- Migration: Río S4.4 - Fix `documents` storage RLS (v2 - Shadowing Fix)
-- Description: Corrects RLS policies for document storage to check the public.users table via security definer functions.
-- This avoids name shadowing bugs and infinite recursion.
-- Date: 2026-03-21

-- 1. Fix INSERT (Upload)
DROP POLICY IF EXISTS "Admin Upload Access for Documents" ON storage.objects;
CREATE POLICY "Admin Upload Access for Documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND (
    public.get_user_role() = 'super_admin' OR
    (public.get_user_role() = 'tenant_admin' AND public.get_user_tenant_id()::text = (storage.foldername(name))[1])
  )
);

-- 2. Fix DELETE
DROP POLICY IF EXISTS "Admin Delete Access for Documents" ON storage.objects;
CREATE POLICY "Admin Delete Access for Documents" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND (
    public.get_user_role() = 'super_admin' OR
    (public.get_user_role() = 'tenant_admin' AND public.get_user_tenant_id()::text = (storage.foldername(name))[1])
  )
);

-- 3. Fix UPDATE
DROP POLICY IF EXISTS "Admin Update Access for Documents" ON storage.objects;
CREATE POLICY "Admin Update Access for Documents" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents' AND (
    public.get_user_role() = 'super_admin' OR
    (public.get_user_role() = 'tenant_admin' AND public.get_user_tenant_id()::text = (storage.foldername(name))[1])
  )
);

-- 4. Photos (Unified Pattern)
DROP POLICY IF EXISTS "Admin Upload Access for Photos" ON storage.objects;
CREATE POLICY "Admin Upload Access for Photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND (
    public.get_user_role() = 'super_admin' OR
    (public.get_user_role() = 'tenant_admin' AND public.get_user_tenant_id()::text = (storage.foldername(name))[1])
  )
);

DROP POLICY IF EXISTS "Admin Manage Access for Photos" ON storage.objects;
CREATE POLICY "Admin Manage Access for Photos" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'photos' AND (
    public.get_user_role() = 'super_admin' OR
    (public.get_user_role() = 'tenant_admin' AND public.get_user_tenant_id()::text = (storage.foldername(name))[1])
  )
);
