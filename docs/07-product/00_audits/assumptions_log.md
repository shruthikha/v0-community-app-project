# Assumptions Log

Assumptions discovered during development and documentation that should be validated.

| Date | Source | Assumption | Impact | Status |
|---|---|---|---|---|
| 2026-02-22 | /document | [DONE] Vercel Cron is configured and running properly to archive announcements | High | Verified |
| 2026-04-05 | /document | RSVP deadlines in `events` are strictly enforced by Server Action logic and cannot be circumvented via client-side state manipulation. | High | Pending Validation |
| 2026-04-05 | Rio Agent | Tier 1 (Base) prompts strictly override Tier 2 (Tenant) without logic conflicts or jailbreak potential. | High | Pending Validation |
| 2026-04-05 | Rio Agent | `x-resident-context` header size remains under HTTP 431 limits (8KB) regardless of resident bio/skill length. | Med | Pending Validation |
| 2026-04-05 | /document | Lot assignment is strictly managed at the User record level, not the Family Unit level. | High | Verified |
| 2026-04-05 | /document | Passive Accounts are identified by the absence of an `email` in the `users` table. | Med | Verified |
| 2026-04-05 | /document | Exchange status transitions (`requested` -> `confirmed` -> `picked_up` -> `completed`) are strictly enforced by Server Action logic and cannot be bypassed via client-side state manipulation. | High | Pending Validation |
| 2026-04-05 | /document | Category management for Exchange is handled via DB seeding; no Admin UI exists for creating/editing categories. | Med | Pending Validation |
| 2026-04-05 | /document | `original_submitter_id` is the absolute source of truth for RLS, even when `is_anonymous` is true, ensuring admins can always follow up. | High | Verified |
| 2026-04-05 | /document | Residents prefer seeing community maintenance requests by default to avoid duplicate reporting, justifying the default `is_public` state for specific types. | Med | Pending Validation |
| 2026-04-05 | /document | Admin notifications are handled via the Resident View since most admins are also residents; no dedicated Admin Notification Center exists. | Med | Pending Validation |
