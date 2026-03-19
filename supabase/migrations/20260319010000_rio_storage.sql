-- Migration: Río S1.3 - Storage & Bucket configuration
-- Description: Creates the private bucket for RAG documents and applies tenant isolation RLS.
-- Timestamp: 20260319010000

-- 1. Create Private Bucket (Idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rio-documents', 
  'rio-documents', 
  false, 
  20971520, -- 20MB
  ARRAY['application/pdf', 'text/markdown', 'text/plain']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Tenant Isolation for Rio Documents
-- Pattern: First folder in path must match the tenant_id from the user's JWT.
-- Requirement: Only users with role = 'tenant_admin' can access.
DROP POLICY IF EXISTS "Tenant Isolation: Rio Documents" ON storage.objects;
CREATE POLICY "Tenant Isolation: Rio Documents" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'rio-documents' AND 
  (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id') AND
  (auth.jwt() ->> 'role') = 'tenant_admin'
)
WITH CHECK (
  bucket_id = 'rio-documents' AND 
  (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id') AND
  (auth.jwt() ->> 'role') = 'tenant_admin'
);

-- 4. Grants
GRANT ALL ON TABLE storage.objects TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.objects TO authenticated;
