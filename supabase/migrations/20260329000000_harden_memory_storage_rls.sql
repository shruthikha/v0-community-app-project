-- Migration: Harden Memory and Resource Storage with RLS
-- Description: Adds tenant_id and user_id to memory_messages and mastra_resources,
-- enables RLS, and attaches sync triggers for metadata.

-- 1. memory_messages (Vector Store)
ALTER TABLE public.memory_messages ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.memory_messages ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_memory_messages_tenant_user ON public.memory_messages(tenant_id, user_id);

ALTER TABLE public.memory_messages ENABLE ROW LEVEL SECURITY;

-- 2. mastra_resources (Memory & State)
ALTER TABLE public.mastra_resources ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.mastra_resources ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_mastra_resources_tenant_user ON public.mastra_resources(tenant_id, user_id);

ALTER TABLE public.mastra_resources ENABLE ROW LEVEL SECURITY;

-- 3. Attach Triggers (using existing sync_mastra_metadata_to_columns function)
DROP TRIGGER IF EXISTS trg_sync_memory_messages_metadata ON public.memory_messages;
CREATE TRIGGER trg_sync_memory_messages_metadata
BEFORE INSERT OR UPDATE ON public.memory_messages
FOR EACH ROW EXECUTE FUNCTION public.sync_mastra_metadata_to_columns();

DROP TRIGGER IF EXISTS trg_sync_mastra_resources_metadata ON public.mastra_resources;
CREATE TRIGGER trg_sync_mastra_resources_metadata
BEFORE INSERT OR UPDATE ON public.mastra_resources
FOR EACH ROW EXECUTE FUNCTION public.sync_mastra_metadata_to_columns();

-- 4. RLS Policies
-- We'll use the same pattern as mastra_threads/messages

-- memory_messages Policies
DROP POLICY IF EXISTS "Users can access their own tenant memory" ON public.memory_messages;
CREATE POLICY "Users can access their own tenant memory" 
ON public.memory_messages
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

-- mastra_resources Policies
DROP POLICY IF EXISTS "Users can access their own tenant resources" ON public.mastra_resources;
CREATE POLICY "Users can access their own tenant resources" 
ON public.mastra_resources
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
