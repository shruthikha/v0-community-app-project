-- Migration: Río S0.5 - Spike: Validate gemini-embedding-001 + pgvector search quality
-- Description: Enables pgvector, creates chunks table, and enforces tenant isolation.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Create the document chunks table
CREATE TABLE IF NOT EXISTS public.rio_document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding extensions.vector(1536), -- 1536 dimensions as per Sprint 7 ADR
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create HNSW index for cosine distance
-- Note: ef_construction=128 and m=16 are balanced defaults.
CREATE INDEX IF NOT EXISTS rio_document_chunks_embedding_idx ON public.rio_document_chunks
USING hnsw (embedding extensions.vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.rio_document_chunks ENABLE ROW LEVEL SECURITY;

-- 5. Create Tenant Isolation Policy
-- Residents/Users can only see chunks belonging to their tenant.
-- For the spike, we assume access via service_role or authenticated users with a tenant_id claim.
CREATE POLICY "Tenant Isolation: Users can only see their own tenant's chunks"
ON public.rio_document_chunks
FOR ALL
TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 6. Grant access to service role for backend scripts
GRANT ALL ON public.rio_document_chunks TO service_role;
GRANT ALL ON public.rio_document_chunks TO postgres;

-- 7. Add comments
COMMENT ON TABLE public.rio_document_chunks IS 'Stores document chunks with vector embeddings for the Río assistant.';
COMMENT ON COLUMN public.rio_document_chunks.embedding IS '1536-dimensional embedding using gemini-embedding-001 (OpenRouter).';
