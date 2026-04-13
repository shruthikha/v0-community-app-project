source: requirement
imported_date: 2026-04-08
---
# Requirements: Announcement Archive Link Fix

## Problem Statement
The "View Archive" and "View All" buttons in the `AnnouncementsWidget` on the resident dashboard lead to a 404 error because they point to a non-existent route `/t/${slug}/dashboard/announcements`.

## User Persona
- **Resident**: Wants to see past announcements to stay informed about community updates.

## Context
- The project has an "Official" page at `/t/[slug]/dashboard/official` which contains an "Announcements" tab.
- This tab is the intended destination for viewing the full list/archive of announcements.
- The `OfficialPage` component (`app/t/[slug]/dashboard/official/page.tsx`) uses a `tab` search parameter to switch between "Announcements" and "Documents".

## Proposed Fix
Update the links in `components/dashboard/announcements-widget.tsx` to point to `/t/${slug}/dashboard/official?tab=announcements`.

## Dependencies
- `AnnouncementsWidget` component.
- `OfficialPage` component.

## issue_context
- GitHub Issue: #141
- Current broken link: `/t/${slug}/dashboard/announcements`
- Correct link: `/t/${slug}/dashboard/official?tab=announcements`

## Documentation Gaps
- The `Official` page routing and tab structure should be documented in the resident guide if not already present.

## Technical Options

### Option 1: Direct Link Update (Recommended)
Update the `AnnouncementsWidget` component to point directly to `/t/${slug}/dashboard/official?tab=announcements`.
- **Pros**: Zero new routes, simple maintenance, follows user's explicit request.
- **Cons**: Does not handle legacy or bookmarked links to `/dashboard/announcements`.
- **Effort**: XS (1-2 lines of code change)

### Option 2: Route Redirect
Create a redirect page at `app/t/[slug]/dashboard/announcements/page.tsx` that uses `redirect()` to send users to the Official page tab.
- **Pros**: Fixes the 404 for any existing links or bookmarks.
- **Cons**: Adds a small amount of "redirect" latency and a new file to maintain.
- **Effort**: S (1 new page file)

## Recommendation
I recommend **Option 1: Direct Link Update** (as per user preference, skipping backward compatibility).
We will update the `AnnouncementsWidget` component to point directly to the correct "Official" page tab.

## Metadata
- **Priority**: P1 (Fixes a 404/broken link in the primary dashboard)
- **Size**: XS
- **Horizon**: Q1 26

## Project Phases
- [x] **Phase 3: Recommendation** (Done)
    - [x] Review Technical Options
    - [x] Recommendation
    - [x] Metadata (Priority, Size, Horizon)
    - [x] Handoff
- [x] **Phase 4: User Review** (Done)
- [ ] **Phase 5: Execution** (InProgress)
    - [ ] Update Existing Issue (#141)
    - [ ] Link to Artifact

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue Details**: Issue #141 identifies a 404 error when clicking "View Archive" or "View All" in the `AnnouncementsWidget`.
- **Impact Map**:
    - `components/dashboard/announcements-widget.tsx`: Contains the hardcoded broken links.
    - `app/t/[slug]/dashboard/official/page.tsx`: The correct destination page that handles the `tab=announcements` parameter.
- **Historical Context**:
    - The `AnnouncementsWidget` was implemented on 2026-02-27 with the initial broken link.
    - The `OfficialPage` (the correct destination) was implemented on 2026-03-04, which explains why the widget link was "ahead" of the actual page structure.

### Phase 1: Vibe & Security Audit
- **Vibe Check**: 
    - **Backend-First**: The fix involves updating a client-side link to an existing server-side protected route. No new client-side data fetching or logic is introduced.
    - **Zero Policy RLS**: No database schema changes or RLS policy updates are required for this fix.
- **Attack Surface**:
    - The destination route `/t/[slug]/dashboard/official` is already secured via `middleware.ts` and server-side authentication checks in the page component.
    - Updating the link does not expose any new endpoints or sensitive data.

🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Invalid Tenant Slug**: If the slug is tampered with in the URL, the system already redirects to the backoffice login.
    - **Session Expiry**: Clicking the link with an expired session will trigger the authentication guard in `OfficialPage`, redirecting to the login page.
    - **Feature Disabled**: If `announcements_enabled` is false for the tenant, the `OfficialPage` handles this by fetching an empty list, and the UI should reflect the disabled state (though the widget itself should ideally be hidden).
- **Test Plan**:
    - **Manual/E2E Verification**:
        1. Login as a resident.
        2. On the dashboard, locate the "Latest Updates" widget.
        3. Click "View All" or "View Archive".
        4. Confirm the browser URL matches `/t/[slug]/dashboard/official?tab=announcements`.
        5. Confirm the "Announcements" tab is active and displaying content.
    - **Unit Test**: Update/Add a test case for `AnnouncementsWidget` to assert that the `Link` components use the correct `href` prop.

🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...

### Phase 3: Performance Review
- **Schema Static Analysis**:
    - The `announcements` table and associated `announcement_reads` and `announcement_neighborhoods` tables have appropriate indexes for `tenant_id` and relationship IDs.
    - Data fetching in `getAnnouncements` (server action) uses `tenant_id` and `status` filters which are performant.
- **Query Impact**:
    - The fix only changes the destination URL on the client side. It does not introduce any new queries or modify existing server actions.
    - The `OfficialPage` handles tab switching efficiently by passing the `defaultTab` prop to `OfficialTabs`.

🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...

### Phase 4: Documentation Logic
- **User Manuals**:
    - **Resident Guide**: Audit reveals that `docs/01-manuals/resident-guide/` is currently empty. A new section for "Community Dashboard & Announcements" is required to document the official page tabs and archive flow.
- **Technical Documentation**:
    - **Schema & Policies**: **CRITICAL GAPS**. `docs/02-technical/schema/tables/announcements.md` and `docs/02-technical/schema/policies/announcements.md` are missing. 
    - **Action**: Create these files to document the `announcements`, `announcement_reads`, and `announcement_neighborhoods` tables and their RLS policies in plain English.
- **Analytics & API**: No changes required as the fix is purely navigational.
- **Flows**: No update needed for existing `exchange-transactions.md`.

🔁 [PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...
