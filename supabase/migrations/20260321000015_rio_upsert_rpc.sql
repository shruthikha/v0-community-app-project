-- Migration: Río S4.0 - Idempotent Ingestion RPC
-- Description: Creates a function to upsert a rio_documents record only if not currently 'processing'.
-- Date: 2026-03-21

CREATE OR REPLACE FUNCTION public.upsert_rio_document_if_not_processing(
  p_source_document_id UUID,
  p_tenant_id UUID,
  p_name TEXT
)
RETURNS TABLE (
  id UUID,
  status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
  v_id UUID;
  v_status TEXT;
BEGIN
  -- 1. Attempt Atomic Upsert
  -- We only update to 'pending' if the current status is NOT 'processing'.
  -- This prevents concurrent ingestion triggers from interrupting an active workflow.

  INSERT INTO public.rio_documents (
    source_document_id,
    tenant_id,
    name,
    status,
    updated_at
  )
  VALUES (
    p_source_document_id,
    p_tenant_id,
    p_name,
    'pending',
    now()
  )
  ON CONFLICT (source_document_id)
  DO UPDATE SET
    status = 'pending',
    updated_at = now()
  WHERE rio_documents.status <> 'processing'
  RETURNING rio_documents.id, rio_documents.status INTO v_id, v_status;

  -- 2. Fallback: If no row was returned (because it was 'processing' and skipped), 
  -- fetch the existing state to return to the caller.
  IF v_id IS NULL THEN
    SELECT d.id, d.status INTO v_id, v_status
    FROM public.rio_documents d
    WHERE d.source_document_id = p_source_document_id;
  END IF;

  RETURN QUERY SELECT v_id, v_status;
END;
$$;

-- Grant access to authenticated users (BFF needs this)
GRANT EXECUTE ON FUNCTION public.upsert_rio_document_if_not_processing(UUID, UUID, TEXT) TO authenticated, service_role;
