-- Remediate rio_configurations schema for Sprint 11 Branch 3
-- This ensures prompt_persona and emergency_contacts exist for the Rio Agent

ALTER TABLE rio_configurations 
ADD COLUMN IF NOT EXISTS prompt_persona TEXT;

ALTER TABLE rio_configurations 
ADD COLUMN IF NOT EXISTS emergency_contacts TEXT;

-- Note: In some environments, prompt_tone might have been used. 
-- This migration ensures the standard prompt_persona is used.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rio_configurations' AND column_name = 'prompt_tone') THEN
        UPDATE rio_configurations SET prompt_persona = prompt_tone WHERE prompt_persona IS NULL;
    END IF;
END $$;
