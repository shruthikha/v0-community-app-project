source: requirement
imported_date: 2026-04-08
---
# Requirements: Rio Branding on Dashboard Empty States

## 1. Problem Statement
The current dashboard widgets act as the primary entry point for residents. However, the empty states (when no data is available) are inconsistent and visually dry. 
- Some use generic Lucide icons (small, 40px).
- Some use an older placeholder image (`/rio/parrot.png`).
- The user feels the current states are "too small" and missing the "Rio" personality.

## 2. User Persona
**Resident**: Needs a friendly, engaging dashboard that feels "alive" even when there are no immediate items to act on. A confused Rio mascot adds a touch of personality and reduces the sterility of an empty dashboard.

## 3. Context & Scope
We need to update **all** dashboard widgets to use a standardized empty state image.

**Target Assets:**
- **Image**: `/rio/rio_no_results_confused.png`
- **Size**: **128px (w-32 h-32)** (Proposed increase from 96px/40px to ensure it is "bigger" and prominent).
- **Text**: Retain existing text as requested.

**Affected Components:**
1.  `components/reservations/MyReservationsWidget.tsx` (Currently: `Calendar` icon)
2.  `components/dashboard/upcoming-events-widget.tsx` (Currently: `Calendar` icon)
3.  `components/dashboard/live-checkins-widget.tsx` (Currently: `parrot.png` 80px)
4.  `components/dashboard/announcements-widget.tsx` (Currently: `Megaphone` icon)
5.  `components/exchange/my-listings-and-transactions-widget.tsx` (Currently: `parrot.png` 96px covering multiple tabs)
6.  `components/requests/my-requests-widget.tsx` (Currently: `ClipboardList` icon)

## 4. Dependencies
- **Assets**: `/public/rio/rio_no_results_confused.png` (Verified as existing).
- **Codebase**: Existing widget components in `components/dashboard`, `components/exchange`, `components/requests`, `components/reservations`.

## 5. Constraint Checklist & Confidence Score
1. **Confidence Score**: 5/5
2. **Confidence Justification**: The task is a straightforward UI asset swap across known components. No complex logic or backend changes required.

## 6. Riskiest Assumption
- That the `rio_no_results_confused.png` image has suitable aspect ratio and transparency to look good on the card background without additional styling (e.g. padding/margins).

## 7. Known Issues / Context Gaps
- None.

## 8. Technical Options

### Option 1: Inline Replacement (Per Component)
Modify each of the 6 identified widget components to directly implement the `next/image` component with the new asset.
- **Implementation**:
  - Open each file (`MyReservationsWidget`, `UpcomingEventsWidget`, etc.).
  - Locate existing empty state logic (usually `if (data.length === 0)`).
  - Replace Lucide icon or old `img` tag with `<Image src="/rio/rio_no_results_confused.png" width={128} height={128} alt="No results" />`.
  - Apply `w-32 h-32` tailwind classes.
- **Pros**: 
  - Zero abstraction overhead.
  - Zero risk of regression in other parts of the app.
- **Cons**: 
  - Repetitive code details (WET).
  - Future updates to the image or size require editing 6+ files.
- **Effort**: Low (0.5 days)

### Option 2: Shared `RioEmptyState` Component (Recommended)
Create a reusable component `components/dashboard/rio-empty-state.tsx` that encapsulates the image, sizing, and layout structure, accepting `message` and `action` as props.
- **Implementation**:
  - Create `RioEmptyState` component.
  - Refactor all 6 widgets to import and use `<RioEmptyState message="..." action={...} />`.
- **Pros**: 
  - **Single Source of Truth**: easy to update Rio's size or image globally later.
  - DRY code: reduces boilerplate in widgets.
  - Enforces UI consistency (spacing, font sizes, text colors).
- **Cons**: 
  - Slightly more initial setup than Option 1.
- **Effort**: Low (0.5 days)

### Option 3: Widget Wrapper Pattern
Create a Higher-Order Component or generic `DashboardWidget` wrapper that handles the `isLoading`, `error`, and `empty` states automatically based on a generic `data` prop.
- **Implementation**:
  - Create a generic `WidgetShell` that takes `data[]` and `renderItem` callback.
  - If `data` is empty, it automatically renders the Rio empty state.
- **Pros**: 
  - Enforces uniformity across all widget lifecycles.
- **Cons**: 
  - **High Complexity**: Each widget has unique props, header actions, and "create" buttons that might be hidden or shown differently in empty states. Refactoring all to a strict pattern might break specific widget nuances.
  - Over-engineering for a simple asset swap.
- **Effort**: High (1-2 days)

## 9. Recommendation
**Option 2: Shared `RioEmptyState` Component** is recommended.

**Justification**: 
While Option 1 is faster initially, creating a shared component (Option 2) is the correct architectural choice to ensure providing a consistent "Rio personality" across the platform. It prevents drift in icon sizes or text styles in the future and makes it trivial to swap the image if branding changes. It strikes the best balance between effort (low) and quality (high).

## 10. Classification
- **Priority**: P2 (Visual Polish / Vibe)
- **Size**: XS (Simple asset swap + component refactor)
- **Horizon**: Q1 26


