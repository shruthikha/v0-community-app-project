-- Migration: Lot Photos Storage RLS
-- Description: Adds RLS policies for resident lot photo access with path format:
--   {tenantId}/lots/{lotId}/{year}/{month}/{uuid-filename}
-- Date: 2026-04-13

-- 1. Allow residents to upload to their own lot folder
-- Path: {tenantId}/lots/{lotId}/...
DROP POLICY IF EXISTS "Resident Upload to Own Lot" ON storage.objects;
CREATE POLICY "Resident Upload to Own Lot" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'photos' AND (
        -- Tenant/Super admin can upload (existing policy)
        public.get_user_role() = 'super_admin' OR (
            public.get_user_role() = 'tenant_admin' AND 
            public.get_user_tenant_id()::text = (storage.foldername(name))[1]
        ) OR (
            -- Resident can upload to their lot
            EXISTS (
                SELECT 1 FROM public.residents r
                WHERE r.auth_user_id = auth.uid()
                AND r.lot_id::text = (storage.foldername(name))[3]
            )
        )
    )
);

-- 2. Allow residents to view their own lot photos
DROP POLICY IF EXISTS "Resident View Own Lot Photos" ON storage.objects;
CREATE POLICY "Resident View Own Lot Photos" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'photos' AND (
        -- Tenant/Super admin can view their own tenant
        public.get_user_role() = 'super_admin' OR (
            public.get_user_role() = 'tenant_admin' AND 
            public.get_user_tenant_id()::text = (storage.foldername(name))[1]
        ) OR
        -- Resident can view their lot photos
        EXISTS (
            SELECT 1 FROM public.residents r
            WHERE r.auth_user_id = auth.uid()
            AND r.lot_id::text = (storage.foldername(name))[3]
        )
    )
);

-- 3. Allow residents to delete their own lot photos
DROP POLICY IF EXISTS "Resident Delete Own Lot Photos" ON storage.objects;
CREATE POLICY "Resident Delete Own Lot Photos" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'photos' AND (
        -- Tenant/Super admin can delete (existing policy)
        public.get_user_role() = 'super_admin' OR (
            public.get_user_role() = 'tenant_admin' AND 
            public.get_user_tenant_id()::text = (storage.foldername(name))[1]
        ) OR (
            -- Resident can delete their lot photos
            EXISTS (
                SELECT 1 FROM public.residents r
                WHERE r.auth_user_id = auth.uid()
                AND r.lot_id::text = (storage.foldername(name))[3]
            )
        )
    )
);

-- 4. Path format: {tenantId}/lots/{lotId}/...
-- Folder indices in storage.objects.name: [0]=bucket, [1]=tenantId, [2]='lots', [3]=lotId
-- RLS policies: tenant_admin uses [1], resident uses [3]

-- Note: Existing admin policies from 20260321000004_fix_storage_rls.sql remain in effect
-- as they allow tenant_admin and super_admin full access