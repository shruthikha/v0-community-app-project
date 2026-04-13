source: requirement
imported_date: 2026-04-08
---
# Requirements: Series RSVP Fix & Feature

## Problem Statement
1. **Bug (Missing RSVP Buttons)**: Users report that RSVP buttons appear for some events in a series but not others. **Root Cause**: The `updateEvent` action does not propagate `requires_rsvp` changes to child events. If a user enables RSVP on a parent event after creation, the children remain `requires_rsvp: false`.
2. **Missing Feature (Series RSVP)**: Users lack the ability to "RSVP to All" events in a series at once.
3. **Priority Feed Noise**: The "Priority Feed" on the dashboard shows *all* events within 7 days, creating noise. It should only show events with explicit interaction.

## User Persona
- **Resident**: Wants to RSVP to *one* specific session OR *all future* sessions with a single click. Wants their home dashboard to be relevant, showing only events they care about (RSVP'd/Saved), not every timeline event.
- **Event Organizer**: Needs accurate headcount for each session, but wants to minimize friction for regulars.

## Context
- **Current Behavior**: 
    - Frontend: `EventRsvpSection` returns `null` if `requiresRsvp` is false.
    - Backend: `updateEvent` only updates the specific `eventId` targeting. It **fails** to propagate properties like `requires_rsvp`, `start_time`, etc., to child events in the series.
    - Result: If a user edits a series to enable RSVPs, only the parent gets the button. Children remain un-bookable.
    - **Priority Feed**: `app/api/dashboard/priority/route.ts` currently fetches *all* events within 7 days.

## Dependencies
- **Backend Capability**: `app/actions/events.ts` already has logic for `scope === "series"`.
- **Issue #50** (Integrate with personal calendars): distinct scope.

---
**Handoff to Orchestrator (Phase 2)**
🔁 [PHASE 1 COMPLETE] Handing off to Orchestrator...

## Technical Options

### Option 1: Comprehensive Series Support (Recommended)
Solve both the data bug and the feature request together.
- **Backend (Fix)**: Update `updateEvent` in `app/actions/events.ts` to correctly propagate `requires_rsvp` to child events so individual buttons appear.
- **Frontend (Feature)**: Update `EventRsvpQuickAction` to show a dropdown/modal when clicking RSVP on a recurring event: "Attend this event only" vs "Attend all future events".
- **Pros**: Fixes the bug AND delivers the requested feature. leverages existing backend logic.
- **Cons**: Slightly more complex UI component.

### Option 2: Fix Bug Only
- **Backend**: Fix `updateEvent` propagation.
- **Frontend**: No change.
- **Pros**: Minimal effort.
- **Cons**: Ignores clear user desire for "Reply to all".

### Part B: Priority Feed Fix
#### Option 1: Strict Database Filtering (Recommended)
Refactor `app/api/dashboard/priority/route.ts` to fetch *only* relevant events.
- **Mechanism**:
    1.  Query `event_rsvps` for user's 'yes'/'maybe' records within range.
    2.  Query `saved_events` for user's saved records within range.
    3.  Fetch details for these specific `event_ids`.
- **Pros**: Scalable, ensures the feed *only* shows what is asked.
- **Cons**: Slightly more complex query structure than "fetch all".

#### Option 2: Post-Fetch Filtering
- **Mechanism**: Fetch next 20 events, filter in JS.
- **Pros**: Simpler DB query.
- **Cons**: Risk of empty feed if user hasn't interacted with the *immediate* next events, but has one later. Breaks the "Time Horizon" contract if we fetch too many to find one.

- **Info**: Added Priority Feed Logic Options.

---
**Handoff to Product Owner (Phase 3)**
🔁 [PHASE 2 COMPLETE] Handing off to Product Owner...

### Recommendation

### Strategy
**Implement Part A Option 1 (Full Series Support) AND Part B Option 1 (Strict Filtering)**.
- **Series RSVP**: The user explicitly asked for "reply to all", and the backend already supports it.
- **Priority Feed**: The current "show all" logic defeats the purpose of a "Priority" feed. Strict DB filtering is required to scale.

### Implementation Plan
1.  **Backend (Series)**: Fix `updateEvent` to propagate `requires_rsvp`.
2.  **Backend (Feed)**: Rewrite `GET` in `priority/route.ts` to query `event_rsvps` and `saved_events` first.
3.  **Frontend**: Update `EventRsvpQuickAction` to handle "Series" RSVP mode (The Feature).
    - If event is part of series, show Popover/Dialog on RSVP click.
    - Call `rsvpToEvent` with `scope="series"` if selected.

### Classification
- **Priority**: P1
- **Size**: M (Frontend focus)
- **Horizon**: Q1 26


## 8. Technical Review

### Phase 0: Context Gathering
- **Explorer Map**:
    - **Frontend**: `app/t/[slug]/dashboard/events/[eventId]/event-rsvp-section.tsx` (Logic for single event RSVP).
    - **Frontend**: `components/event-rsvp-quick-action.tsx` (UI for Quick RSVP).
    - **Backend**: `app/actions/events.ts` (Contains `rsvpToEvent`, `updateEvent`, `createEvent`).
    - **API**: `app/api/dashboard/priority/route.ts` (Priority Feed Logic).
- **Historical Context**:
    - `events.ts`: Recent work on "Recurring Events" (commit `c0266b4`) introduced the series logic but missed propagation in `updateEvent`.
    - **New Requirement**: Issue comment highlights "New series show up in the priority feed of everyone" as a bug to fix.
    - **Tests**: No existing `events.test.ts` found. Need to establish new test suite.

### Phase 1: Vibe & Security Audit
- **Vibe Check**: PASS. Code follows established patterns.
- **Attack Surface**:
    - **RLS**: `rsvpToEvent` logic relies on implied RLS for fetching series events. Explicit check via `canUserViewEvent` missing but likely covered by DB policies (To Verify).
    - **Input Validation**: Strong typing on inputs.
    - **DoS Risk**: `rsvpToEvent` loops over all series events. Large series could cause timeout. Limit enforced in `createEvent` (1 year max, 12 instances max batch), but series could technically grow.

### Phase 2: Test Strategy
- **Sad Paths**:
    - User RSVPs to series where some future events are full.
    - User RSVPs to series where they are blocked from one event (if logic allows mix).
    - Concurrent RSVPs to last spot.
- **Test Plan**:
    - **Unit**: Create `tests/events.test.ts` to mock Supabase and test `rsvpToEvent` series logic.
    - **Integration**: Test `updateEvent` ensuring children property propagation (bug reproduction).
    - **E2E**: Create `e2e/events.spec.ts`.
        - Scenario 1: Create Series -> Update Parent (Verify Children Unchanged initially, then Fixed).
        - Scenario 2: RSVP to "All future events" -> Verify DB `event_rsvps` count.
        - Scenario 3: Priority Feed contains only relevant events.

### Phase 3: Performance Assessment
- **N+1 Issue**: Confirmed in `rsvpToEvent` (Line 789).
    - **Impact**: Medium (Series capped at 1 year/52 weeks).
    - **Fix**: Refactor to use `Promise.all` or bulk `upsert`.
- **Priority Feed**: Current logic fetches *all* events in range then filters.
    - **Impact**: High if many irrelevant events exist.
    - **Fix**: Filter by `event_rsvps` or `saved_events` at DB level.

### Phase 4: Documentation Plan
- **Manuals**: Update `docs/01-manuals/resident-guide` with new RSVP options.
- **Gaps**: `events.ts` server actions not fully documented in `docs/02-technical/api`. RLS policies for `events` table documentation missing (`docs/02-technical/schema/policies/events.md`).

### Phase 5: Strategic Alignment
- **Decision**: **Prioritize** (Ready for Development).
- **Sizing**: M (Confirmed).
- **Rationale**: High user value. Backend capability exists. The identified N+1 performance issue must be addressed during implementation.
