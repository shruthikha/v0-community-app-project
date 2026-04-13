---
source: build-log
imported_date: 2026-04-08
---
# Build Log: Lot Search Fix & Admin Rejection Visibility
**Issue:** #155 | **Date:** 2026-03-12 | **Status:** Completed

## Context
- **PRD Link**: [Sprint 5 UX Consolidation](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/03_prds/prd_2026-02-15_sprint_5_ux_consolidation.md)
- **Req Link**: [Request Access Search Fix](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-03-10_request_access_search_fix.md)
- **Design Context**: `clay-red` token is missing from `globals.css`, causing invisible buttons.

## Clarifications (Socratic Gate)
- **Search Normalization**: Stripping spaces and dashes confirmed as the correct approach.
- **Natural Sorting**: A-F grouping confirmed.
- **Color Hex**: `#C25B4F` confirmed for `clay-red`.

## Progress Log
- **2026-03-12**: Initialized build log and context. Re-routing from brainstorming to execution.
- **2026-03-12**: Added `--clay-red` token to `globals.css`.
- **2026-03-12**: Updated `Combobox` to support `label` and `search` props.
- **2026-03-12**: Implemented natural sorting and search normalization in `RequestAccessForm`.
- **2026-03-12**: Refined search ranking to prioritize prefix matches (D 1 before D 401) using weighted strings and stable sorting.
- **2026-03-12**: Documented Search Ranking and Stable Sort patterns in `nido_patterns.md`.
- **2026-03-12**: Verified via type-check.

## Handovers
<!-- Agent-to-Agent context transfers -->

## Blockers & Errors
<!-- Issues encountered -->

## Decisions
- **Decision**: Fix the global `clay-red` token in `globals.css` rather than using local overrides to ensure system-wide consistency.

## Lessons Learned
- **Shared Component Constraints**: Shared components like `Combobox` should always separate the logical `value` from the searchable `label` to prevent UUID-based search issues in the future.
- **Design Token Drift**: Custom tokens like `clay-red` must be defined in both `tailwind.config.ts` (as CSS variable references) and `globals.css` (as variable values) to work correctly.

