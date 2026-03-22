-- Migration: Add Embedding Model Tracking
-- Description: Adds a column to track which model was used for document ingestion.
-- Timestamp: 20260322000000

ALTER TABLE public.rio_documents
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'openai/text-embedding-3-small';

COMMENT ON COLUMN public.rio_documents.embedding_model IS 'The model name used to generate chunks for this document (e.g., openai/text-embedding-3-small).';
