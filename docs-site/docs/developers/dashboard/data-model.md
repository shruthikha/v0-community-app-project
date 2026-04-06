# Technical Reference: Data Model

## Resident Configuration

### `public.users.dashboard_stats_config` (JSONB)
Stores the user's prioritized stat IDs and the selected data scope (`tenant` or `neighborhood`).
- **Structure**: `{ stats: string[], scope: "tenant" | "neighborhood" }`
- **Default**: `["neighbors_count", "upcoming_events_count", "active_checkins_count", "available_listings_count"]`

## Dashboard Data Sources

### Unified Tables
1. **`events`**: Source for upcoming counts and RSVP interactions.
2. **`announcements`**: Source for community updates and unread status.
3. **`check_ins`**: Source for live presence counts and the "Currently At" beacon.
4. **`resident_requests`**: Source for maintenance/service tickets.

### Exchange System
- **`exchange_listings`**: Product listings created by residents.
- **`exchange_transactions`**: Relationship between borrower, lender, and item status.

### Onboarding & Profile
- **`interests` & `user_interests`**: Many-to-many relationship for community matching.
- **`skills` & `user_skills`**: Many-to-many relationship for help-request matching.
- **`family_units` & `family_members`**: Grouping logic for household-level stats.

## Relationships
- **Polymorphic IDs**: The Priority Feed uses a polymorphic structure in its API response to represent items from different tables (Events vs. Listings) with a unified `id` and `type`.
- **Tenant Isolation**: ALL tables include a `tenant_id` for strict multi-tenant data separation.
