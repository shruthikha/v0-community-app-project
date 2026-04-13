source: requirement
imported_date: 2026-04-08
---
Requirements: Mobile Series RSVP UI (Issue #93)

## 1. Context
*   **Problem:** The current "Series RSVP" logic (added in Issue #63) uses a standard `Dialog` component. On mobile devices, users report that **no dialog appears** (interactions result in immediate success message or no visible UI), preventing selection of "RSVP to Series". The center-aligned modal is also not ergonomically optimized for mobile.
*   **Goal:** Improve the mobile experience for RSVPing to series events by introducing a responsive UI pattern: `Dialog` on Desktop, `Drawer` (Bottom Sheet) on Mobile.

## 2. Technical Requirements

### 2.1. Infrastructure
*   **Component:** Implement `components/ui/drawer.tsx` using `vaul` (already installed).
*   **Wrapper:** Create a `ResponsiveDialog` component (or `Credenza` pattern) that:
    *   Accepts `isOpen`, `onOpenChange`, `title`, `description`, `children`.
    *   Renders `Dialog` (radix-ui) on Desktop (`min-width: 768px`).
    *   Renders `Drawer` (vaul) on Mobile.

### 2.2. UI Updates
*   **Refactor `EventRsvpQuickAction.tsx`:**
    *   Replace `Dialog` with `ResponsiveDialog`.
    *   Ensure buttons ("Just this event", "This and future") are vertically stacked and touch-friendly on mobile.
*   **Refactor `EventRsvpSection.tsx`:**
    *   Replace `Dialog` with `ResponsiveDialog`.
    *   Maintain existing logic and state.

## 3. Acceptance Criteria (AC)
- [ ] **Infrastructure:** `Drawer` component exists and works.
- [ ] **Responsive:**
    - [ ] Desktop (Width > 768px): Clicking RSVP on a series event opens a **Center Modal**.
    - [ ] Mobile (Width < 768px): Clicking RSVP on a series event opens a **Bottom Sheet**.
- [ ] **Functionality:**
    - [ ] "Just this event" button works in both views.
    - [ ] "This and future events" button works in both views.
    - [ ] Closing the drawer/dialog works (tap outside, drag down on mobile).
- [ ] **Regression:** Standard (non-series) RSVP still works without any dialog.

## 4. References
*   **Issue:** [#93](https://github.com/mjcr88/v0-community-app-project/issues/93)
*   **Parent Issue:** #63 (Series RSVP Logic)
