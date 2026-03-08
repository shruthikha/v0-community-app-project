-- Create composite unique constraint on resident_requests to allow composite foreign key
ALTER TABLE public.resident_requests
ADD CONSTRAINT resident_requests_tenant_id_id_key UNIQUE (tenant_id, id);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  resident_request_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Constraint to ensure the comment belongs to some entity (for now, only resident_requests)
  CONSTRAINT comments_entity_check CHECK (resident_request_id IS NOT NULL),
  -- Foreign key with tenant isolation
  CONSTRAINT comments_resident_request_fkey FOREIGN KEY (tenant_id, resident_request_id) REFERENCES public.resident_requests(tenant_id, id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_tenant_id ON public.comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comments_resident_request_id ON public.comments(resident_request_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);

-- RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- SELECT POLICY: Users can see a comment if:
-- 1. They belong to the same tenant, AND
-- 2. They are the author, OR they are the original submitter of the associated request, OR the request is public, OR they are an admin
CREATE POLICY "Users can view comments on their requests or if they are admins"
ON public.comments
FOR SELECT
USING (
  tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid()) AND
  (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.resident_requests rr 
      WHERE rr.id = resident_request_id 
      AND rr.tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid())
      AND (rr.original_submitter_id = auth.uid() OR rr.is_public = true)
    ) OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND (u.role IN ('tenant_admin', 'super_admin') OR u.is_tenant_admin = true)
    )
  )
);

-- INSERT POLICY: Users can insert a comment if:
-- 1. They belong to the same tenant, AND
-- 2. They are inserting under their own author_id, AND
-- 3. They are the original submitter of the associated request, OR the request is public, OR they are an admin
CREATE POLICY "Users can insert comments on their requests or if they are admins"
ON public.comments
FOR INSERT
WITH CHECK (
  tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid()) AND
  author_id = auth.uid() AND
  (
    EXISTS (
      SELECT 1 FROM public.resident_requests rr 
      WHERE rr.id = resident_request_id 
      AND rr.tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid())
      AND (rr.original_submitter_id = auth.uid() OR rr.is_public = true)
    ) OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND (u.role IN ('tenant_admin', 'super_admin') OR u.is_tenant_admin = true)
    )
  )
);

-- UPDATE POLICY: Users can update a comment if:
-- 1. They belong to the same tenant, AND
-- 2. They are the author
CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
USING (
  tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid()) AND
  author_id = auth.uid()
)
WITH CHECK (
  tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid()) AND
  author_id = auth.uid()
);

-- DELETE POLICY: Users can delete a comment if:
-- 1. They belong to the same tenant, AND
-- 2. They are the author OR an admin
CREATE POLICY "Users can delete their own comments or if they are admins"
ON public.comments
FOR DELETE
USING (
  tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid()) AND
  (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND (u.role IN ('tenant_admin', 'super_admin') OR u.is_tenant_admin = true)
    )
  )
);
