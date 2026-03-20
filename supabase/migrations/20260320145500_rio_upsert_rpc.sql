-- Issue #190: Atomic Upsert of chunks using Postgres RPC.
-- This ensures old chunks are deleted and new ones inserted in a single transaction.

CREATE OR REPLACE FUNCTION upsert_document_chunks(
  p_document_id UUID,
  p_tenant_id UUID,
  p_chunks JSONB[]
) RETURNS VOID AS $$
DECLARE
  v_doc_exists BOOLEAN;
BEGIN
  -- 1. Security: Validate document ownership
  SELECT EXISTS (
    SELECT 1 FROM public.rio_documents 
    WHERE id = p_document_id AND tenant_id = p_tenant_id
  ) INTO v_doc_exists;

  IF NOT v_doc_exists THEN
    RAISE EXCEPTION 'Access Denied: Document % does not belong to tenant %', p_document_id, p_tenant_id;
  END IF;

  -- 2. Concurrency: Obtain advisory lock for this document to prevent race conditions
  -- hashtext converts UUID to a bigint for the lock
  PERFORM pg_advisory_xact_lock(hashtext(p_document_id::text));

  -- 3. Atomic Update: Delete existing chunks for this document
  DELETE FROM public.rio_document_chunks
  WHERE document_id = p_document_id;

  -- 4. Bulk Insert: Insert new chunks
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
