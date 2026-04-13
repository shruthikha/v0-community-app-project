source: requirement
imported_date: 2026-04-08
---
# Check-in RSVP Consistency
**Issue:** [Issue #81](https://github.com/mjcr88/v0-community-app-project/issues/81)

## Problem Statement
The current Check-in RSVP experience is inconsistent with other parts of the application (specifically Events) and lacks flexibility. Currently, check-ins use a single toggle button ("Join"/"Joined"), whereas standard Events use a clearer 3-state system ("Going", "Maybe", "Not Going"). Additionally, the notification cards for check-in invites utilize a different style that consumes too much vertical space and doesn't align with the standard patterns.

## User Persona
- **Resident**: Wants to easily signal their intent ("Maybe") without fully committing, and expects a consistent interface across Events and Check-ins.

## User Stories
- As a resident, I want to execute a "Maybe" RSVP for a check-in so my neighbors know I might come.
- As a resident, I want the RSVP buttons on the Dashboard to look and behave exactly like Event RSVP buttons (3-button group).
- As a resident, I want to respond to a check-in invite directly from my notifications using a compact dropdown menu.

## Context
- **Current Dashboard UI**: Single Toggle Button (`CheckInRsvpQuickAction`).
- **Target Dashboard UI**: 3-Button Group (Check, Question, X) matching `EventRsvpQuickAction`.
- **Current Notification UI**: Custom "UserPlus" button.
- **Target Notification UI**: Compact Dropdown Menu to save space.
- **Backend**: The `check_in_rsvps` table's `rsvp_status` column **already has a CHECK constraint** allowing `'yes'`, `'maybe'`, and `'no'`. No schema migration is required.

## Dependencies
- **Codebase**: `components/events/event-rsvp-quick-action.tsx` (Reference Implementation).
- **Schema**: `check_in_rsvps` table (Verified).

## Technical Options

### Option 1: Shared Generic Component (Refactor)
Refactor `EventRsvpQuickAction` into a generic `RsvpQuickAction` component that accepts `onRsvp` callback and `status` prop.
- **Pros**: Guarantees identical visual consistency and behavior. Reduces code duplication.
- **Cons**: `EventRsvpQuickAction` currently handles specific event logic (deadlines, max attendees, waitlists) which check-ins don't have. Refactoring might introduce unnecessary complexity or "prop drilling" for simple check-ins.
- **Effort**: Medium

### Option 2: Component Duplication & Adaptation (Recommended)
Update `CheckInRsvpQuickAction` to copy the *JSX structure* and *styling* of `EventRsvpQuickAction` (the 3 buttons) but keep the logic separate.
- **Pros**: Decoupled logic. Easier to implement immediately. Allows Check-ins to evolve independently (e.g. if we add "expire after 2 hours" logic specific to check-ins).
- **Cons**: Visuals could drift apart over time if not maintained.
- **Effort**: Low

### Option 3: Shared UI / Separate Logic
Create a presentational `RsvpButtonGroup` component that just renders the 3 buttons, and have `EventRsvpQuickAction` and `CheckInRsvpQuickAction` import it.
- **Pros**: Best of both worlds. Visual consistency enforced, logic decoupled.
- **Cons**: Slight overhead to extract the UI component first.
- **Effort**: Medium

## Notification Options

### Option A: Dropdown Menu (shadcn/ui)
Use `<DropdownMenu>` with a trigger icon (e.g., `MoreHorizontal` or `UserPlus`) to show "Join", "Maybe", "Decline".
- **Pros**: Compact, standard shadcn pattern. Saves vertical space.
- **Cons**: 2 clicks to RSVP.
- **Effort**: Low

### Option B: Horizontal Button Group (Small)
Render 3 small icon-only buttons inline.
- **Pros**: 1 click to RSVP.
- **Cons**: Might wrap or look cluttered on small screens in the notification list.
- **Effort**: Low


## Recommendation

### Selected Approach
1.  **Dashboard**: **Option 2 (Adaptation)**. Update `CheckInRsvpQuickAction` to render the 3-button group (Yes/Maybe/No). This enforces visual consistency with Events while keeping the check-in logic (simple toggle awareness) contained.
2.  **Notifications**: **Option A (Dropdown)**. Implement a compact `DropdownMenu` for the notification card to allow RSVP actions without cluttering the UI.

### Classification
- **Priority**: P2 (UX Consistency)
- **Size**: S (Component Refactor)
- **Horizon**: Q1 26

### Implementation Plan
- [x] **Refactor** `components/check-ins/check-in-rsvp-quick-action.tsx` to support 2 states (Join/Maybe) with toggle-off and NumberTicker attendee counter.
- [x] **Update** `components/notifications/checkin-notification-card.tsx` to use Shadcn `DropdownMenu` for the RSVP action.
- [x] **Verify** `maybe` status persists correctly to `check_in_rsvps` table.
- [x] **Sync** Add `rio-checkin-rsvp-sync` CustomEvent across `PriorityFeed`, `CheckInRsvpQuickAction`, and `MapboxViewer` for cross-component state sync.
- [x] **Map card** Remove "Can't" button, add attendee counter, align with dashboard 2-button pattern.

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue Details**:
  - Title: [Brainstorm] Check-in RSVP Consistency
  - Problem: Inconsistency between Check-in RSVP (toggle) and Event RSVP (3-state). Notification styling is also inconsistent.
  - Linked Components: `CheckInRsvpQuickAction`, `EventRsvpQuickAction`, `check_in_rsvps` table.
- **Impact Map**:
  - **Frontend**: 
    - `components/check-ins/check-in-rsvp-quick-action.tsx` (Target for modification)
    - `components/event-rsvp-quick-action.tsx` (Reference pattern)
    - `app/t/[slug]/dashboard/events/events-list.tsx` (Usage of Event RSVP)
  - **Backend**:
    - `app/actions/check-ins.ts` (`rsvpToCheckIn` function)
    - `lib/data/check-ins.ts` (Data retrieval)
    - Table: `check_in_rsvps`
- **Historical Context**:
  - `CheckInRsvpQuickAction` was modified in commit `f4f017f` (Jan 16, 2026) to add analytics.
  - Core data layer implementation in `9d3185a` (Nov 20, 2025).

### Phase 1: Security Audit
- **Vibe Check**: Passed. Uses Server Actions (`rsvpToCheckIn`) and strict RLS.
- **Attack Surface**:
  - `rsvpToCheckIn` accepts `status` restricted to `"yes" | "maybe" | "no"`.
  - RLS policies (`08_fix_rls_recursion_final.sql`) prevent unauthorized RSVP modifications (`user_id = auth.uid()`).
  - Tenant isolation is enforced in RLS.
- **Findings**:
  - Backend already supports `maybe` status.
  - No new vulnerabilities introduced by exposing this status to UI.

### Phase 2: Test Strategy
- **Sad Paths**:
  - Network failure during toggle (Optimistic UI should rollback).
  - Rapid clicking (Debounce check).
  - "Maybe" status persistence (User refreshes page).
- **Test Plan**:
  - **Unit**: Verify `rsvpToCheckIn` rejects invalid status strings (handled by TS).
  - **Integration**: `CheckInRsvpQuickAction` should correctly highlight the active state (Yes/Maybe/No).
  - **E2E**:
    1. User clicks "Maybe".
    2. Toast shows "You tentatively joined".
    3. Reload page -> "Maybe" button remains active.

### Phase 3: Performance Assessment
- **Schema Analysis**:
  - `check_in_rsvps` has composite key/index on `(check_in_id, user_id)`. Upserts are efficient.
  - Fetching logic in `lib/data/check-ins.ts` uses batch querying (`.in("check_in_id", ids)`), avoiding N+1.
- **Impact**: Negligible. Adding "Maybe" just changes a string value, no new queries.

### Phase 4: Documentation Plan
- **Updates**:
  - `docs/01-manuals/resident-guide.md`: Update "How to RSVP" section to mention 3 options.
  - `docs/02-technical/schema/tables/check_in_rsvps.md`: Ensure `status` enum covers 'maybe'.
- **Gaps**: None critical.
