-- Add source_document_id to link rio_documents to the public.documents table
-- Use ON DELETE CASCADE to automatically purge AI records when the source document is deleted
ALTER TABLE rio_documents 
ADD COLUMN source_document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE;

-- Create an index for performance and uniqueness (one AI record per source document)
CREATE UNIQUE INDEX idx_rio_documents_source_document_id ON rio_documents(source_document_id);

-- Update RLS or comments if needed
COMMENT ON COLUMN rio_documents.source_document_id IS 'Link to the source document in the public schema. This bridges the admin document management with the AI knowledge base.';
