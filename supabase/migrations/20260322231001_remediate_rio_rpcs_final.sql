-- Migration: Río Security Hardening - RPC Tenant Isolation
-- Description: Re-defines sensitive SECURITY DEFINER functions to strictly validate auth.uid() and tenant_id.
-- Date: 2026-03-22

-- 1. Harden upsert_rio_document_if_not_processing
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
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_id UUID;
  v_status TEXT;
  v_existing_tenant_id UUID;
BEGIN
  -- Security check 1: Ensure auth context exists
  IF auth.uid() IS NULL AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Access Denied: Missing authentication context' USING ERRCODE = '42501';
  END IF;

  -- Security check 2: User must be service_role OR an admin for this specific tenant
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND tenant_id = p_tenant_id
      AND (role = 'tenant_admin' OR role = 'super_admin')
    ) THEN
      RAISE EXCEPTION 'Access Denied: User % does not have admin access to tenant %', auth.uid(), p_tenant_id;
    END IF;
  END IF;

  -- Security check 3: Verify p_source_document_id ownership if it exists
  SELECT tenant_id INTO v_existing_tenant_id
  FROM public.rio_documents
  WHERE source_document_id = p_source_document_id;

  IF v_existing_tenant_id IS NOT NULL AND v_existing_tenant_id <> p_tenant_id THEN
    RAISE EXCEPTION 'Access Denied: Document % belongs to another tenant', p_source_document_id;
  END IF;

  -- Atomic Upsert logic
  INSERT INTO public.rio_documents (
    source_document_id,
    tenant_id,
    name,
    status,
    updated_at,
    error_message
  )
  VALUES (
    p_source_document_id,
    p_tenant_id,
    p_name,
    'pending',
    now(),
    NULL
  )
  ON CONFLICT (source_document_id)
  DO UPDATE SET
    status = 'pending',
    updated_at = now(),
    error_message = NULL -- Atomic clearance of stale errors
  WHERE rio_documents.tenant_id = p_tenant_id -- Defensive check
  AND rio_documents.status <> 'processing'
  RETURNING rio_documents.id, rio_documents.status INTO v_id, v_status;

  -- 2. Fallback: If no row was returned (because it was 'processing' and skipped), 
  -- fetch the existing state to return to the caller.
  IF v_id IS NULL THEN
    SELECT d.id, d.status, d.tenant_id INTO v_id, v_status, v_existing_tenant_id
    FROM public.rio_documents d
    WHERE d.source_document_id = p_source_document_id;

    -- Security re-check in fallback to prevent narrow race condition leakage
    IF v_existing_tenant_id IS NOT NULL AND v_existing_tenant_id <> p_tenant_id THEN
      RAISE EXCEPTION 'Access Denied: Document % belongs to another tenant', p_source_document_id;
    END IF;
  END IF;

  RETURN QUERY SELECT v_id, v_status;
END;
$$;

-- 2. Harden upsert_document_chunks
CREATE OR REPLACE FUNCTION public.upsert_document_chunks(
  p_document_id UUID,
  p_tenant_id UUID,
  p_chunks JSONB[]
) RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_doc_exists BOOLEAN;
BEGIN
  -- Security check 1: Ensure auth context exists
  IF auth.uid() IS NULL AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Access Denied: Missing authentication context' USING ERRCODE = '42501';
  END IF;

  -- Security check 2: User must be service_role OR an admin for this specific tenant
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND tenant_id = p_tenant_id
      AND (role = 'tenant_admin' OR role = 'super_admin')
    ) THEN
      RAISE EXCEPTION 'Access Denied: User % does not have admin access to tenant %', auth.uid(), p_tenant_id;
    END IF;
  END IF;

  -- Security check 3: Validate document ownership
  SELECT EXISTS (
    SELECT 1 FROM public.rio_documents 
    WHERE id = p_document_id AND tenant_id = p_tenant_id
  ) INTO v_doc_exists;

  IF NOT v_doc_exists THEN
    RAISE EXCEPTION 'Access Denied: Document % does not belong to tenant %', p_document_id, p_tenant_id;
  END IF;

  -- Advisory lock for concurrency
  PERFORM pg_advisory_xact_lock(hashtext(p_document_id::text));

  -- Atomic update
  DELETE FROM public.rio_document_chunks
  WHERE document_id = p_document_id;

  INSERT INTO public.rio_document_chunks (
    document_id,
    tenant_id,
    content,
    metadata,
    embedding
  )
  SELECT 
    p_document_id,
    p_tenant_id,
    (chunk->>'content'),
    (chunk->'metadata'),
    (chunk->>'embedding')::vector(1536)
  FROM unnest(p_chunks) AS chunk;
END;
$$;
