# Technical Reference: API & Server Actions

## Dashboard Endpoints

### 1. Stats API (`/api/dashboard/stats`)
- **Method**: `GET`
- **Purpose**: Fetch calculated metrics for the `StatsGrid`.
- **Logic**: Iterates through the user's `dashboard_stats_config` and executes targeted SQL counts scoped to the `tenant_id`.
- **Available Stats**: 12 metrics covering Community (Neighborhoods, Neighbors, Events, Announcements, Check-ins, Requests, Listings) and Personal (RSVPs, Saved Events, My Listings, Transactions, My Requests) scopes.

### 2. Priority Feed API (`/api/dashboard/priority`)
- **Method**: `GET`
- **Purpose**: Aggregates and scores "What's Next" items.
- **Aggregation**: Parallel fetching from `announcements`, `events`, `check_ins`, and `exchange` systems.
- **Scoring**: Applies a weighted scoring system (e.g., 110 for exchange requests, 100 for unread announcements).

## Server Actions

### Onboarding Actions (`app/t/[slug]/onboarding/actions.ts`)
- `markOnboardingComplete`: Updates the `users.onboarding_completed` flag.
- `updateResidentProfile`: Orchestrates multi-table updates for personal info, interests, skills, and family data.

### Interaction Actions
- `rsvpToEvent`: Handles `event_rsvps` upserts.
- `confirmExchangeAction`: Updates `exchange_transactions` status.
- `submitResidentRequest`: Creates new entries in `resident_requests`.

## Frontend Integration
- **SWR**: Used for all `GET` endpoints to ensure real-time revalidation (Check-ins every 30s, Stats every 5m).
- **Mutation**: Actions use `mutate()` (via SWR) or `router.refresh()` to keep server and client state synchronized.
