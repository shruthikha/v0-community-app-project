source: requirement
imported_date: 2026-04-08
---
# Requirement: Remove 'Test' Event Category

## Problem Statement
The event creation form currently displays a "Test" category with a Green Checkmark (✅) icon in the category dropdown. This category is intended for testing purposes and should not be visible to end users in the production-like environment.

## User Persona
- **Residents**: Creating events for their community and should only see valid event categories.
- **Administrators**: Managing the platform and wanting a professional appearance for all community-facing forms.

## Context
The categories for events are fetched from the `event_categories` table in Supabase. The "Test" category is a specific row in this table associated with the tenant.

**Location of Fetching Logic**: `app/t/[slug]/dashboard/events/(management)/create/page.tsx`
**Category Components**: `app/t/[slug]/dashboard/events/(management)/create/event-form.tsx`

## Dependencies
- **Issue #139**: Get rid of test icon in event creation form.
- **Database**: `event_categories` table contains the source data.

## Requirements
1.  **Remove from UI**: The "Test" category must be hidden from the category selection dropdown in the event creation form.
2.  **Data Integrity**: Determine if the category should be deleted from the database or just filtered out in the application logic.

## Documentation Gaps
- None identified. Existing fetching logic is clear.

🔁 [PHASE 1 COMPLETE] Handing off to Orchestrator...

## Technical Options

### Option 1: Frontend Filtering
Filter the categories in `app/t/[slug]/dashboard/events/(management)/create/page.tsx` before passing them to the `EventForm` component.
- **Pros**: Quick to implement, zero risk of data loss.
- **Cons**: Sub-optimal as the data still travels over the wire.
- **Effort**: XS

### Option 2: Database Query Filtering
Update the SQL query in `app/t/[slug]/dashboard/events/(management)/create/page.tsx` to exclude categories where `name` is 'Test'.
- **Pros**: Cleaner data flow, keeps the application logic simple.
- **Cons**: Hardcoded string filter in the query.
- **Effort**: XS

### Option 3: Database Deletion (Recommended)
Delete the "Test" category row from the `event_categories` table using a SQL migration or direct command.
- **Pros**: Truly "gets rid of" the test icon at the source. Prevents it from appearing in other parts of the app (e.g., event listings, search).
- **Cons**: Irreversible (unless backed up), but "Test" data is usually safe to delete.
- **Effort**: S

## Recommendation
**Option 3: Database Deletion** is recommended. The "Test" category is clearly a leftover from development/initial setup and serves no functional purpose for community members. Removing it at the database level is the most robust solution and prevents it from appearing in any future features or components that fetch the full list of categories.

## Metadata
- **Priority**: P1
- **Size**: XS
- **Horizon**: Q1 26

## 8. Technical Review

### Phase 0: Issue Details
- **Issue**: #139 "Get rid of test icon in event creation form"
- **Requirement**: Remove the "Test" category (with ✅ icon) from the event creation form.
- **Source**: `event_categories` table.
- **Recommendation from Brainstorming**: Delete the row from the database (Option 3).

### Phase 0: Impact Map
- **Database**: `event_categories` table.
- **Frontend (Fetching)**: `app/t/[slug]/dashboard/events/(management)/create/page.tsx`
- **Frontend (UI)**: `app/t/[slug]/dashboard/events/(management)/create/event-form.tsx`
- **Seeding/Scripts**: 
    - `scripts/events/11_seed_event_categories.sql`
    - `scripts/events/11_seed_default_categories.sql`
    - `app/api/seed-event-categories/route.ts`

### Phase 0: Historical Context
- **Recent Changes**: Files were recently updated in Sprint 4/5 (Issue #111, #99).
- **Regression Risk**: Removing a category might affect events already associated with it (though "Test" should not have production events).

### Phase 1: Security Audit
- **Vibe Check**: "Backend-First" principle followed. Deleting from the database is the most robust solution.
- **RLS Policies**: `event_categories` table has RLS. `SELECT` is open to authenticated residents, but `DELETE` is restricted to `is_tenant_admin`.
- **Foreign Key Safety**: The `events` table references `event_categories(id)` with `ON DELETE SET NULL`. Deleting the "Test" category will safely nullify the `category_id` for any associated events, avoiding schema breakage.
- **Seeding Vector**: Identified that `scripts/events/11_seed_event_categories.sql` and `scripts/events/11_seed_default_categories.sql` likely contain the "Test" row. These must be updated to prevent re-introduction during environment resets.

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Offline/Network Error**: Verify that the UI handles a failure to fetch categories gracefully.
    - **Existing Events**: Verify that events previously tagged as "Test" still display correctly (without a category badge).
- **Test Plan**:
    - **Unit Tests**: Verify `ON DELETE SET NULL` behavior in Supabase.
    - **E2E Tests**: Login as a resident, navigate to `/events/create`, and assert that "Test" is NOT in the dropdown while other categories are.

### Phase 3: Performance Review
- **Query Impact**: Negligible. Deleting a single row from a small lookup table like `event_categories` has no performance penalty.
- **Index Usage**: The `idx_events_category_id` index on the `events` table ensures that the foreign key constraint cleanup is efficient.### Phase 4: Documentation Plan
- **User Documentation**: No updates required for `resident-guide` or `admin-guide` as this is a minor UI cleanup.
- **Schema Documentation**: Identified a gap in `docs/02-technical/schema/` regarding the `event_categories` table and its RLS policies.
- **Gap Logging**: Logged missing `policies/event_categories.md` to `docs/documentation_gaps.md`.
