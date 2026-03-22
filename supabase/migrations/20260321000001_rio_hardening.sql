-- Migration: Río Hardening - Audit Findings Fix
-- Description: Revokes INSERT/UPDATE on chunk tables and ensures explicit SELECT grants.
-- Date: 2026-03-21

-- Hardening rio_document_chunks
-- Reason: Chunks should only be managed by the system (service_role) or the Rio Agent background process.
-- Standard authenticated users should only have SELECT access.

REVOKE ALL ON TABLE public.rio_document_chunks FROM authenticated;
GRANT SELECT ON TABLE public.rio_document_chunks TO authenticated;

-- Ensure service_role/postgres keep full access (redundant but safe)
GRANT ALL ON TABLE public.rio_document_chunks TO postgres, service_role;
