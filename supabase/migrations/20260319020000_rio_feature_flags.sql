-- Migration: Río Feature Flags
-- Description: Initializes Rio feature block in the tenants table.
-- Timestamp: 20260319020000

-- 1. Backfill: Add rio flags to all existing tenants (fail-closed)
UPDATE tenants
SET features = jsonb_set(
  COALESCE(features, '{}'::jsonb),
  '{rio}',
  '{"enabled": false, "rag": false, "memory": false, "actions": false}'::jsonb,
  true
)
WHERE features->'rio' IS NULL;

-- 2. Ensure default for future tenants includes the rio block
ALTER TABLE tenants
ALTER COLUMN features SET DEFAULT '{"neighborhoods": true, "interests": true, "skills": true, "pets": true, "families": true, "lots": true, "journey_stages": true, "onboarding": true, "map": true, "rio": {"enabled": false, "rag": false, "memory": false, "actions": false}}'::jsonb;
