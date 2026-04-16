-- Fix Storage RLS policy path index bug
-- Original bug: path format is {tenantId}/lots/{lotId}/... but RLS used index [2]
-- Correct index: [1] = tenantId, [2] = "lots", [3] = lotId

-- Drop and recreate the Resident Upload policy with correct index
DROP POLICY IF EXISTS "Resident Upload to Own Lot" ON storage.objects;
CREATE POLICY "Resident Upload to Own Lot" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'photos' AND (
    get_user_role() = 'super_admin' OR 
    get_user_role() = 'tenant_admin' AND get_user_tenant_id()::text = (storage.foldername(name))[1]
    OR (
      EXISTS (
        SELECT 1 FROM residents r
        WHERE r.auth_user_id = auth.uid() 
        AND r.lot_id::text = (storage.foldername(objects.name))[3]
      )
    )
  )
);

-- Drop and recreate the Resident View policy with correct index
DROP POLICY IF EXISTS "Resident View Own Lot Photos" ON storage.objects;
CREATE POLICY "Resident View Own Lot Photos" ON storage.objects FOR SELECT USING (
  bucket_id = 'photos' AND (
    get_user_role() = ANY (ARRAY['super_admin', 'tenant_admin'])
    OR (
      EXISTS (
        SELECT 1 FROM residents r
        WHERE r.auth_user_id = auth.uid() 
        AND r.lot_id::text = (storage.foldername(objects.name))[3]
      )
    )
  )
);

-- Drop and recreate the Resident Delete policy with correct index
DROP POLICY IF EXISTS "Resident Delete Own Lot Photos" ON storage.objects;
CREATE POLICY "Resident Delete Own Lot Photos" ON storage.objects FOR DELETE USING (
  bucket_id = 'photos' AND (
    get_user_role() = 'super_admin' OR 
    get_user_role() = 'tenant_admin' AND get_user_tenant_id()::text = (storage.foldername(name))[1]
    OR (
      EXISTS (
        SELECT 1 FROM residents r
        WHERE r.auth_user_id = auth.uid() 
        AND r.lot_id::text = (storage.foldername(objects.name))[3]
      )
    )
  )
);