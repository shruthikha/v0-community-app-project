-- Migration: Harden Río Messages RLS & Cleanup Redundancy
-- Description: Backports the more secure rio_messages policy from Prod and removes redundant policies on rio_document_chunks.
-- Timestamp: 20260320150100

-- 1. Harden rio_messages: Explicitly check tenant_id in subquery
DROP POLICY IF EXISTS "Tenant Isolation: rio_messages" ON public.rio_messages;

CREATE POLICY "Tenant Isolation: rio_messages" ON public.rio_messages 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM rio_threads 
    WHERE id = thread_id AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  )
);

-- 2. Cleanup redundant rio_document_chunks policy (Dev-only duplicate)
DROP POLICY IF EXISTS "Tenant Isolation: Users can only see their own tenant's chunks" ON public.rio_document_chunks;

-- 2.-- Remove redundant policy from rio_document_chunks if any (cleanup)
DROP POLICY IF EXISTS "Tenant Isolation: Document Chunks" ON public.rio_document_chunks;

-- Fix Phase 6 (QA Gap): Add error_message column if missing
-- Note: 'rio_documents' was created in earlier sprint, but 'error_message' was missed.
ALTER TABLE public.rio_documents ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Index for status lookup during ingestion
CREATE INDEX IF NOT EXISTS rio_documents_status_idx ON public.rio_documents(status);

COMMENT ON POLICY "Tenant Isolation: rio_messages" ON public.rio_messages IS 'Grants access to messages only if the parent thread belongs to the current tenant.';
