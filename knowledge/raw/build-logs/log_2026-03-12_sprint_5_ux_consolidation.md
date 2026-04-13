---
source: build-log
imported_date: 2026-04-08
---
# Build Log: Sprint 5 - UX Consolidation
**Sprint PRD:** [prd_2026-02-15_sprint_5_ux_consolidation.md](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/03_prds/prd_2026-02-15_sprint_5_ux_consolidation.md)
**Date:** 2026-03-12 | **Status:** In Progress

## Context
- **Board Status**: Sprint 5 has 7 "Ready for Development" issues.
- **Git Strategy**: Single branch `fix/sprint-5-bug-bash`.
- **Patterns Noted**: 
    - **Mapbox Viewer**: Use `MapboxViewer.tsx` as the primary component.
    - **Z-Index**: Watch out for Mobile Dock overlap.
    - **Data Normalization**: Strict requirement for Lot Search (#155).
    - **Broken Tokens**: `clay-red` is missing in `globals.css` but used in `access-requests-table.tsx`.
    - **Backend-First Auth**: Recommended for complex social interactions, though these issues look mostly UI/UX focused.

## Clarifications (Socratic Gate)
*Pending Phase 1 selection.*

## Selected Issues for Selection Gate

| Issue | Title | Summary | Size |
|-------|-------|---------|------|
| #116 | View on Map Refactor | Redirect legacy map routes to `CommunityMap`. | XS |
| #114 | Mapbox Cleanup & Icons | Fix marker duplication and add emoji/image icons. | XS |
| #141 | Announcement Archive 404 | Fix 404 error when viewing announcement archive. | S |
| #140 | Family UI Overflow | Fix horizontal scroll on mobile for family cards. | S |
| #139 | Event Creation Test Icon | Delete "Test" category from `event_categories`. | XS |
| #156 | List Member Visibility | Fix `.slice(0, 10)` bug in member search. | S |
| #155 | Lot Search Fix | Robust normalization and ranking for lot numbers. **[Added: Fix Reject Button visibility]** | S |

## Progress Log
- [2026-03-12 08:35] Phase 0 initialized. Issue details fetched.
- [2026-03-12 14:45] **QA Phase 0 Found Criticals**:
    - `resident.lot_id` is missing in `page.tsx` query => View on Map button broken in Directory.
    - CodeRabbit flagged race condition in `community-map-client.tsx`.
    - `npm run lint` failing (investigating).

## QA Findings (Sprint 5)

### Critical & High Severity
- **[Logic]**: `neighbours/page.tsx` does not select `lots.id` or `lots.location_id` properly for use as `resident.lot_id` in the table.
- **[UX]**: `map-preview-widget.tsx` missing deep link propagation for `highlightLocationId`.
- **[Code Quality]**: `useMemo` called inside JSX in `request-access-form.tsx` (Hook violation).

### Polish & Nits
- **[Pattern Doc]**: `nido_patterns.md` missing topical index.
- **[Clean Code]**: Unused `useRef` in `request-access-form.tsx`.
- **[Consistency]**: Capitalization utility needed for journey stages.

## Handovers
- **Handoff (PM -> Specialist)**: All issues are researched and requirements are mapped. Ready for first issue selection.
