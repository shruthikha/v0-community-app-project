source: requirement
imported_date: 2026-04-08
---
# Requirements: Upcoming Widget RSVP Count Fix

## Problem Statement
The "Upcoming Events" widget on the dashboard displays "0" attendees for events that have known RSVPs. This misleads users.
Additionally, recent updates to event series RSVPs have introduced regressions and functional gaps:
1. **Visual Inconsistency**: Event cards on the main events page do not show the correct RSVP status for series.
2. **Modal Logic Error**: The RSVP reply choices modal fails to appear for the first event in a series.
3. **Management Rigidity**: Organizers cannot Edit/Delete/Cancel a *single* event in a series without affecting the whole series.

## User Persona
- **Resident**: Wants to see at a glance if their neighbors are attending events directly from the dashboard.
- **Organizer**: Wants their event excitement to be visible on the home feed.

## Context
- **Issue**: [Verified Issue #78](https://github.com/mjcr88/v0-community-app-project/issues/78)
- **Current Behavior**:
    - **Widget**: API `/api/events/upcoming/[tenantId]` returns `_count: { rsvps: number }`, but Frontend expects `attending_count`.
    - **Layouts**: Event cards on the list view don't reflect confirmed RSVP status.
    - **UX**: The RSVP action on the first item of a series doesn't trigger the multi-choice modal (RSVP to series).
    - **Admin**: "Edit" or "Cancel" buttons on series events currently force a "Series-Wide" action or lack individual scope.
- **Technical Root Cause**:
    - Mismatch between Data Layer return type (`_count.rsvps`) and UI expectation (`attending_count`).
    - Event card logic doesn't correctly propagate or check series-wide RSVP status for the current user.
    - Event detail/quick action logic likely has an off-by-one or condition error when detecting the "first" occurrence of a series.

## Dependencies
- `lib/data/events.ts`: Source of truth for event fetching.
- `components/dashboard/upcoming-events-widget.tsx`: The consumer component.

## issue_context
- Related to visual alignment task but functional in nature.

## Technical Options

### Option 1: Frontend Adaptation (Recommended)
Update `UpcomingEventsWidget` to read the data structure returned by the API (`_count.rsvps`) instead of expecting a flat properties `attending_count`.
- **Pros**: Localizes the fix to the component displaying the data. No risk of breaking other consumers of the API/Data layer.
- **Cons**: Component interface becomes "looser" or requires type assertion to match `EventWithRelations`.
- **Effort**: XS

### Option 1: Fragmented UI + Detachment (Low Effort)
Fix UI bugs manually and implement detachment as a simple cloning server action.
- **Effort**: S

### Option 2: Centralized RSVP Hook + Detachment (Medium Effort - Recommended)
Use `useEventStatus` for UI consistency and "Server Action with Clone" for management.
- **Pros**: Consistency + Clean management logic without schema migrations.
- **Cons**: Requires standardizing the `Event` object passed to the hook.
- **Effort**: M

### Option 3: Logic Detachment + Series Exceptions (High Effort)
Keep events linked but use a `series_exceptions` table.
- **Pros**: Maintains relational integrity for analytics.
- **Cons**: Requires complex SQL updates and migrations (explicitly avoided by user).
- **Effort**: L (Large)

## Recommendation

### Strategy
**Implement Option 2 (Centralized RSVP Status Hook + Detachment)**. This handles all three requirements robustly:
1. **RSVP Polish**: The hook ensures consistent counts and indicators across the app.
2. **Series Modal**: Fixed logic improves the UX for the start of a series.
3. **Management**: Detaching via cloning avoids database complexity while giving organizers the requested flexibility.

### Implementation Plan
1. **Shared Hook**: Create `hooks/use-event-status.ts`.
2. **UI Update**: Refactor Widget and Event Cards to consume the hook.
3. **Detachment Logic**: Update `editEvent` and `cancelEvent` actions to support "Detaching" (cloning specific record + clearing `parent_event_id`).
4. **Verification**: Full regression of RSVP and Series management flows.

### Classification
- **Priority**: P1 (Bug Fix / Feature Add)
- **Size**: M (Increased due to Detachment functionality)
- **Horizon**: Q1 26


## 8. Technical Review

### Phase 0: Context Gathering
- **Issue Details**: Draft Item 152699400 "Upcoming Widget RSVP Count Fix". Status: In Review.
- **Impact Map**:
  - Primary Component: `components/dashboard/upcoming-events-widget.tsx`
  - API Route: `/api/events/upcoming/[tenantId]` (Implicit dependency)
- **Historical Context**:
  - Component converted to SWR/CSR in commit `615816ed` (Nov 16 2025).
  - Last touched in `190f2660` (Dec 5 2025) for mobile optimization.
  - **Regression**: The move to client-side fetching likely exposed the type mismatch where `getEvents` returns nested `_count` but the component interface expects flattened `attending_count`.

### Phase 1: Vibe & Security Audit
- **Vibe Check**: "Backend-First" enforced. RSVP logic is handled in server actions (`app/actions/events.ts`).
- **Attack Surface**:
  - **RLS**: Verified ownership checks exist for `updateEvent` and `deleteEvent`.
  - **Detachment Vector**: When detaching an event (Edit This Only), ensure the new event inherits correct visibility and ownership from the parent. **Policy Requirement**: User must own the parent event to create a detached sibling.
  - **RSVP Manipulation**: Ensure users cannot RSVP for others. Server action correctly uses `auth.getUser().id`.
- **Handoff**: `🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...`

### Phase 2: Test Strategy
- **Sad Paths**:
  - **Detachment Collision**: User A edits "this only" while User B cancels the same occurrence.
  - **Series Boundary**: RSVPing to "this and future" from an event near the end of the series.
  - **Visual Lag**: Status not updating immediately on cards without full-page refresh.
- **Test Plan**:
  - **Unit**: Verify `useEventStatus` hook handles all combinations of `status` and `user_rsvp_status`.
  - **Integration**: `app/actions/events-series.test.ts` update to verify detachment logic (cloning).
  - **E2E**: `e2e/series-rsvp.spec.ts` update to cover "Edit This Only" flow and cross-page status consistency.
- **Handoff**: `🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...`

### Phase 3: Performance Assessment
- **Query Bottlenecks**:
  - `getEvents` (lib/data/events.ts) uses a generic filter approach.
  - **N+1 Risk**: Batching RSVP status checks using a single `in()` query for the list prevents per-event fetching.
- **Detachment Impact**: 
  - Each detachment adds a row to `events`. With `MAX_INSTANCES=12`, total growth is manageable.
  - **Index Audit**: Verified `events` table should have indexes on `tenant_id`, `start_date`, and `parent_event_id`.
- **Handoff**: `🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...`

### Phase 4: Documentation Logic
- **Audit Findings**:
  - **Admin Guide**: Missing instructions for "Edit This Event Only". **Action**: Create/Update `docs/01-manuals/admin-guide/events.md`.
  - **Resident Guide**: Missing UX explanation for Series RSVPs. **Action**: Update `docs/01-manuals/resident-guide/events.md`.
  - **API Reference**: Missing documentation for `updateEvent` and `rsvpToEvent` logic. **Action**: Add to `docs/02-technical/api/api-reference.md`.
- **Gaps logged**: `docs/documentation_gaps.md` updated with missing event RLS and API documentation needs.
- **Handoff**: `🔁 [PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...`

### Phase 5: Strategic Alignment & Decision
- **Board Conflict Scan (MCP)**:
  - **Issue #93 (Mobile Series RSVP UI)**: High affinity. UI changes in Issue #78's "Detachment" strategy must align with #93's mobile-first approach.
  - **Issue #81 (Check-in RSVP Consistency)**: Shared logic patterns. Ensuring `rsvpToEvent` changes don't complicate `check_in_rsvps` integration.
- **Decision**: **PROCEED**. 
  - Issue #78 is scoped as **Size M**.
  - **Risk**: Low.
  - **Priority**: P1.
  - **Status**: Move to `Ready for Development`.
- **Handoff**: `🔁 [PHASE 5 COMPLETE] Strategic review finished. Ready for Scoping/Build phase.`
- **Findings**:
  - Code is secure.
  - The issue is purely a data interface mismatch (Type Safety gap).





