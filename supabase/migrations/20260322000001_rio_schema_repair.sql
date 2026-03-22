-- Migration: Río Production Schema Repair
-- Description: Aligns production schema for rio_documents, rio_document_chunks, and rio_threads with canonical migrations.
-- Date: 2026-03-22

-- 1. Fix rio_documents
DO $$
BEGIN
    -- Rename filename to name if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rio_documents' AND column_name = 'filename'
    ) THEN
        ALTER TABLE public.rio_documents RENAME COLUMN "filename" TO "name";
    END IF;

    -- Add missing columns
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rio_documents' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.rio_documents ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rio_documents' AND column_name = 'file_path'
    ) THEN
        ALTER TABLE public.rio_documents ADD COLUMN file_path TEXT;
    END IF;
END $$;

-- 2. Fix rio_document_chunks
ALTER TABLE public.rio_document_chunks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.rio_document_chunks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Fix rio_threads
ALTER TABLE public.rio_threads ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

-- 4. Re-grant permissions (Safety)
GRANT ALL ON TABLE public.rio_documents TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.rio_documents TO authenticated;
