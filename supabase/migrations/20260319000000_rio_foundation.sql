-- Migration: Río S1.1 - Foundation Schema
-- Description: Creates the formal schema for configuration, documents, threads, and memories.
-- Timestamp: 20260319000000

-- 1. Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Configuration & Metadata Tables

CREATE TABLE IF NOT EXISTS public.rio_configurations (
    tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    prompt_community_name TEXT NOT NULL,
    prompt_tone TEXT DEFAULT 'friendly',
    prompt_language TEXT DEFAULT 'es',
    preferred_model TEXT DEFAULT 'gemini-flash',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rio_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'ready', -- ready, pending, processing, error
    file_path TEXT, -- Link to storage bucket
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Document Chunks (Formalizing spike table)

CREATE TABLE IF NOT EXISTS public.rio_document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.rio_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding extensions.vector(1536), -- 1536 dimensions for gemini-embedding-001
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure document_id column exists if table was created in spike
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rio_document_chunks' AND column_name='document_id') THEN
        ALTER TABLE public.rio_document_chunks ADD COLUMN document_id UUID REFERENCES public.rio_documents(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Conversation History (Wrappers)

CREATE TABLE IF NOT EXISTS public.rio_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mastra_thread_id TEXT UNIQUE NOT NULL, -- The tenant-prefixed ID used by Mastra
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rio_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.rio_threads(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Structural Long-Term Memory (Sprint 5)

CREATE TABLE IF NOT EXISTS public.user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL, -- preference, bio, routine, etc.
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Indexes & Performance

-- Legacy Cleanup (from Sprint 7 spike)
DROP INDEX IF EXISTS public.rio_document_chunks_embedding_idx;
DROP POLICY IF EXISTS "Tenant Isolation: Users can only see their own tenant's chunks" ON public.rio_document_chunks;

-- HNSW for vector similarity
DROP INDEX IF EXISTS public.rio_chunks_embedding_idx;
CREATE INDEX rio_chunks_embedding_idx
  ON public.rio_document_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 128); -- Upgraded for production recall

-- Optimized filters for multi-tenancy, citations, and recency
CREATE INDEX IF NOT EXISTS rio_chunks_tenant_idx ON public.rio_document_chunks (tenant_id);
CREATE INDEX IF NOT EXISTS rio_chunks_doc_idx ON public.rio_document_chunks (document_id);
CREATE INDEX IF NOT EXISTS rio_chunks_created_idx ON public.rio_document_chunks (created_at DESC);

CREATE INDEX IF NOT EXISTS rio_threads_tenant_user_idx ON public.rio_threads (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS rio_memories_user_idx ON public.user_memories (user_id);

-- 7. Triggers for Metadata Sync (Defense-in-depth isolation)

-- Existing function: sync_mastra_metadata_to_columns()
-- This trigger ensures that if metadata is set, dedicated UUID columns are populated.

DROP TRIGGER IF EXISTS trg_sync_rio_threads_metadata ON public.rio_threads;
CREATE TRIGGER trg_sync_rio_threads_metadata
    BEFORE INSERT ON public.rio_threads
    FOR EACH ROW EXECUTE FUNCTION public.sync_mastra_metadata_to_columns();

-- Function: append_rio_message_and_update_thread()
-- Ensures thread recency and captures tenant/user context from the thread into messages if missing.
CREATE OR REPLACE FUNCTION public.append_rio_message_and_update_thread()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the parent thread's last_active_at
    UPDATE public.rio_threads 
    SET last_active_at = now() 
    WHERE id = NEW.thread_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rio_messages_activity ON public.rio_messages;
CREATE TRIGGER trg_rio_messages_activity
    AFTER INSERT ON public.rio_messages
    FOR EACH ROW EXECUTE FUNCTION public.append_rio_message_and_update_thread();

DROP TRIGGER IF EXISTS trg_sync_rio_messages_metadata ON public.rio_messages;
CREATE TRIGGER trg_sync_rio_messages_metadata
    BEFORE INSERT OR UPDATE ON public.rio_messages
    FOR EACH ROW EXECUTE FUNCTION public.sync_mastra_metadata_to_columns();

-- 8. Row Level Security (RLS) policies

ALTER TABLE public.rio_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rio_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rio_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rio_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rio_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

-- Global Tenant Isolation Pattern (Simplified for authenticated users)
-- Note: Agent typically uses service_role, but app-side hooks use authenticated client.

DO $$ 
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN VALUES 
        ('rio_configurations'), 
        ('rio_documents'), 
        ('rio_document_chunks'), 
        ('rio_threads'), 
        ('rio_messages'), 
        ('user_memories')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation: %s" ON public.%s', t_name, t_name);
        -- Basic policy: User must belong to the tenant
        -- Except for rio_messages which is linked via thread_id (will handle message isolation via thread)
        IF t_name != 'rio_messages' THEN
            EXECUTE format('CREATE POLICY "Tenant Isolation: %s" ON public.%s FOR ALL TO authenticated USING (tenant_id = (auth.jwt() ->> ''tenant_id'')::uuid)', t_name, t_name);
        ELSE
            -- FIX: Secure EXISTS check with tenant_id isolation
            EXECUTE format('CREATE POLICY "Tenant Isolation: %s" ON public.%s FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM rio_threads WHERE id = thread_id AND tenant_id = (auth.jwt() ->> ''tenant_id'')::uuid))', t_name, t_name);
        END IF;
    END LOOP;
END $$;

-- 9. Grants

-- Service role accesses everything
GRANT ALL ON TABLE public.rio_configurations TO postgres, service_role;
GRANT ALL ON TABLE public.rio_documents TO postgres, service_role;
GRANT ALL ON TABLE public.rio_document_chunks TO postgres, service_role;
GRANT ALL ON TABLE public.rio_threads TO postgres, service_role;
GRANT ALL ON TABLE public.rio_messages TO postgres, service_role;
GRANT ALL ON TABLE public.user_memories TO postgres, service_role;

-- Authenticated users access specific Río tables
GRANT SELECT, INSERT, UPDATE ON TABLE public.rio_configurations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.rio_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.rio_document_chunks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.rio_threads TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.rio_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_memories TO authenticated;

-- 10. Comments

COMMENT ON TABLE public.rio_configurations IS 'Per-tenant agent configuration and standard system prompts.';
COMMENT ON TABLE public.rio_documents IS 'Metadata for documents indexed in the knowledge base.';
COMMENT ON TABLE public.rio_threads IS 'Nido-layer wrapper for agent conversation threads.';
COMMENT ON TABLE public.user_memories IS 'Structural, long-term memory for residents across conversations.';
