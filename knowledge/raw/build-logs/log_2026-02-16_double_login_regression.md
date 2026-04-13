---
source: build-log
imported_date: 2026-04-08
---
# Build Log: [Bug] Double Login Regression
**Issue:** #108 | **Date:** 2026-02-16 | **Status:** In Progress

## Context
- **PRD Link**: [prd_2026-02-14_sprint_3_core_polish_friction.md](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/03_prds/prd_2026-02-14_sprint_3_core_polish_friction.md)
- **Req Link**: [requirements_2026-02-14_double_login_regression.md](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-02-14_double_login_regression.md)
- **Board Status**: Moving to In Progress.

## Clarifications (Socratic Gate)
- **Grace Period**: Confirmed with user that 60 seconds is sufficient. The grace period bridges the gap between `last_sign_in_at` update and the next request where `last-active` cookie is missing.
- **Remember Me**: Logic remains unchanged.
- **Testing**: Added `vitest` and created `lib/supabase/middleware.test.ts` to verify the fix.

## Progress Log
- 2026-02-16: Workspace initialized. Branch `feat/108-double-login-regression` created. PRD and requirements reviewed.
- 2026-02-16: Implemented `last_sign_in_at` check in `lib/supabase/middleware.ts`.
- 2026-02-16: Added `lib/supabase/middleware.test.ts` and verified with `npm run test`. All tests passed.

## Handovers
<!-- Agent-to-Agent context transfers -->

## Blockers & Errors
<!-- Issues encountered -->

## Decisions
- **Strategy**: Trusted `last_sign_in_at` from Supabase Auth as the source of truth for fresh sessions, bypassing the strict `last-active` cookie check for 60 seconds.

## Lessons Learned
- **Middleware State**: Relying solely on client-side cookies for activity tracking introduces race conditions on fresh logins. Always allow a "grace window" backed by server-side session timestamps.
