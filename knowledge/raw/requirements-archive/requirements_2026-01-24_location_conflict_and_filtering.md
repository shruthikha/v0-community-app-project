source: requirement
imported_date: 2026-04-08
---
# Requirements: Location Filtering & Conflict Detection

**Date**: 2026-01-24
**Topic**: Location Filtering & Conflict Detection
**Status**: DRAFT (Phase 1)

## 1. Problem Statement
Users currently face two friction points regarding event locations:
1.  **Discovery**: It is difficult to see all events scheduled for a specific location (e.g., "Almendro Shala") to find free slots.
2.  **Creation**: Users can accidentally schedule an event at a location that is already booked, as there is no immediate feedback or warning during the creation process.

## 2. User Persona
*   **Primary**: Community Event Planner.
*   **Goal**: "I want to easily find a free slot for my event and be warned if I try to book an occupied space."

## 3. Context & Background
*   **Feedback**: "quickly checking... what events are planned at a specific location" and "notified if an event is already planned".
*   **Current State**: 
    *   Event Calendar has no location filter.
    *   `LocationSelector` allows picking a location but offers no availability context.
*   **Scope**:
    *   **Part A**: Filter events by location on the dashboard.
    *   **Part B**: Real-time (or near real-time) conflict warning in the `Create Event` flow.

## 4. Dependencies
*   **Components**:
    *   `EventsCalendar` (for filtering).
    *   `LocationSelector` (for conflict warning).
*   **Data**:
    *   `Events` table (source of truth for bookings).
    *   `Location` table (entities to book).

## 5. Issue Context (Documentation Gaps)
*   **Conflict Logic**: Does the backend currently support querying "events at location X between time Y and Z"?
*   **Creation Flow**: `LocationSelector` is used in a larger form (likely `EventCreateForm` or `CreateEventPage`). Need to ensure the warning can be displayed prominently there.

---
**Next Steps**: Handoff to Orchestrator for Technical Options.

## 6. Technical Options (Ideation Phase)

### Part A: Dashboard Filtering
#### Option 1: Server-Side Filtering (Recommended)
Add filter controls to `EventsHeader` and use URL search params.
*   **Mechanism**: Update `getEvents` in `lib/data/events.ts` to accept `locationId` and `locationType`.
*   **Pros**: Scalable, shareable URLs.
*   **Cons**: Page refresh (fast in Next.js).
*   **Effort**: Low

### Part B: Conflict Warning (Creation Flow)
#### Option 1: Real-time Check (Recommended)
Implement a client-side check in `LocationSelector` or `EventCreateForm`.
*   **Mechanism**: 
    1.  Create a new server action `checkLocationAvailability(locationId, startDate, startTime, endDate, endTime)`.
    2.  Call this action when `locationId` AND dates are selected in the form.
    3.  If conflict found, display an inline `Alert` (Warning level) next to the location selector.
*   **Pros**: Immediate feedback, preventing user frustration before submission.
*   **Cons**: Requires a new API/Action.
*   **Effort**: Medium

#### Option 2: Post-Submission Block
Fail the form submission if a conflict exists.
*   **Mechanism**: Add validation logic in the `createEvent` action.
*   **Pros**: Zero UI complexity.
*   **Cons**: Bad UX; user learns of conflict only after filling the whole form.
*   **Effort**: Low

#### Option 3: Calendar Overlay (Ideal but Reserved)
Show the location's calendar *inside* the location selector.
*   **Pros**: Best UX.
*   **Cons**: High effort, out of scope for "Quick Check".

## 7. Recommendation (Product Owner)

### Selected Approach: Combo Option 1 (Server-Side Filter) + Option 1 (Real-time Warning)
We will proceed with **Server-Side Filtering** for the dashboard and **Real-time Availability CHecks** for the creation flow.

### Classification
*   **Priority**: **P1** (High Value)
*   **Size**: **M** (Medium - 3-4 days dev)
*   **Horizon**: **Q1 2026**

### Proposed Scope
1.  **Backend**:
    *   Update `getEvents` to support `locationType`.
    *   Create `checkLocationAvailability` server action (taking start/end range + location).
2.  **Dashboard UI**:
    *   Add `LocationFilter` (Select) to `EventsHeader`.
3.  **Creation UI**:
    *   Update `LocationSelector` to trigger availability check on change.
    *   Display "Warning: Event overlaps with [Existing Event]" if conflict found.
    *   *Note*: We will NOT block submission for now (soft warning), as some double-booking might be intentional (e.g., shared space).

## 8. Technical Review

### Phase 0: Context Gathering

#### 0.1 Issue Details
*   **Title**: [Brainstorm] Location Filtering & Conflict Detection
*   **URL**: [Project Item 151793820](https://github.com/users/mjcr88/projects/1/views/6?sortedBy%5Bdirection%5D=asc&sortedBy%5BcolumnId%5D=Status&pane=issue&itemId=151793820)
*   **User Story**: As a Community Event Planner, I want to easily find a free slot for my event and be warned if I try to book an occupied space.
*   **Core Requirements**:
    1.  **Dashboard**: Filter events by location.
#### 0.2 Impact Map
*   **UI Components**:
    *   `EventsCalendar`: `app/t/[slug]/dashboard/events/events-calendar.tsx`
    *   `LocationSelector`: `components/event-forms/location-selector.tsx`
    *   `EventCreateForm`: `app/t/[slug]/dashboard/events/(management)/create/event-form.tsx`
*   **Data Access**:
    *   `lib/data/events.ts` (Need to add `locationId` filter)
    *   `lib/data/locations.ts` (Likely used for availability check)
*   **Schema**:
    *   `types/supabase.ts` (Defines `events` and `locations` tables)

#### 0.3 Historical Context
*   **Recent Changes**: Commit `c0266b4` (2026-01-11) "Unified checking/priority algorithms and refactored event forms".
*   **Risk**: Competing logic with the recent recurring events and priority algorithm refactor.
*   **Action**: Ensure new "Conflict Check" doesn't break existing recurring event validation logic.

---
**Handoff to Phase 1 (Security Audit)**

### Phase 1: Security Audit (@security-auditor)

#### 1.1 Vibe & RLS Check
*   **Current State**: `lib/data/events.ts` uses `createServerClient` (User Context).
*   **RLS Gaps**: `supabase/migrations` not found. Cannot verify strict RLS policies.
    *   > [!IMPORTANT]
    *   > **Manual Verification Required**: Verify `events` table has RLS enabled and policies restrict access to `visibility_scope`.

#### 1.2 Attack Surface Analysis
*   **New Server Action**: `checkLocationAvailability`
*   **Privacy Risk**: If a user books a "Private" event, regular users won't see it via `getEvents`.
    *   **Vulnerability**: Concurrency/Conflict. A user might double-book because they validly can't see the conflicting private event.
    *   **Mitigation**: The check **MUST** use a Service Role client to query *all* events at the location, regardless of visibility.
    *   **Leakage Prevention**: Return strictly `boolean` (Conflict: True/False). Do **NOT** return event details for private conflicts.
*   **Tenant Isolation**: Ensure `location_id` belongs to the current tenant before checking.
*   **Rate Limiting**: Apply `lib/rate-limit.ts` to preventing enumeration of private calendar slots.

---
**Handoff to Phase 2 (Test Strategy)**

### Phase 2: Test Strategy (@test-engineer)

#### 2.1 Sad Path Analysis
1.  **Time Travel**: User selects `End Time` before `Start Time`.
2.  **Ghost Location**: `locationId` refers to a deleted location.
3.  **Race Condition**: Two users book the same slot simultaneously.
    *   *Note*: Since we are doing a "Soft Warning" and not blocking submission, the race condition will result in a double booking. This is acceptable per requirements but should be noted.
4.  **Privacy Conflict**: User A tries to book a slot occupied by User B's "Private" event. System MUST warn of conflict without revealing User B's event details.

#### 2.2 Test Plan
*   **Unit Tests (`vitest`)**:
    *   `lib/data/events.ts`: Mock DB to test overlap logic (Partial, Enveloped, Exact Match).
    *   Test `checkLocationAvailability` returns `true` (available) vs `false` (conflict).
*   **Integration Tests**:
    *   **Privacy Verification**: Create a private event for User A. As User B, check availability for that slot. Assert `conflict: true` but `event_details: undefined`.
*   **E2E Tests (`playwright`)**:
    *   **UI Feedback**: Open Create Event -> Select Location -> Select colliding time -> Assert "Warning" alert appears.

---
**Handoff to Phase 3 (Performance Assessment)**

### Phase 3: Performance Assessment (@performance-optimizer)

#### 3.1 Schema & Index Analysis
*   **Table**: `events` (via `scripts/events/03_create_events_table.sql`)
*   **Existing Indices**:
    *   `idx_events_location_id` (✅ Good for filtering by location)
    *   `idx_events_start_date` (✅ Good)
*   **Missing Index**: `end_date`.
    *   **Impact**: Querying overlaps (`start < ReqEnd AND end > ReqStart`) will rely largely on `start_date` index.
    *   **Recommendation**: Add index on `end_date` or a composite index `(location_id, start_date, end_date)` for optimal overlap checks.

#### 3.2 Bottleneck Detection
*   **getEvents (lib/data/events.ts)**:
    *   **N+1 Issue**: `enrichWithFlagCount` triggers `Promise.all` + `supabase.rpc` for *every* event.
    *   **Severity**: High. If fetching 50 events, this makes 51 network requests.
    *   **Fix**: Refactor to use a consolidated query or a VIEW that pre-calculates counts.
*   **checkLocationAvailability**:
    *   This will add an extra DB call to the synchronous `Creation` flow.
    *   **Mitigation**: Ensure only triggered on valid form states (debounce inputs).

---
**Handoff to Phase 4 (Documentation Plan)**

### Phase 4: Documentation Plan (@documentation-writer)

#### 4.1 Required Updates
1.  **User Manuals**:
    *   `docs/01-manuals/resident-guide.md`: Update "Creating an Event" section to explain the new "Occupied" warning and that double-booking is allowed but discouraged.
2.  **Analytics**:
    *   `docs/02-technical/analytics/analytics-events.md`: Add new event `event_creation_conflict_shown` (properties: `locationId`, `date`).
3.  **Flows**:
    *   `docs/02-technical/flows/event-creation.mermaid` (if exists): Add "Availability Check" decision node between "Select Location" and "Submit".
4.  **Documentation Gaps & Infrastructure**:
    *   **Critical Gap**: `supabase/migrations` is missing. Action: Dump current schema to `supabase/migrations` to establish RLS source of truth.
    *   **New Files**:
        *   `docs/02-technical/api/api-reference.md` (Currently empty).
        *   `docs/02-technical/schema/tables/events.md` (Missing).
        *   `docs/02-technical/schema/policies/events.md` (Missing).

---
**Handoff to Phase 5 (Strategic Alignment)**

### Phase 5: Strategic Alignment & Decision (@product-owner)

#### 5.1 Strategic Impact
*   **Priority**: P1 (Confirmed). High user friction in current "blind booking" process.
*   **Risks**:
    *   **Privacy**: Essential to handle private event visibility correctly in the conflict check (See Phase 1).
    *   **Performance**: N+1 in `getEvents` needs addressing to ensure the Dashboard filter doesn't degrade performance (See Phase 3).
*   **Sizing**: **Medium (M)**. 3-4 Days.

#### 5.2 Final Decision
*   **Verdict**: **Prioritize**. Ready for Development.
*   **Caveats**: Must include the index addition and N+1 fix in the scope.

## 9. Final Specification (Consolidated)

### 9.1 Database & Schema
1.  **New Index**: Add composite index `idx_events_conflict_check` on `(tenant_id, location_id, start_date, end_date)` to support efficient range queries.
2.  **RLS**: Verify strict policies on `events` table (Manual Step).

### 9.2 Server Action: `checkLocationAvailability`
*   **Input**: `locationId`, `start`, `end`.
*   **Logic**:
    *   Use `createAdminClient` (Service Role) to query **ALL** events at location.
    *   Filter: `(EventStart < InputEnd) AND (EventEnd > InputStart)`.
    *   Ignore: `status = 'cancelled'`.
*   **Output**: `{ conflict: boolean }`. **NO** event details.
*   **Security**: Validate `location_id` belongs to `tenant_id`.

### 9.3 UI Implementation
1.  **Dashboard**: Add `LocationFilter` component to `EventsHeader`. Update `getEvents` to handle `locationId`.
2.  **Event Form**:
    *   Update `LocationSelector` to trigger `checkLocationAvailability` when location/time changes.
    *   Debounce: 500ms.
    *   State: Show "Checking..." -> "Available" (Green) or "Occupied - Warning" (Yellow).
    *   **Submission**: Do **NOT** block submission on conflict (Soft Warning).

### 9.4 Optimization
*   **Refactor**: Fix N+1 flag count issue in `getEvents` by using a subquery or view.

✅ **REVIEW COMPLETE**