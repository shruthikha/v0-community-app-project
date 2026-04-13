---
source: build-log
imported_date: 2026-04-08
---
# Build Log: Resident Interest Creation & Directory Search Fix (#100)
**Issue:** #100 | **Date:** 2026-03-08 | **Status:** Verification Complete | 🏗️ Draft PR #142

## Context
- **PRD Link**: [`prd_2026-02-14_sprint_4_directory_and_access.md`](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/03_prds/prd_2026-02-14_sprint_4_directory_and_access.md)
- **Req Link**: [`requirements_2026-02-09_resident_interest_creation.md`](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-02-09_resident_interest_creation.md)
- **Board Status**: #70 ✅ Merged | #99 ✅ PR #138 | #111 Open (Ready for Dev) | #100 ✅ PR #142 | #115 Open | #109 Open

## Clarifications (Socratic Gate)
- **Profile Settings**: Interests section updated to inline search+dropdown+create pattern.
- **#111 Independence**: Proceeding independently.
- **RLS Hardening**: Scoped INSERT/DELETE policies added for `user_interests`.
- **Admin Removal**: Deleted `admin/interests` directory and sidebar link.

## Progress Log
- [06:33] Phase 0 Start: Discovery and analysis.
- [06:55] Phase 2A Start: Created branch `feat/100-interest-creation`.
- [06:56]: Wrote RLS migration `20260308000001_allow_interest_creation.sql`.
- [06:57]: Updated Onboarding main form (`interests-form.tsx`).
- [07:10] Phase 2B Refinement: Updated wizard component (`roots-step.tsx`) with inline creation per user feedback.
- [07:12] Phase 2C Refinement: Refactored settings form (`profile-edit-form.tsx`) to match new UI pattern.
- [07:14]: Verified directory search derivation in `neighbours/page.tsx`.
- [07:15]: Removed admin interest management pages and sidebar link.
- [07:16] Phase 2F Start: Staged and committed changes. [cf269d2]
- [07:20] Phase 2F Complete: Created Draft PR #142.
- [07:38] Phase 2G: Implemented "Request Access" copy updates (Household Name, tone refinements).
- [07:40] Phase 2H: Addressed PR feedback: Hardened `interests` RLS (tenant validation), added `user_interests` SELECT policy, added toast notifications.
- [07:41] Phase 2I: Initial Git Push to `feat/100-interest-creation`. [03e23d0]
- [08:00] QA Review: Detected "Vibe Code Violations" (Client-Side mutations).
- [08:20] Phase 2J: Refactored all mutations to Server Actions using Service Role (Backend-First).
- [08:25] Phase 2K: Removed client-side mutation RLS policies for `interests` and `user_interests`.
- [08:26] Verification Complete: Manual testing confirmed interests/skills logic persists and Super Admin visibility is understood.
- [08:27] Documentation: Created ADR 014 for Backend-First Interest Management.

## Build Summary
- **Inline Creation**: Residents can create interests from onboarding and settings.
- **Immediate Insertion**: Interests inserted into DB on click.
- **Directory Fix**: Filters derived from resident data, enabling user-created interests to show up immediately.
- **Security**: Hardened RLS for `user_interests` (scoped INSERT/DELETE/SELECT) and `interests` (tenant-scoped INSERT).
- **Cleanup**: Admin interface for interests removed.
- **Copy Refinements**: "Family Name" -> "Household Name" throughout request access flow.
- **Error States**: Added toast notifications for graceful silent failures.

## Handovers
- **Task Complete**: Resident interest creation is now self-service.
- **Next Task**: Transitioning to #115 (Profile Picture Cropping) or #109 (Auto-save) per sprint schedule.

## Lessons Learned
- Inline creation in search dropdowns requires `onMouseDown` + `preventDefault` to avoid focus collisions with `onBlur`.
- Deriving filter options from data (instead of table query) is more resilient for user-generated content (UGW).

### Phase 1: Test Readiness Audit
- **E2E Tests**: No (Path: `e2e/`)
- **Unit Tests**: No (Path: `tests/smoke/`)
- **Migrations Required**: No (Count: 1, `20260308000001_allow_interest_creation.sql`)
- **Data Alignment**: Pass
- **Coverage Gaps**: E2E tests for interest creation during onboarding, unit tests for component logic.

### Phase 2: Specialized Audit
- **Security Findings**: Pending automated scan.
- **Vibe Code Check**: **PASS** (Refactored to Server Actions + createAdminClient)
- **Performance Stats**: Build succeeded (Exit 0), no significant bundle size regressions detected.

### Phase 3: Documentation & Release Planning
- **Doc Audit**: Updated `log` and `ADR` to reflect dynamic creation.
- **Release Note**: Updated in PRD.
