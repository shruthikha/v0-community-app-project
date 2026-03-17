-- Migration: Enable Cascading ID Updates for Users
-- Description: Adds ON UPDATE CASCADE to all foreign keys referencing public.users(id)
-- Reason: Required for atomic ID updates during resident signup (Issue #223)

BEGIN;

-- 1. Comments
ALTER TABLE public.comments 
  DROP CONSTRAINT IF EXISTS comments_author_id_fkey,
  ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- 2. Resident Requests
ALTER TABLE public.resident_requests
  DROP CONSTRAINT IF EXISTS resident_requests_created_by_fkey,
  ADD CONSTRAINT resident_requests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- 3. Notifications
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey,
  ADD CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey,
  ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- 4. Check-ins
ALTER TABLE public.check_ins
  DROP CONSTRAINT IF EXISTS check_ins_created_by_fkey,
  ADD CONSTRAINT check_ins_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- 5. Check-in Invites
ALTER TABLE public.check_in_invites
  DROP CONSTRAINT IF EXISTS check_in_invites_created_by_fkey,
  ADD CONSTRAINT check_in_invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE;

ALTER TABLE public.check_in_invites
  DROP CONSTRAINT IF EXISTS check_in_invites_invitee_id_fkey,
  ADD CONSTRAINT check_in_invites_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- 6. Check-in Neighborhoods
ALTER TABLE public.check_in_neighborhoods
  DROP CONSTRAINT IF EXISTS check_in_neighborhoods_created_by_fkey,
  ADD CONSTRAINT check_in_neighborhoods_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE;

-- 7. Check-in RSVPs
ALTER TABLE public.check_in_rsvps
  DROP CONSTRAINT IF EXISTS check_in_rsvps_user_id_fkey,
  ADD CONSTRAINT check_in_rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- 8. Events
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_cancelled_by_fkey,
  ADD CONSTRAINT events_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- 9. Exchange Flags
ALTER TABLE public.exchange_flags
  DROP CONSTRAINT IF EXISTS exchange_flags_flagged_by_fkey,
  ADD CONSTRAINT exchange_flags_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- 10. Exchange Listings
ALTER TABLE public.exchange_listings
  DROP CONSTRAINT IF EXISTS exchange_listings_created_by_fkey,
  ADD CONSTRAINT exchange_listings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.exchange_listings
  DROP CONSTRAINT IF EXISTS exchange_listings_archived_by_fkey,
  ADD CONSTRAINT exchange_listings_archived_by_fkey FOREIGN KEY (archived_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- 11. Exchange Transactions
ALTER TABLE public.exchange_transactions
  DROP CONSTRAINT IF EXISTS exchange_transactions_borrower_id_fkey,
  ADD CONSTRAINT exchange_transactions_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.exchange_transactions
  DROP CONSTRAINT IF EXISTS exchange_transactions_lender_id_fkey,
  ADD CONSTRAINT exchange_transactions_lender_id_fkey FOREIGN KEY (lender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

COMMIT;
