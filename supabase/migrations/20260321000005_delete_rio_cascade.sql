-- Migration: 20260321000005_delete_rio_cascade.sql
-- Issue #202: Atomic Document Delete with AI Cascade

CREATE OR REPLACE FUNCTION delete_document_with_rio_cascade(
    p_document_id UUID,
    p_tenant_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_rio_doc_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- 1. Hardened Security Check: Verify ownership & existence
  -- Even with SECURITY DEFINER, we MUST validate that the p_document_id belongs to p_tenant_id.
  SELECT EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = p_document_id 
    AND tenant_id = p_tenant_id
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'Document not found or access denied for tenant %', p_tenant_id;
  END IF;

  -- 2. Find the associated AI document ID
  SELECT id INTO v_rio_doc_id 
  FROM public.rio_documents 
  WHERE source_document_id = p_document_id
  AND tenant_id = p_tenant_id; -- Extra safety

  -- 3. Cascade Delete AI data if it exists
  IF v_rio_doc_id IS NOT NULL THEN
    -- Delete chunks first to respect FK if it doesn't have CASCADE
    DELETE FROM public.rio_document_chunks WHERE document_id = v_rio_doc_id AND tenant_id = p_tenant_id;
    DELETE FROM public.rio_documents WHERE id = v_rio_doc_id AND tenant_id = p_tenant_id;
  END IF;

  -- 4. Delete the source document
  DELETE FROM public.documents WHERE id = p_document_id AND tenant_id = p_tenant_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
