-- Add RLS policy allowing residents to update their own lot
-- Fixes: Photo uploads don't persist to lots.photos - residents couldn't update their lot due to missing UPDATE policy

-- Allow residents to UPDATE their own lot (for photo uploads)
-- They can only update their assigned lot
CREATE POLICY "Residents can update their own lot" ON lots
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.lot_id = lots.id
    AND users.role = 'resident'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.lot_id = lots.id
    AND users.role = 'resident'
  )
);