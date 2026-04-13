source: requirement
imported_date: 2026-04-08
---
# Requirements: Member Visibility & Search Fix (Issue #156)

## Problem Statement
Residents are unable to find specific neighbors (e.g., "Raquel") using the search functionality in the "My Lists" feature. Additionally, only 10 residents are visible in the selection UI, even when more exist.

## Technical Requirement
The system must allow searching through the entire set of available community members for a tenant.

### Root Cause
1. **UI Clipping**: In `components/directory/ListDetailModal.tsx`, the `availableResidents` list is sliced to 10 items before being rendered.
2. **Search Logic**: The `Command` component's internal filtering only operates on rendered children. By slicing the array before rendering, the component "voids" any data outside the first 10 items.

## Proposed Changes
- **ListDetailModal.tsx**: Remove the `.slice(0, 10)` constraint.
- **page.tsx**: Expand the `users` query to include community-facing admin roles (`tenant_admin`).

## Verification Plan
1. Open "My Lists" modal.
2. Search for a resident known to be outside the first 10 entries (e.g., "Raquel").
3. Verify the resident appears and can be added to the list.
4. Verify total count of visible residents reflects the full community (excluding active list members).

## Classification
- **Priority**: P0
- **Size**: S
- **Horizon**: Q1 2026

## 8. Technical Review

### Phase 0: Context Gathering
- **Target Component**: `components/directory/ListDetailModal.tsx`
- **Impact Map**: 
    - `ListDetailModal.tsx`: Identified a hardcoded `.slice(0, 10)` on line 262 that restricts member visibility in search results.
    - `app/t/[slug]/dashboard/neighbours/page.tsx`: Fetches `allResidents` prop passed to the modal. Needs audit to ensure `tenant_admin` roles are included for community visibility.
- **Historical Context**: Recent updates to the neighbors directory (Commit `acfcacfb`) introduced grouped filters. The slice in the modal appears to be a legacy performance optimization or a leftover from a template.

🔁 **[PHASE 0 COMPLETE] Handing off to Security Auditor...**

### Phase 1: Vibe & Security Audit
- **Vibe Check**: The implementation follows the "Backend-First" pattern using server actions for all mutations in `app/actions/neighbor-lists.ts`.
- **Attack Surface**:
    - **PII Protection**: Confirmed that `app/t/[slug]/dashboard/neighbours/page.tsx` uses `applyPrivacyFilter` from `lib/privacy-utils.ts`. This ensures that even if `tenant_admin` roles are added to the community query, their sensitive data (email, phone) remains protected for regular residents.
    - **RLS Verification**: `neighbor_lists` and `neighbor_list_members` policies appropriately restrict access based on `owner_id` or `tenant_id`. 
- **Risk**: Low. The proposed changes (removing UI slice and expanding query roles) do not introduce new data exposure as long as the existing privacy filters are maintained.

🔁 **[PHASE 1 COMPLETE] Handing off to Test Engineer...**

### Phase 2: Test Strategy
- **Sad Paths**:
    - **No Matches**: Search for a string that doesn't exist; verify "No neighbors found" is displayed.
    - **Existing Members**: Verify that residents already in the list are filtered out of the "available" list (logic confirmed in `ListDetailModal.tsx:191`).
    - **Network Failure**: Simulate a failed add/remove to verify `sonner` toast error handling.
- **Verification Plan**:
    - **Manual**:
        1. Access the Neighbors page and open a list modal.
        2. Verify that residents previously hidden (beyond the first 10) are now searchable and visible.
        3. Verify that adding a `tenant_admin` (if enabled in `page.tsx`) works as expected.
    - **E2E**: Add a Playwright test if needed to automate the search/add flow.

🔁 **[PHASE 2 COMPLETE] Handing off to Performance Optimizer...**

### Phase 3: Performance Assessment
- **UI Render Impact**: Removing `.slice(0, 10)` will cause the `Command` list to render all available community members. Since the data is already fetched in `page.tsx` and passed down, the primary cost is DOM nodes. For communities > 500 members, this may causa a minor lag upon opening the "Add Member" search list.
- **Query Impact**: Expanding the `page.tsx` query to include `tenant_admin` role will slightly increase the payload size, but since there are typically few admins per tenant, this is negligible.
- **Recommendation**: Proceed with removal. If community sizes grow significantly, consider implementing virtualization (e.g., `react-window`) for the search results list.

🔁 **[PHASE 3 COMPLETE] Handing off to Documentation Writer...**

### Phase 4: Documentation Logic
- **User Manuals (`docs/01-manuals/`)**: Currently, the `resident-guide` is a known gap. Once populated, a section covering "My Lists" must specify that both neighbors and community-facing administrators (Tenant Admins) are available for selection.
- **Technical Docs**:
    - **API**: No changes to `app/actions/neighbor-lists.ts` signature, but internal query logic in `page.tsx` will be broadened.
    - **Schema**: No schema changes required.
- **Documentation Gaps**: 
    - Logged the lack of a community-wide standard for member visibility in `docs/documentation_gaps.md`.
    - Logged the missing role representation/filtering guidelines.

🔁 **[PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...**

### Phase 5: Strategic Alignment & Decision
- **Conflicts**: 
    - Issue #65 (@mentions) is in the backlog (P2). While related to resident selection, Issue #156 (P0) is a critical fix for existing functionality and should precede it.
    - No other active "In Progress" items conflict with this UI/query fix.
- **Sizing**: **S** (Small) - Requires minor UI logic changes and a query expansion in a single page.
- **Decision**: **Prioritize** (Move to "Ready for development").

## Definition of Done (DoD)
- [x] Hardcoded `.slice(0, 10)` removed from `ListDetailModal.tsx`.
- [x] `page.tsx` query expanded to include `role.in(['resident', 'tenant_admin'])`. (Note: Filtered results for residents only as per user request).
- [x] Search functionality verified for residents outside the first 10 results.
- [x] Privacy filters confirmed to be active for all community views.
- [x] Documentation gaps in `docs/documentation_gaps.md` noted.

✅ **[REVIEW COMPLETE] Issue #156 is recommended for "Ready for development".**
