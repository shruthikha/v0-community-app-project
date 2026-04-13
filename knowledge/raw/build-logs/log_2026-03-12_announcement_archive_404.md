---
source: build-log
imported_date: 2026-04-08
---
# Build Log: Announcement Archive 404
**Issue:** #141 | **Date:** 2026-03-12 | **Status:** ✅ Completed

## Context
- **PRD Link**: [Sprint 5 PRD](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/03_prds/prd_2026-02-15_sprint_5_ux_consolidation.md)
- **Req Link**: [Announcement Link Fix Req](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-03-10_announcement_archive_link_fix.md)
- **Board Status**: Moved to QA

## Clarifications (Socratic Gate)
- Confirmed that the "Official" page already existed and handled the `tab=announcements` parameter.
- Confirmed that simple link update was preferred over a server-side redirect for this specific bug.

## Progress Log
- **2026-03-12 10:15**: Identified broken hardcoded links in `components/dashboard/announcements-widget.tsx`.
- **2026-03-12 10:20**: Updated links to point to `/t/${slug}/dashboard/official?tab=announcements`.
- **2026-03-12 10:25**: Verified navigational fix.
- **2026-03-12 10:30**: Added "Tab-Based Feature Migration" pattern to `nido_patterns.md`.

## Decisions
- Chose to fix the link in the widget directly to align with the current architecture where Announcements are a tab in the Official page.

## Lessons Learned
- **Navigational Debt**: When moving features between routes, global navigation components (widgets, sidebars) must be audited immediately.
- **Documentation Gaps**: Identified that core features like Announcements were missing schema and RLS documentation in the codebase.
