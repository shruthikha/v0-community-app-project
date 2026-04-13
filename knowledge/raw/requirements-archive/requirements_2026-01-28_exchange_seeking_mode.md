source: requirement
imported_date: 2026-04-08
---
# Requirements: Exchange "Searching For" Mode

> **Date**: 2026-01-28
> **Topic**: Exchange "Searching For" Mode

## Problem Statement
Currently, the Exchange feature is designed exclusively for "Offerings" (giving away items, selling, or lending). Residents who need help or are looking for specific items have no dedicated way to signal this demand. They are forced to misuse the "Offering" listings or post elsewhere, leading to confusion and poor discoverability for requests.

## User Persona
- **Resident Requester**: Needs a specific item (e.g., a ladder, sugar) or help (e.g., someone to water plants) and wants to broadcast this need to the community.
- **Resident Provider**: Has items or time and might be willing to help if they knew someone needed it, but isn't actively creating "Offer" listings.

## Context
The current `exchange_listings` table and UI are optimized for:
- Title/Description
- Category (Giveaway, Lending, etc.)
- Images
- "I want this" CTA

We need to introduce a "Seeking" mode that flips this relationship:
- "I need this" instead of "I have this"
- "I can help you" instead of "I want this" as the CTA.

## Dependencies
- `exchange` feature flag (already active)
- `exchange_listings` table (needs schema update)
- UI components for Listing Cards (need visual differentiation)
- `exchange_transactions` (transaction flow might need adaptation)

## Issue Context
- **Gap**: Missing documentation for `exchange` module schema and flows in `docs/02-technical`.
- **Gap**: Missing user guide section for "Requesting Items" in `docs/01-manuals/resident-guide`.

## User Story
**As a** Resident,
**I want to** create a "Seeking" listing,
**So that** I can ask my neighbors for items or help I need.

**As a** Resident,
**I want to** filter the Exchange feed to see "Seeking" requests,
**So that** I can see if I can help anyone in my community.

## Technical Options

### Option 1: Single Table with Type Discriminator (Recommended)
Add a `listing_type` column (`offer`, `request`) to the existing `exchange_listings` table. Reuse `price` as `budget` for requests.
*   **Pros**:
    *   Minimal schema change (one column).
    *   Unified data model simplifies "My Listings" and admin views.
    *   Easier to aggregate all activity for broad queries.
*   **Cons**:
    *   Overloading columns (`price` vs `budget`) can be confusing in code if not strictly typed.
    *   Some fields (like `images`) might be required for Offers but optional for Requests.
*   **Effort**: Low (Schema: 1 migration, UI: Filter logic & Label adaptions).

### Option 2: Separate "Requests" Table
Create a new `exchange_requests` table specifically for this purpose.
*   **Pros**:
    *   Clean separation of concerns.
    *   Can have request-specific fields (e.g., `urgency`, `expiration_date`) without polluting the listings table.
*   **Cons**:
    *   Higher effort: New API endpoints, RLS policies, and admin UI components.
    *   "My Exchange" UI needs to fetch from two sources.
*   **Effort**: Medium-High (New table, RLS, APIs, Frontend types).

### Option 3: "Wishlist" Feature (Lightweight)
Instead of full listings, add a simple "Wishlist" on the user profile or a "Requests" board that is text-only (no categories, no images).
*   **Pros**:
    *   Very fast to implement.
    *   Distinct from the "Marketplace" feel of the Exchange.
*   **Cons**:
    *   Low discoverability (buried in profiles or a side board).
    *   Less functionality (no category filtering, no location context).
*   **Effort**: Low-Medium (New lightweight table, new UI view).

## Recommendation

**We recommend proceeding with Option 1 (Single Table with Type Discriminator).**

This approach provides the most integrated user experience. Residents can seamlessly switch between "Offering" and "Seeking" within the same Exchange interface. It leverages existing categories (e.g., "Seeking > Tools") and location logic without requiring significant new infrastructure.

### Classification
- **Priority**: P1 (High Impact - fills a major functional gap)
- **Size**: S (Small - Schema update + UI modifiers)
- **Horizon**: Q1 26 (Immediate roadmap)

## 8. Technical Review

### 8.0 Phase 0: Context & History
- **Issue**: [feat: Exchange Seeking Mode #73](https://github.com/mjcr88/v0-community-app-project/issues/73)
- **Goal**: Add "Seeking" mode to Exchange.
- **Impact Map**:
    - **Database**: `exchange_listings` (New `type` column). *Note: `listing_type` in issue body, but `type` used in code types.*
    - **Logic**: `lib/data/exchange.ts`, `app/actions/exchange-listings.ts`.
    - **UI**: `components/exchange/` (Listing Cards, Feed).
- **Historical Context**:
    - Recent activity in `exchange` module focuses on Alpha Cohort reliability (e.g., commit `42f7d362`).
    - Schema managed via SQL scripts in `scripts/exchange/`.
    - `lib/data/exchange.ts` already has `type` in TypeScript interfaces, but current code (line 153) explicitly notes the column is missing in DB.

### 8.1 Phase 1: Security Audit
- **Vibe**: Code uses `createServerClient` properly (Backend-First). Validation exists for title, category, and price (Min > 0).
- **Attack Surface**:
    - `exchange_listings` is protected by RLS (`08_create_exchange_rls_policies.sql`).
    - **Verified**: Existing policies for `SELECT` and `INSERT` are safe for "Seeking" mode as long as requests follow the standard `status` lifecycle.
    - **Logic Gap**: `createBorrowRequest` in `app/actions/exchange-listings.ts` (line 665) currently assumes all listings are "Offers". If a listing is a "Request", the action should logically be "Offer help/item" rather than "Borrow".
    - **Risk**: Reuse of `price` column as `budget` for requests. Ensure validation prevents null or negative values if a budget is expected.

### 8.2 Phase 2: Test Strategy
- **Sad Paths**:
    - **Negative Budget**: User enters -100 for "Budget/Price" in a Request.
    - **Logic Mismatch**: User tries to "Borrow" a "Request" listing (Action should be blocked or redirected to "Offer Help").
    - **Missing Type**: Action defaults to "Offer" or errors if `type` is missing.
    - **Category Mismatch**: Ensuring category constraints apply correctly to requests (e.g., requesting an item in a non-item category if enforced).
- **Test Plan**:
    - **Unit (Vitest)**:
        - Create `app/actions/exchange-listings.test.ts` (none exist currently for this module).
        - Test `createExchangeListing` with `type='request'` and `type='offer'`.
        - Test `getExchangeListings` with `type` filter once the column is added.
    - **E2E (Playwright)**:
        - Extend `e2e/exchange.spec.ts` (verify if exists, or create new) to cover the "Create Seeking Listing" flow.
        - Verify "Seeking" badges/labels are visible in the feed.
        - Test "Looking For" filter toggle on the main exchange page.

### 8.3 Phase 3: Performance Review
- **Schema Analysis**:
    - **Existing**: `exchange_listings` has indexes on `tenant_id`, `status`, and `category_id`.
    - **N+1 Risk**: Low. Most fetches use `lib/data/exchange.ts` which uses `supabase-js` queries.
    - **Optimization**: Filtering by `type` in the feed (which is the main use case) will be most efficient if we add a composite index.
- **Recommendations**:
    - **NEW INDEX**: `CREATE INDEX idx_exchange_listings_feed ON public.exchange_listings (tenant_id, status, type) WHERE status = 'published' AND cancelled_at IS NULL;`
    - **CONSTRAINT**: Add `CHECK (type IN ('offer', 'request'))` to prevent invalid data ingestion.
    - **Migration**: Schema change must be performed during a low-traffic window if the table is very large (unlikely given community app scale).

### 8.4 Phase 4: Documentation Plan
- **Technical Flows**:
    - **`docs/02-technical/flows/exchange-transactions.md`**: Update state machine to handle Request → Offer Help flow. Update inventory logic section to clarify that "Requests" don't decrement global inventory but might create "reservations" of a different kind.
- **User Manuals**:
    - **`docs/01-manuals/resident-guide`**: Update with "Creating a Request" section. Explain how to use the "I'm looking for..." toggle.
- **API Docs**:
    - Add documentation for `listing_type` (recommended name: `type`) column in the exchange schema documentation (which is currently noted as missing).
- **Schema**:
    - `docs/02-technical/schema/tables/exchange_listings.md` does not exist! **GAP**. Needs creation.
- **Action**: Logged to `docs/documentation_gaps.md`.

#
---

## Review Handoff Log

### 2026-02-14: Phase 0 Context Gathering (Product Manager/Explorer/Archaeologist)
- **Status**: Complete
### 2026-02-14: Phase 1 Security Audit (Security Auditor)
- **Status**: Complete
- **Findings**:
    - RLS is compatible; access is correctly scoped to tenant and user.
    - **Identification**: `createBorrowRequest` needs adaptation or a mirrored `createOfferHelp` action for 'request' types.
    - **Constraint**: `listing_type` column name should be finalized (issue says `listing_type`, code types say `type`). Recommended: use `type` as it's already in the codebase's interfaces.
### 2026-02-14: Phase 2 Test Strategy (Test Engineer)
- **Status**: Complete
- **Findings**:
    - Corrected "Sad Paths" to include the logic mismatch (Borrowing a Request).
    - Identified that `exchange-listings.test.ts` is missing and must be created.
    - E2E should focus on the "Looking For" badge and filter toggle.
### 2026-02-14: Phase 3 Performance Assessment (Performance Optimizer)
- **Status**: Complete
- **Findings**:
    - Table currently lacks a composite index for the common feed query.
    - Recommended a partial composite index to target published listings.
    - Added data integrity recommendation (check constraint).
- **Handoff**: 🔁 [PHASE 3 COMPLETE] Handing off to Documentation Specialist...
### 2026-02-14: Phase 4 Documentation Logic (Documentation Specialist)
- **Status**: Complete
- **Findings**:
    - Confirmed existing gaps in `docs/documentation_gaps.md` cover this feature.
    - Identified specific updates for `exchange-transactions.md` state machine.
    - Verified no conflicting ADRs in `docs/06-decisions/`.
- **Handoff**: 🔁 [PHASE 4 COMPLETE] Handing off to Strategic Architect...
