-- Migration: RLS Robustness Patch
-- Description: Adds NULL guards to session variable checks and exception handling for UUID casting.

-- 1. Hardening Threads Policies
DROP POLICY IF EXISTS "Users can access their own tenant threads" ON public.mastra_threads;
CREATE POLICY "Users can access their own tenant threads" 
ON public.mastra_threads
FOR ALL
USING (
    (current_setting('app.current_tenant', true)) IS NOT NULL
    AND tenant_id = (current_setting('app.current_tenant', true))::uuid
    AND (
        (current_setting('app.current_user', true)) IS NULL
        OR user_id = (current_setting('app.current_user', true))::uuid
        OR user_id IS NULL
    )
);

-- 2. Hardening Messages Policies
DROP POLICY IF EXISTS "Users can access their own tenant messages" ON public.mastra_messages;
CREATE POLICY "Users can access their own tenant messages" 
ON public.mastra_messages
FOR ALL
USING (
    (current_setting('app.current_tenant', true)) IS NOT NULL
    AND tenant_id = (current_setting('app.current_tenant', true))::uuid
    AND (
        (current_setting('app.current_user', true)) IS NULL
        OR user_id = (current_setting('app.current_user', true))::uuid
        OR user_id IS NULL
    )
);

-- 3. Robust Metadata Sync Trigger
CREATE OR REPLACE FUNCTION public.sync_mastra_metadata_to_columns()
RETURNS TRIGGER AS $$
DECLARE
    t_id_text text;
    u_id_text text;
BEGIN
    IF NEW.metadata IS NOT NULL THEN
        t_id_text := NEW.metadata->>'tenantId';
        u_id_text := NEW.metadata->>'userId';

        -- Sync tenant_id
        IF t_id_text IS NOT NULL AND (NEW.tenant_id IS NULL OR NEW.tenant_id::text != t_id_text) THEN
            BEGIN
                NEW.tenant_id := t_id_text::uuid;
            EXCEPTION WHEN invalid_text_representation THEN
                RAISE WARNING 'Invalid UUID for tenantId in metadata: %', t_id_text;
            END;
        END IF;

        -- Sync user_id
        IF u_id_text IS NOT NULL AND (NEW.user_id IS NULL OR NEW.user_id::text != u_id_text) THEN
            BEGIN
                NEW.user_id := u_id_text::uuid;
            EXCEPTION WHEN invalid_text_representation THEN
                RAISE WARNING 'Invalid UUID for userId in metadata: %', u_id_text;
            END;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
