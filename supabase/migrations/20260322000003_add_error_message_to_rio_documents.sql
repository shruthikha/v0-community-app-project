-- Migration: Add error_message to rio_documents
-- Description: Adds the error_message column that the BFF sets when a Railway handoff fails.
-- Date: 2026-03-22

ALTER TABLE public.rio_documents
ADD COLUMN IF NOT EXISTS error_message TEXT;
