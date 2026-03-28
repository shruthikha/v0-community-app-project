-- Migration: Río Hardening - Secure Documents Bucket
-- Description: Reverts the documents bucket to PRIVATE and removes anonymous read access.
-- Date: 2026-03-26

-- 1. Set Bucket to Private
UPDATE storage.buckets
SET public = false
WHERE id = 'documents';

-- 2. Remove Public (Anonymous) Read Policy
DROP POLICY IF EXISTS "Public Read Access for Documents" ON storage.objects;

-- 3. Ensure Authenticated Read Access exists (needed for Signed URLs generation via Service Role/Auth context)
-- If we want to be ultra-strict, we keep only Service Role access, 
-- but Supabase's createSignedUrl often requires the bucket to allow authenticated reads if using the client instead of admin.
-- Since our logic uses the authenticated client on the server, we allow SELECT to authenticated.

DROP POLICY IF EXISTS "Authenticated Read Access for Documents" ON storage.objects;
CREATE POLICY "Authenticated Read Access for Documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documents');

-- 4. Revoke anon grants on storage objects just in case
REVOKE ALL ON TABLE storage.objects FROM anon;
GRANT SELECT ON TABLE storage.objects TO authenticated;
