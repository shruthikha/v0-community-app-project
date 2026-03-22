-- Migration: Río S4.0 - `documents` storage bucket
-- Description: Creates the public bucket for Knowledge Base documents and applies RLS policies.
-- Date: 2026-03-20

-- 1. Create Public Bucket (Idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  true, 
  null, -- No limit as per requirements
  null  -- All types allowed
) ON CONFLICT (id) DO NOTHING;

-- 2. Policies for storage.objects
-- Note: We use bucket_id filter to ensure policies only apply to this bucket.

-- Enable RLS (Should be already enabled, but good practice)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2.1 SELECT (Read)
-- Requirement: All authenticated and unauthenticated users may read.
DROP POLICY IF EXISTS "Public Read Access for Documents" ON storage.objects;
CREATE POLICY "Public Read Access for Documents" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'documents');

-- 2.2 INSERT (Upload)
-- Requirement: Only tenant_admin and super_admin roles may upload.
-- Isolation: Path must start with tenant_id.
DROP POLICY IF EXISTS "Admin Upload Access for Documents" ON storage.objects;
CREATE POLICY "Admin Upload Access for Documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND (
    (auth.jwt() ->> 'role') = 'super_admin' OR 
    (
      ((auth.jwt() ->> 'role') = 'tenant_admin' OR (auth.jwt() ->> 'is_tenant_admin')::boolean) AND
      (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    )
  )

);

-- 2.3 DELETE
-- Requirement: Only tenant_admin and super_admin roles may delete.
DROP POLICY IF EXISTS "Admin Delete Access for Documents" ON storage.objects;
CREATE POLICY "Admin Delete Access for Documents" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND (
    (auth.jwt() ->> 'role') = 'super_admin' OR 
    (
      ((auth.jwt() ->> 'role') = 'tenant_admin' OR (auth.jwt() ->> 'is_tenant_admin')::boolean) AND
      (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    )
  )

);

-- 2.4 UPDATE
-- For completeness and consistency with delete/upload.
DROP POLICY IF EXISTS "Admin Update Access for Documents" ON storage.objects;
CREATE POLICY "Admin Update Access for Documents" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents' AND (
    (auth.jwt() ->> 'role') = 'super_admin' OR 
    (
      ((auth.jwt() ->> 'role') = 'tenant_admin' OR (auth.jwt() ->> 'is_tenant_admin')::boolean) AND
      (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    )
  )

);

-- 3. Grants
-- Ensure standard roles have access to the objects table
GRANT ALL ON TABLE storage.objects TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.objects TO authenticated;
GRANT SELECT ON TABLE storage.objects TO anon;
