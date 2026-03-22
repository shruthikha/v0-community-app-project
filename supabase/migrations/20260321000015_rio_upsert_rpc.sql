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
DECLARE
  v_id UUID;
  v_status TEXT;
BEGIN
  -- 1. Check if record exists
  SELECT d.id, d.status INTO v_id, v_status
  FROM public.rio_documents d
  WHERE d.source_document_id = p_source_document_id;

  -- 2. If it exists and is processing, do nothing (return existing)
  IF FOUND AND v_status = 'processing' THEN
    RETURN QUERY SELECT v_id, v_status;
    RETURN;
  END IF;

  -- 3. Otherwise, upsert to 'pending'
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
  RETURNING rio_documents.id, rio_documents.status INTO v_id, v_status;

  RETURN QUERY SELECT v_id, v_status;
END;
$$;

-- Grant access to authenticated users (BFF needs this)
GRANT EXECUTE ON FUNCTION public.upsert_rio_document_if_not_processing(UUID, UUID, TEXT) TO authenticated, service_role;
