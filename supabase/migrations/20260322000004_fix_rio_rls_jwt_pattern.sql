-- Migration: Fix Rio RLS Policies - Use auth.uid() pattern
-- Problem: Rio tables used auth.jwt() ->> 'tenant_id' which requires a custom JWT
--          claims hook that does not exist in this project. Every other table uses
--          auth.uid() with a subquery to public.users, which is the correct pattern.
-- Fix: Replace all Rio RLS policies to use the established project pattern.
-- Date: 2026-03-22

DO $$
DECLARE
    t_name TEXT;
BEGIN
    -- Drop old jwt-based policies
    FOR t_name IN VALUES
        ('rio_configurations'),
        ('rio_documents'),
        ('rio_document_chunks'),
        ('rio_threads'),
        ('rio_messages'),
        ('user_memories')
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS "Tenant Isolation: %s" ON public.%s',
            t_name, t_name
        );
    END LOOP;
END $$;

-- rio_configurations: only tenant_admin or super_admin
CREATE POLICY "Rio: tenant_admin access rio_configurations"
    ON public.rio_configurations FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT users.tenant_id FROM public.users
            WHERE users.id = auth.uid()
            AND (users.role = 'tenant_admin' OR users.role = 'super_admin')
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT users.tenant_id FROM public.users
            WHERE users.id = auth.uid()
            AND (users.role = 'tenant_admin' OR users.role = 'super_admin')
        )
    );

-- super_admin bypass for rio_configurations
CREATE POLICY "Rio: super_admin access rio_configurations"
    ON public.rio_configurations FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
    );

-- rio_documents: any member of the tenant can read; only admins can write
CREATE POLICY "Rio: tenant member read rio_documents"
    ON public.rio_documents FOR SELECT TO authenticated
    USING (
        tenant_id IN (SELECT users.tenant_id FROM public.users WHERE users.id = auth.uid())
    );

CREATE POLICY "Rio: tenant_admin write rio_documents"
    ON public.rio_documents FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id IN (
            SELECT users.tenant_id FROM public.users
            WHERE users.id = auth.uid()
            AND (users.role = 'tenant_admin' OR users.role = 'super_admin')
        )
    );

CREATE POLICY "Rio: tenant_admin update rio_documents"
    ON public.rio_documents FOR UPDATE TO authenticated
    USING (
        tenant_id IN (
            SELECT users.tenant_id FROM public.users
            WHERE users.id = auth.uid()
            AND (users.role = 'tenant_admin' OR users.role = 'super_admin')
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT users.tenant_id FROM public.users
            WHERE users.id = auth.uid()
            AND (users.role = 'tenant_admin' OR users.role = 'super_admin')
        )
    );

-- rio_document_chunks: tenant members can read only (service_role writes via Railway)
CREATE POLICY "Rio: tenant member read rio_document_chunks"
    ON public.rio_document_chunks FOR SELECT TO authenticated
    USING (
        tenant_id IN (SELECT users.tenant_id FROM public.users WHERE users.id = auth.uid())
    );

-- rio_threads: scoped to the tenant member
CREATE POLICY "Rio: tenant member access rio_threads"
    ON public.rio_threads FOR ALL TO authenticated
    USING (
        tenant_id IN (SELECT users.tenant_id FROM public.users WHERE users.id = auth.uid())
    )
    WITH CHECK (
        tenant_id IN (SELECT users.tenant_id FROM public.users WHERE users.id = auth.uid())
    );

-- rio_messages: accessible if the parent thread belongs to the same tenant
CREATE POLICY "Rio: tenant member access rio_messages"
    ON public.rio_messages FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.rio_threads rt
            JOIN public.users u ON u.id = auth.uid()
            WHERE rt.id = rio_messages.thread_id
            AND rt.tenant_id = u.tenant_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.rio_threads rt
            JOIN public.users u ON u.id = auth.uid()
            WHERE rt.id = rio_messages.thread_id
            AND rt.tenant_id = u.tenant_id
        )
    );

-- user_memories: scoped to the individual user's tenant
CREATE POLICY "Rio: user access user_memories"
    ON public.user_memories FOR ALL TO authenticated
    USING (
        tenant_id IN (SELECT users.tenant_id FROM public.users WHERE users.id = auth.uid())
        AND user_id = auth.uid()
    )
    WITH CHECK (
        tenant_id IN (SELECT users.tenant_id FROM public.users WHERE users.id = auth.uid())
        AND user_id = auth.uid()
    );
