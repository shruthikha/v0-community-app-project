---
source: prd
imported_date: 2026-04-08
---
# PRD: Sprint 2 - UX Fixes & Consistency
**Date:** 2026-02-02
**Status:** DRAFT
**Sprint Goal:** Enhance user experience by fixing visual inconsistencies, streamlining admin workflows, and resolving UI bugs.

## Selected Issues (Sprint Scope)

| Issue | Priority | Size | Est. Hours | Risk | Title |
|-------|----------|------|------------|------|-------|
| #72 | **P0** | **S** | 4-8h | LOW | [Bug] Admin Family Selection Improvement |
| #81 | **P0** | **S** | 4-8h | LOW | [Design] Check-in RSVP Consistency |
| #69 | **P0** | **XS** | 2-4h | LOW | [Bug] Neighbor Directory Tab Alignment |
| #78 | **P0** | **M** | 8-16h | HIGH | [Bug] Upcoming Widget RSVP Count Fix & Event Series Management |
| #61 | **P1** | **M** | 8-12h | MED | [Feature] Location Filtering & Conflict Detection |

---

## Architecture & Git Strategy

### 1. Repository & Branching Strategy
*   **Repository:** `mjcr88/v0-community-app-project`
*   **Base Branch:** `main` (Production)
*   **Feature Branches:** Create `feat/<issue-number>-<short-slug>` for each ticket.
    *   Example: `feat/72-admin-family-select`
*   **Merge Strategy:** Squash & Merge via Pull Request.

### 2. CI/CD & Environment
*   **Build System:** Next.js (`npm run build`).
*   **Linting:** Native ESLint (`npm run lint`).
*   **Deployments:** Vercel (Auto-deploy on merge to `main`).

### 3. Dependency Map
*   **Independence:** All items in this sprint are largely independent and can be worked on in parallel.
*   **Shared Components:**
    *   Issue #81 (Check-in RSVP) touches `CheckInRsvpQuickAction.tsx`.
    *   Issue #78 (Widget RSVP) touches `UpcomingEventsWidget.tsx`.

---

## Implementation Plan
> *To be detailed in Phase 3*

### 1. [Bug] Admin Family Selection (#72)
*   **Owner:** `frontend-specialist`
*   **Goal:** Streamline resident creation by auto-selecting existing families.
*   **Implementation Steps:**
    1.  **Hook:** Create `useFamilySelection` hook.
        *   Input: `lotId`.
        *   Logic: Fetch families on lot. If count == 1, auto-select and set "Existing Family" mode.
    2.  **UI:** Update `AdminResidentCreateForm` to use the hook.
        *   Add "Override" button to force new family creation if needed.
*   **Acceptance Criteria:**
    - [ ] Selecting a Lot with 1 family automatically selects that family in the dropdown.
    - [ ] Admin can manually clear selection to create a NEW family.

### 2. [Design] Check-in RSVP Consistency (#81)
*   **Owner:** `frontend-specialist`
*   **Goal:** Align Check-in RSVP UI with standard Events and ensure cross-component state sync.
*   **Implementation Steps:**
    1.  **Dashboard:** Refactor `CheckInRsvpQuickAction.tsx`.
        *   Replace single toggle with 2-button group (Join, Maybe) + NumberTicker attendee counter.
        *   Implement toggle-off (tap active button to un-RSVP).
    2.  **Notifications:** Update Notification Card to use `DropdownMenu` for RSVP actions.
    3.  **Priority Feed:** Update `PriorityFeed.tsx` check-in actions — 2 buttons (✓, ?), removed ✕.
    4.  **Map Card:** Update `MapboxViewer.tsx` check-in sidebar — 2 buttons (Going, Maybe), removed "Can't", added attendee counter.
    5.  **State Sync:** Implement `rio-checkin-rsvp-sync` CustomEvent across all 3 surfaces for real-time cross-component RSVP sync.
*   **Acceptance Criteria:**
    - [x] Dashboard card shows 2 buttons (Join, Maybe) with attendee counter.
    - [x] Clicking "Maybe" updates state correctly in DB.
    - [x] Notification card uses compact dropdown (Join/Maybe/Decline).
    - [x] Map check-in card aligned: 2 buttons (Going, Maybe) + counter, no "Can't".
    - [x] RSVP state syncs in real-time between dashboard, priority feed, and map.

### 3. [Bug] Neighbor Directory Tab Alignment (#69)
*   **Owner:** `frontend-specialist`
*   **Goal:** Fix visual misalignment of tabs on desktop.
*   **Implementation Steps:**
    1.  **Component:** Edit `app/t/[slug]/dashboard/neighbours/neighbours-page-client.tsx`.
    2.  **Style:** Wrap `TabsList` in a container with `w-full max-w-md mx-auto` (matching Search Bar).
    3.  **Token:** Ensure usage of `rounded-full` or standard radius tokens.
*   **Acceptance Criteria:**
    - [ ] Tabs align perfectly with the Search bar on `md` and `lg` screens.
    - [ ] Mobile view remains responsive.

### 4. [Bug] Event RSVP Polish & Consistency (#78)
*   **Owner:** `frontend-specialist`, `backend-specialist`
*   **Goal:** Ensure accurate RSVP counts and visual consistency across dashboard and event lists, and implement "Detachment" strategy for series occurrences.
*   **Implementation Steps:**
    1.  **Widget:** Fix `UpcomingEventsWidget.tsx` attendee count using `_count.rsvps` from `lib/data/events.ts`.
    2.  **Consistency:** Update event card status indicators for series RSVPs in `EnhancedEventCard.tsx`.
    3.  **Series Logic:** Fix missing RSVP modal on the first occurrence of event series in `EventRsvpQuickAction.tsx`.
    4.  **Detachment (Backend):** In `app/actions/events.ts`, implement `detachEventOccurrence` helper. When updating "this event only" in a series, clone the occurrence to a standalone event and map relevant RSVPs.
    5.  **Detachment (Frontend):** Update `EventRsvpQuickAction.tsx` to use `ResponsiveDialog` for mobile/desktop choice between "This event" and "Series".
*   **Acceptance Criteria:**
    - [x] Widget shows correct attendee count.
    - [x] Event cards in list view show correct RSVP status color/icon.
    - [x] RSVPing to the first event in a series triggers "RSVP to Series" modal.
    - [x] Manual QA: Editing "This event only" creates a standalone duplicate; parent series remains intact.

### 5. [Feature] Location Filtering & Conflict Detection (#61)
*   **Owner:** `backend-specialist`, `frontend-specialist`
*   **Goal:** Let planners discover events at a specific location and warn when creating overlapping events.
*   **Requirement:** [requirements_2026-01-24_location_conflict_and_filtering.md](../02_requirements/requirements_2026-01-24_location_conflict_and_filtering.md)
*   **Implementation Steps:**
    1.  **Server Action (Backend):** Create `checkLocationAvailability` in `app/actions/events.ts`.
        *   Input: `locationId`, `startDate`, `endDate`, `startTime?`, `endTime?`, `excludeEventId?`.
        *   Uses service role client (bypass RLS) to check for overlapping events.
        *   Returns `{ hasConflict: boolean; conflictCount: number }` — **no private event details leaked**.
    2.  **Dashboard Filter (Frontend):** Add a "Location" filter card to `events-page-client.tsx`.
        *   Fetch community locations from `page.tsx` and pass as prop.
        *   Add `selectedLocationId` state and client-side filter in `filteredEvents`.
    3.  **Event Form Warning (Frontend):** Wire `checkLocationAvailability` into `event-form.tsx`.
        *   Trigger check when user selects a community location AND has date/time set.
        *   Display inline `Alert` warning — non-blocking (user can still submit).
    4.  **DB Index (Migration):** Add composite index on `events(location_id, start_date, end_date)` for conflict query performance.
*   **Acceptance Criteria:**
    - [ ] Dashboard: Selecting a location from the filter shows only events at that location.
    - [ ] Dashboard: Location filter chip appears and is clearable.
    - [ ] Event Form: Selecting a community location with overlapping dates shows a warning banner.
    - [ ] Event Form: Warning is non-blocking (user can still create the event).
    - [ ] Privacy: Conflict check returns boolean only, no private event titles or details.
    - [ ] Edit Mode: Editing an existing event excludes itself from the conflict check.

---

## Definition of Done
- [ ] Code passes `npm run lint` & `npx tsc --noEmit`
- [ ] PR reviewed by at least 1 team member
- [ ] Manual QA verification completed per ACs
- [ ] No new P0 bugs introduced
- [ ] Documentation updated (if applicable)

## Sprint Schedule
**Sprint Start:** Feb 9, 2026 (Monday)
**Sprint End:** Feb 12, 2026 (Thursday)

| Issue | Title | Est. Duration | Start Date | Target Date | Dependencies |
|-------|-------|---------------|------------|-------------|--------------|
| #72 | **Admin Family Select** | 2 Days | **Feb 9** | **Feb 10** | None |
| #81 | **Check-in Consistency** | 2 Days | **Feb 9** | **Feb 10** | None |
| #69 | **Tab Alignment** | 0.5 Days | **Feb 11** | **Feb 11** | None |
| #78 | **Event Detachment** | 2 Days | **Feb 11** | **Feb 12** | None |
| #61 | **Location Filter & Conflict** | 1.5 Days | **Feb 12** | **Feb 13** | None |

> *Note: #61 added to sprint on Feb 12. Schedule assumes parallel execution of #72 and #81 is possible.*

## Release Notes
### Neighbor Directory Polish
🚀 **Tab Alignment**
Fixed visual misalignment of tabs in the Neighbor Directory. Switched to a robust Grid Layout to ensure perfect symmetry and full-width touch targets on mobile.

🤝 **Privacy & Search**
- Restored Admin ability to view full resident profiles (Privacy Override).
- Fixed a bug where partial names could cause search errors.

