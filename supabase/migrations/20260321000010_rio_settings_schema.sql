-- Migration: Río Settings Schema Update
-- Description: Adds configuration columns for Tone, Policies, and Sign-off.
-- Timestamp: 20260321000010

ALTER TABLE public.rio_configurations
ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS community_policies TEXT,
ADD COLUMN IF NOT EXISTS sign_off_message TEXT;

-- Update valid values for tone if needed (check constraints)
-- For now, we'll just use text.

COMMENT ON COLUMN public.rio_configurations.tone IS 'The persona tone (friendly, professional, casual).';
COMMENT ON COLUMN public.rio_configurations.community_policies IS 'Tenant-specific community guidelines for the AI to follow.';
COMMENT ON COLUMN public.rio_configurations.sign_off_message IS 'Optional signature appended to AI responses.';
