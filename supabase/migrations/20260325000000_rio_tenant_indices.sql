-- Migration: Add B-tree indices on tenant_id for Rio documents and chunks
-- Issue: #247
-- Reason: Performance improvement for RAG retrieval across multiple tenants.

-- rio_documents
CREATE INDEX IF NOT EXISTS idx_rio_documents_tenant_id ON public.rio_documents (tenant_id);

-- rio_document_chunks
CREATE INDEX IF NOT EXISTS idx_rio_document_chunks_tenant_id ON public.rio_document_chunks (tenant_id);
