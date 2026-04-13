source: idea
imported_date: 2026-04-08
---
# Idea: Review Quick Stats Utility and Visibility

## Problem Statement
Users have reported that the "Quick Stats" on the dashboard feel like "prime real estate" without offering sufficient utility.
Specifically, one user mentioned they don't understand the utility *unless* they can click them to navigate (e.g., to neighbors, upcoming events).
However, the stats *are* currently clickable. This indicates a **discoverability issue** (affordance failure) rather than a complete lack of functionality. The user perception is that they are just static numbers or "clutter".

## User Persona
*   **Role**: Community Admin / Dashboard User
*   **Goal**: Quickly assess community health and take action on key metrics.
*   **Frustration**: dashboard feels cluttered with non-actionable or unclear data points.

## Context
*   We previously identified "Review quick stats use and benefit" as a requirement (Issue #45).
*   Current feedback highlights that the *interaction* is hidden, leading to perceived low value.
*   If we can't improve utility/visibility, the fallback is to remove them.

### Issue Context
*   **GitHub Issue**: #45 (Review quick stats use and benefit)

## Dependencies
*   [#45](https://github.com/mjcr88/v0-community-app-project/issues/45)

## Technical Options

### Option 1: UX Enhancement (High Affordance)
Improve the visual design of the existing cards to make interaction obvious.
*   **Changes**: Add hover effects (lift up, shadow), add a visibly clickable icon (chevron-right or external-link), and change cursor to pointer. Add a textual label "View All" or similar.
*   **Pros**: Retains current layout; low effort; addresses the primary "I didn't know I could click" feedback directly.
*   **Cons**: Still occupies "prime real estate" if the data itself is not useful.
*   **Effort**: Low (CSS/Light Component update).

### Option 2: Transformation to Action List
Convert the "Stat Cards" (big numbers) into a compact "Quick Actions" or "Summary" list.
*   **Changes**: Remove the "Big Number" emphasis. Create a list: "Neighbors (12) >", "Upcoming Events (3) >".
*   **Pros**: Saves vertical space; explicitly framed as navigation/actions; cleaner UI.
*   **Cons**: Less "dashboard-y" visual appeal (less graphical); might look like just another menu.
*   **Effort**: Medium (Component refactor).

### Option 3: Removal & Sidebar Reliance
Remove the Quick Stats section entirely.
*   **Changes**: Delete the component from the dashboard.
*   **Pros**: Maximum decluttering; forces use of primary navigation (sidebar) which is consistent.
*   **Cons**: Dashboard might look empty; loses "at a glance" health check; users might miss the "shortcut" aspect entirely.
*   **Effort**: Low (Deletion).

## Recommendation

### Strategy: Fix Affordance First (Option 1)
The user's feedback ("I don't understand utility *unless* I can click") suggests they *would* find it useful if they knew it was navigable.
Before removing functionality or refactoring components, we should simply **make the existing ability obvious**.
If usage remains low after fixing the UI affordance, we can proceed to Option 3 (Removal).

### Metadata
*   **Priority**: P2
*   **Size**: XS
*   **Horizon**: Q1 26
