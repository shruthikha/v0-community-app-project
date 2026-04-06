# Observations Log

Noteworthy patterns, behaviors, or facts discovered during documentation that aren't tech debt or assumptions but worth tracking.

| Date | Source | Observation | Category | Action Needed |
|---|---|---|---|---|
| 2026-03-29 | Rio Agent | RLS session variables can leak between pooled connections if not explicitly reset on release. | Security | Reset session context in `pool.on('release')`. |
| 2026-03-31 | /document | Official Documents and Announcements share a single "Official" dashboard view for residents, with logic handling tab switching and distinct read-tracking. | UI/UX | Ensure cross-links between their guides. |
| 2026-04-05 | /document | Check-in markers use a custom "Spatial Jitter" distribution in `MapboxViewer.tsx` to handle overlapping coords in a circle. | UI/UX | Monitor performance with >20 markers at a single point. |
| 2026-04-05 | /document | Pulsating logic is split: Map markers (beacons) always pulse, while time badges only pulse when <15 minutes remain. | UI/UX | None. |
| 2026-04-05 | Rio Agent | LlamaParse latency during ingestion leads to Supabase connection pool exhaustion (zombie connections). | DevOps | Use `pgbouncer` or stricter ingestion timeouts. |
| 2026-04-05 | Rio Agent | Base64 encoding for PII transport is a tactical "log-masking" bypass rather than a robust tokenized lookup. | Security | None. |
| 2026-04-05 | /document | "Household" terminology is used in Resident UI, while "Family Unit" is used in Admin/Tech docs. | Documentation | Standardize where possible. |
| 2026-04-05 | /document | Profile data is fragmented across 5+ tables (`users`, `family_units`, `interests`, `skills`, `privacy`). | Architecture | Monitor join performance. |
| 2026-04-05 | /document | Relative paths in markdown (e.g. `../../../static`) are brittle compared to root-relative `/screenshots/`. | DevOps | Prefer root-relative paths. |
| 2026-04-05 | /document | - **Exchange**: Category labels "Services & Skills" and "Food & Produce" trigger skip-logic for physical returns.
- **Exchange**: `available_quantity` decrements on request **confirmation**, not on request creation.
- **Exchange**: `is_available` is automatically set to `false` when `available_quantity` reaches `0`.
- **Exchange**: Household items currently do not prompt for a "Proposed Return Date" in the standard flow (unlike services). | Logic | Ensure this is clear in Resident guide. |
| 2026-04-05 | /document | Exchange transaction history is flattened into a single table with foreign keys to users as borrowers and lenders, using specific role-based naming in queries. | Data | Monitor performance as transaction volume grows. |
| 2026-04-05 | /document | Request notifications are manually triggered in server actions (`createResidentRequest`, `updateRequestStatus`) rather than DB triggers. | Logic | Monitor for potential race conditions or missed triggers. |
| 2026-04-05 | /document | "Community Requests" visibility relies on a simple `is_public` boolean, lacking the granular "Neighborhood-only" scoping used in the Events system. | UI/UX | Consider scoping parity in future refactors. |
| 2026-04-05 | /document | `NotificationsClient` contains "Events", "Check-ins", and "Announcements" tabs that are currently hard-coded as `disabled`. | UI/UX | Enable when corresponding features are ready. |
| 2026-04-05 | /document | `NotificationCard` uses a simple `type === 'announcement'` check, likely missing `announcement_published` and `announcement_updated`. | Logic | Review `NotificationType` mapping. |
| 2026-04-05 | /document | A "DEBUG INFO" section is still visible in the `NotificationsClient` production-ready code (line 157). | UI/UX | Remove before final release. |
| 2026-04-05 | /document | **Resident Dashboard**: Priority Feed uses a tiered scoring system (Announcements > Check-ins > Events). Dismissals are `localStorage` only. | Logic | Consider DB-backed dismissals for multi-device sync. |
| 2026-04-05 | /document | **Resident Dashboard**: Quick Stats are per-user configurable (12 available). Grid handles 4, but modal doesn't enforce this limit. | UI/UX | Enforce 4-stat limit in selection modal. |
| 2026-04-05 | /document | **Resident Dashboard**: Rio widget buttons lead to multi-step onboarding/profile wizards (`/onboarding/tour`, `/onboarding/profile`). | UX | Ensure onboarding state is tracked. |
| 2026-04-05 | /document | **Resident Dashboard**: `RioImage` component has a `pose` prop but currently only renders a static `parrot.png`. | UI/UX | Implement pose-specific images if available. |
