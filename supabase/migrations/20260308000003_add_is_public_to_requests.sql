-- Migration: Add is_public to resident_requests
-- Description: Allows residents to opt-in to community discussions on their requests.

-- 1. Add the column
ALTER TABLE "public"."resident_requests"
ADD COLUMN "is_public" boolean NOT NULL DEFAULT false;

-- 2. Add comment
COMMENT ON COLUMN "public"."resident_requests"."is_public" IS 'Whether other residents in the community can view and comment on this request';

-- 3. Update existing records based on the old implicit logic (maintenance & safety are public if not anonymous)
UPDATE "public"."resident_requests"
SET "is_public" = true
WHERE "request_type" IN ('maintenance', 'safety') AND "is_anonymous" = false;

UPDATE "public"."resident_requests"
SET "is_public" = false
WHERE "is_anonymous" = true OR "request_type" IN ('complaint', 'account_access');

-- 4. Add constraint to prevent invalid public requests
ALTER TABLE "public"."resident_requests"
ADD CONSTRAINT "resident_requests_public_visibility_check"
CHECK (
  NOT "is_public"
  OR (
    "is_anonymous" = false
    AND "request_type" NOT IN ('complaint', 'account_access')
  )
);

-- 5. Update residents_view_community_requests RLS policy to use is_public
DROP POLICY IF EXISTS "residents_view_community_requests" ON "public"."resident_requests";

CREATE POLICY "residents_view_community_requests" ON "public"."resident_requests" FOR SELECT USING (
  "tenant_id" = (SELECT "users"."tenant_id" FROM "public"."users" WHERE ("users"."id" = "auth"."uid"()))
  AND "is_public" = true
);
