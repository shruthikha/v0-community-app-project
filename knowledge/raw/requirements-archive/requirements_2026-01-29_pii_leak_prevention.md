source: requirement
imported_date: 2026-04-08
---
# Requirements: PII Leak Prevention in Neighbors Page

## Problem Statement
The current implementation of the Neighbors Directory (`app/t/[slug]/dashboard/neighbours/page.tsx`) fetches **all** resident data fields—including sensitive PII like emails, phone numbers, and exact birthdays—and passes this raw data to the Client Component (`NeighboursPageClient`).

Privacy filtering is currently performed **Client-Side** in `ResidentCard.tsx` using `filterPrivateData`. This violates "Backend-First" security principles because the sensitive data is still present in the React Server Component (RSC) payload. A malicious actor (or curious user) can inspect the network traffic or React DevTools to view "hidden" contact details of neighbors who have not consented to share them.

## User Persona
- **Residents**: Expect their privacy settings (e.g., "Hide Email") to be respected at the data transport level, not just visually.
- **Security Auditor**: Expects strict adherence to "Zero Trust" and "Backend-First" data handling.

## Scope & Context
- **Target Component**: `app/t/[slug]/dashboard/neighbours/page.tsx` (Server) and `NeighboursPageClient` (Client).
- **Goal**: Move privacy logic to the Server. The client should **never** receive data that the current user is not authorized to see.
- **Out of Scope**: Changing the database schema (unless strictly necessary) or redesigning the UI.

## Dependencies
- `app/t/[slug]/dashboard/neighbours/page.tsx`: The data fetcher.
- `app/t/[slug]/dashboard/neighbours/neighbours-page-client.tsx`: The data consumer.
- `lib/privacy-utils.ts`: The existing (likely client-side safe) filtering logic.

## Documentation Gaps
- **Security Policy**: No documentation exists defining "Backend-First" privacy standards for this project.
- **API/Page Payload Docs**: No documentation exists for the expected payload of the Neighbors page.

## Issue Context
- Identified during the review of [Issue #75](https://github.com/mjcr88/v0-community-app-project/issues/75).
- Classified as a **Critical Security Vulnerability**.

## Technical Options

### Option 1: Inline Server-Side Transformation (Recommended)
In `app/t/[slug]/dashboard/neighbours/page.tsx`, import `applyPrivacyFilter` from `lib/privacy-utils.ts`. Iterate over the fetched `residents` array and transform each user **before** passing it to the `NeighboursPageClient`.
- **Pros**: Immediate fix, reuses existing logic, low risk, zero schema changes.
- **Cons**: Logic lives in the page component (slightly dirty).
- **Effort**: XS

### Option 2: Dedicated Data Access Layer (DAL)
Create a new function `getSafeResidents(tenantId, viewerId)` in `app/actions/residents.ts`. This function performs the DB select and applies the privacy filter internally. `page.tsx` calls this action instead of raw Supabase queries.
- **Pros**: Clean separation of concerns, reusable elsewhere.
- **Cons**: Requires moving the specific query logic out of the page.
- **Effort**: S

### Option 3: PostgreSQL View with RLS
Create a database view that conditionally nulls out columns based on the viewer's relation to the user.
- **Pros**: "Zero Trust" at the database level.
- **Cons**: Extremely complex RLS policies needed to handle "Family Member" exceptions (Supabase RLS is row-based, column-masking is hard).
- **Effort**: XL

## Recommendation

**Recommendation**: **Option 1 (Inline Server-Side Transformation)**.
Given the critical nature of the leak, an immediate, robust fix using the already-tested `applyPrivacyFilter` logic is preferred. We can refactor to Option 2 later as part of a larger architecture cleanup.

### Metadata
- **Priority**: P0 (Critical)
- **Size**: XS
- **Horizon**: Q1 26

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue**: [Brainstorm] PII Leak Prevention (Item 153123500)
- **Status**: Draft
- **Impact Map**:
    - : Server Component (Fetcher)
    - : Client Component (Consumer)
    - : Shared Logic
- **Historical Context**:
    - Files are stable. Last relevant touches in Jan 2026 related to UI/Reliability fixes.
    - No active recent churn on .

### Phase 1: Security Audit
- **Vibe Check**: **FAILED**. Current implementation violates "Backend-First" principle.  fetches logic-blind data.
- **Attack Surface**: Authenticated users can hydrate the React state to extract emails/phones of neighbors who have opted out.
- **Action**: Must implement strict filtering in  before passing props.

### Phase 2: Test Strategy
- **Sad Paths**:
    - Neighbor viewing profile of user with `show_email: false`.
    - Failed relationship check (non-family member trying to view family-only data).
- **Test Plan**:
    - **Unit**: Create `lib/privacy-utils.test.ts` (Vitest) to cover all permutations of `applyPrivacyFilter`.
    - **Integration**: Manual verification via Network Tab inspection to ensure fields are `null` in the payload.

### Phase 3: Performance Assessment
- **Schema**: `users` table query is indexed by `tenant_id` (implied).
- **Live Introspection**: Query loads ALL residents for the tenant.
- **Risk**: Potential N+1 if `family_units` join grows, but acceptable for current Alpha limits (<100 users/tenant).
- **Rec**: Proceed with Option 1 (fix). Pagination can be added later.

### Phase 4: Documentation Logic
- **Manuals**: Update `resident-guide` to clarify that "Hide My Email" now strictly removes data from the server response, so it may not even be searchable by neighbors.
- **Gaps**:
    - Missing "Backend-First" Privacy Policy documentation in `docs/02-technical/architecture/security.md` (or similar).
    - Missing payload specification for `neighbours/page.tsx`.
- **Action**: Log gaps to `docs/documentation_gaps.md`.
