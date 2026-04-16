-- Migration: 20260413000000_lot_photos_columns.sql
-- Description: Add photos array and hero_photo columns to lots table, plus helper function and index
-- Tasks: 1, 2, 3 from docs/specs/residential-lot-images/plan.md

-- Task 1: Add photos and hero_photo columns to lots table
ALTER TABLE lots ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
ALTER TABLE lots ADD COLUMN IF NOT EXISTS hero_photo text;

-- Task 2: Create get_user_lot_id() helper function
-- Returns the lot_id associated with the authenticated user
CREATE OR REPLACE FUNCTION get_user_lot_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT lot_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Task 3: Add index on hero_photo for efficient lookups (only where NOT NULL)
CREATE INDEX IF NOT EXISTS idx_lots_hero_photo ON lots(hero_photo) WHERE hero_photo IS NOT NULL;
