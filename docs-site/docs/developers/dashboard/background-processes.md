# Technical Reference: Background Processes

## Priority Scoring Engine
The scoring engine is a real-time background process that runs on every fetch to `/api/dashboard/priority`.

### scoring Algorithm
1. **Aggregation**: Parallel fetches from 4+ source tables.
2. **Filtering**: Excludes items dismissed via `localStorage` (client-side) and items not relevant to the current user (e.g., private events).
3. **Weighting**:
    - High-Priority (100+): Active exchange requests, unread announcements.
    - Medium-Priority (70-90): Active check-ins, upcoming events with "Yes" RSVP.
    - Low-Priority (60): Expired listings, un-RSVP'd events.

## Data Revalidation
The dashboard uses SWR (Stale-While-Revalidate) to manage background updates:
- **Check-ins**: Revalidate every 30 seconds to maintain map/beacon accuracy.
- **Stats**: Revalidate every 5 minutes or on window focus.
- **Priority Feed**: Revalidate on window focus or after specific actions (RSVP, Dismiss).

## Onboarding Flow State
- **Progress Tracking**: Persistent via `users.onboarding_completed`.
- **Session Continuity**: Rio AI chat threads are persisted in `localStorage` to allow residents to resume conversations across page reloads.
- **Optimistic UI**: When a user marks an onboarding step complete, the UI updates immediately before the server confirmation returns.

## Analytics Event Pipeline
The `DashboardAnalytics` utility tracks background interactions:
- `widgetViewed`: Fired when a widget enters the viewport.
- `statsReordered`: Fired when a user saves a new stat configuration.
- `onboardingStepReached`: Fired as the user progresses through the tour.
