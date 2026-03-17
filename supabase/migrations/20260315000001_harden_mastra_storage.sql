-- Migration: Harden Mastra Storage with RLS
-- Description: Adds tenant_id and user_id to mastra_threads and mastra_messages,
-- enables RLS on all mastra_* tables, and enforces data isolation.

-- 1. Add columns to primary tables
ALTER TABLE public.mastra_threads ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.mastra_threads ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.mastra_messages ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.mastra_messages ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_mastra_threads_tenant_user ON public.mastra_threads(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_mastra_messages_tenant_user ON public.mastra_messages(tenant_id, user_id);

-- 3. Enable RLS on all Mastra tables
ALTER TABLE public.mastra_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_workflow_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_skill_blobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_prompt_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_scorers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_ai_spans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_scorer_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_mcp_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastra_mcp_servers ENABLE ROW LEVEL SECURITY;

-- 4. Set default "Restrict All" policy for unused tables
-- This ensures that any table we are not actively using is secure by default.
DO $$
DECLARE
    table_name text;
    mastra_tables text[] := ARRAY[
        'mastra_agents', 'mastra_workflow_snapshot', 'mastra_datasets', 
        'mastra_skill_blobs', 'mastra_prompt_blocks', 'mastra_scorers', 
        'mastra_skills', 'mastra_ai_spans', 'mastra_scorer_definitions', 
        'mastra_experiments', 'mastra_workspaces', 'mastra_mcp_clients', 
        'mastra_mcp_servers'
    ];
BEGIN
    FOREACH table_name IN ARRAY mastra_tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Restrict all access by default" ON public.%I', table_name);
        EXECUTE format('CREATE POLICY "Restrict all access by default" ON public.%I FOR ALL USING (false)', table_name);
    END LOOP;
END $$;

-- 5. Policies for mastra_threads and mastra_messages
-- These policies use session variables set by the backend.
-- We use current_setting(..., true) to return NULL instead of error if not set.

-- Threads Policies
DROP POLICY IF EXISTS "Users can access their own tenant threads" ON public.mastra_threads;
CREATE POLICY "Users can access their own tenant threads" 
ON public.mastra_threads
FOR ALL
USING (
    (current_setting('app.current_tenant', true)) IS NOT NULL AND
    tenant_id = (current_setting('app.current_tenant', true))::uuid
    AND (
        (current_setting('app.current_user', true)) IS NOT NULL AND
        user_id = (current_setting('app.current_user', true))::uuid
        OR user_id IS NULL -- Allow for system-created threads if needed
    )
);

-- Messages Policies
DROP POLICY IF EXISTS "Users can access their own tenant messages" ON public.mastra_messages;
CREATE POLICY "Users can access their own tenant messages" 
ON public.mastra_messages
FOR ALL
USING (
    (current_setting('app.current_tenant', true)) IS NOT NULL AND
    tenant_id = (current_setting('app.current_tenant', true))::uuid
    AND (
        (current_setting('app.current_user', true)) IS NOT NULL AND
        user_id = (current_setting('app.current_user', true))::uuid
        OR user_id IS NULL
    )
);

-- 6. Trigger to automatically sync tenant_id and user_id from metadata if provided
-- This serves as a safety net for when the Explicit Columns aren't set but metadata is.
CREATE OR REPLACE FUNCTION public.sync_mastra_metadata_to_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.metadata IS NOT NULL THEN
        -- PR Feedback (r2936995410): Wrap UUID casting in EXCEPTION block for safety
        BEGIN
            IF NEW.metadata ? 'tenantId' AND (NEW.tenant_id IS NULL OR NEW.tenant_id::text != NEW.metadata->>'tenantId') THEN
                NEW.tenant_id := (NEW.metadata->>'tenantId')::uuid;
            END IF;
        EXCEPTION WHEN others THEN
            RAISE WARNING 'Failed to cast tenantId to UUID: %', NEW.metadata->>'tenantId';
        END;

        BEGIN
            IF NEW.metadata ? 'userId' AND (NEW.user_id IS NULL OR NEW.user_id::text != NEW.metadata->>'userId') THEN
                NEW.user_id := (NEW.metadata->>'userId')::uuid;
            END IF;
        EXCEPTION WHEN others THEN
            RAISE WARNING 'Failed to cast userId to UUID: %', NEW.metadata->>'userId';
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_mastra_threads_metadata ON public.mastra_threads;
CREATE TRIGGER trg_sync_mastra_threads_metadata
BEFORE INSERT OR UPDATE ON public.mastra_threads
FOR EACH ROW EXECUTE FUNCTION public.sync_mastra_metadata_to_columns();

DROP TRIGGER IF EXISTS trg_sync_mastra_messages_metadata ON public.mastra_messages;
CREATE TRIGGER trg_sync_mastra_messages_metadata
BEFORE INSERT OR UPDATE ON public.mastra_messages
FOR EACH ROW EXECUTE FUNCTION public.sync_mastra_metadata_to_columns();
