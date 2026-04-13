source: requirement
imported_date: 2026-04-08
---
# Requirements: Exchange Listings Constraint Mismatch Fix

## Problem Statement
Users are encountering a "check constraint violation" error when attempting to edit exchange listings. This is caused by a discrepancy between the TypeScript definitions (application layer) and the PostgreSQL check constraints (database layer) for `condition` and `pricing_type`. The application allows values that the database rejects.

## User Story
As a **User**, I want to be able to edit my exchange listing's details (like title or description) without receiving an error, even if I have selected a status or condition that is valid in the UI.
As a **Developer**, I want the database constraints to match the application's type definitions to prevent runtime errors.

## Context
### Mismatch Analysis

**1. Condition (`condition`)**
*   **TypeScript (`ExchangeCondition`)**:
    *   `new`, `like_new`, `good`, `fair`, `poor`, `slightly_used`, `used`, `slightly_damaged`, `maintenance`
*   **Database (`exchange_listings_condition_check`)**:
    *   `new`, `slightly_used`, `used`, `slightly_damaged`, `maintenance`
*   **Gap**: `like_new`, `good`, `fair`, `poor` are missing from the DB.

**2. Pricing Type (`pricing_type`)**
*   **TypeScript (`ExchangePricingType`)**:
    *   `free`, `fixed_price`, `pay_what_you_want`, `negotiable`
*   **Database (`exchange_listings_pricing_type_check`)**:
    *   `free`, `fixed_price`, `pay_what_you_want`
*   **Gap**: `negotiable` is missing from the DB.

## Dependencies
*   **Files**:
    *   `types/exchange.ts`
    *   `scripts/exchange/03_create_exchange_listings.sql`
*   **Issues**: None found.

## Documentation Gaps
*   No explicit documentation on why these values differ. Assumed intended feature expansion in TS that wasn't migrated to DB.

## Issue Context
*   **Reported Error**: "new row for relation exchange_listings violates check constraint".
*   **Trigger**: Editing a listing name (likely submitting full form data including the invalid enum value).

## Technical Options

### Option 1: Align Database with Application (Recommended)
Create a migration to update the check constraints in `exchange_listings` to include all values defined in the TypeScript types.
*   **Pros**:
    *   Fixes the error immediately.
    *   Enables the full set of conditions and pricing types intended by the application.
    *   Prevents data loss or regression.
*   **Cons**:
    *   Requires a database migration.
*   **Effort**: Low (SQL script creation).

### Option 2: Restrict Application to Match Database
Update `types/exchange.ts` to remove the extra values and update all UI components to use the restricted set.
*   **Pros**:
    *   Strict adherence to the original schema design.
*   **Cons**:
    *   Regresses on features (removes "Good", "Like New", "Negotiable").
    *   May break UI for existing listings that somehow managed to use these values (unlikely given constraint, but possible if inserted via other means).
    *   Higher effort to chase down UI usages.
*   **Effort**: Medium.


## Recommendation

**Select Option 1: Align Database with Application**.
The TypeScript types reflect the extensive product requirements for item conditions and pricing customization. The database constraints are lagging behind the application code. Updating the constraints is the correct fix to enable the intended features and resolve the error.

### Classification
*   **Priority**: P1 (High - Blocks user modification of data)
*   **Size**: XS (Small - Single migration script)
*   **Horizon**: Q1 26 (Immediate fix)
## 8. Technical Review

### Phase 0: Issue Details
- **Issue**: #113 "[Brainstorm] Restrict Exchange Listing Types to Match Database"
- **Problem**: TypeScript types `ExchangeCondition` and `ExchangePricingType` allow values that violate DB check constraints in `exchange_listings`.
- **Target Files**: `types/exchange.ts`, `app/actions/exchange-listings.ts`, `components/exchange/*`
- **Goal**: Transition from "Align Database with Application" (original recommendation) to "Restrict Application to Match Database" (per user confirmation in issue #113).

### Phase 0: Impact Map
- **Schema**: `scripts/exchange/03_create_exchange_listings.sql` (Line 17, 21) confirms strict check constraints.
- **Types**: `types/exchange.ts` defines the enums.
- **Form UI**: `create-exchange-listing-modal.tsx`, `edit-exchange-listing-modal.tsx`, and `step-3-pricing-visibility.tsx` use these types for dropdowns.
- **Logic**: `app/actions/exchange-listings.ts` handles the validation and insertion.

### Phase 0: Historical Context
- The database schema was created with strict enums (`new`, `slightly_used`, etc.) while TypeScript was likely expanded later without corresponding SQL migrations, leading to the current mismatch.
- Recent changes in `types/exchange.ts` (Commit `5790de6`) suggest ongoing refinement of exchange entities.

### Phase 1: Security Audit
- **Vibe Check**:
    - **Backend-First**: The fix correctly shifts validation responsibility to the application layer to match its source of truth (the DB).
    - **RLS Consistency**: Verified that `updateExchangeListing` performs ownership checks (`listing.created_by === user.id`) before execution.
- **Attack Surface**:
    - **Validation Bypass**: Currently, the UI/TS layer "bypasses" the DB constraints by allowing broader options, leading to constraint violation errors. Narrowing the types closes this gap.
    - **Legacy Data**: Since the DB constraints already exist, there is zero risk of existing rows containing "invalid" values that would break the narrowed types during fetching.
    - **Error Handling**: The current "Check constraint violation" is a brute-force rejection. Narrowing enums provides a cleaner failure mode at the validation layer before hitting the DB.

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Stale Frontend Submission**: A user with an open tab (before deployment) tries to submit a listing with `negotiable` pricing or `like_new` condition. The server action must catch this or the DB will reject it.
    - **API Direct Manipulation**: An actor tries to send prohibited enum values directly to server actions.
- **Test Plan**:
    - **Integration (Manual/Action)**:
        - Call `createExchangeListing` server action with illegal enum values (e.g., `condition: 'like_new'`) and verify the DB/Server rejection.
    - **Manual UI Verification**:
        - Open `CreateExchangeListingModal`.
        - Verify "Condition" dropdown excludes: `Like New`, `Good`, `Fair`, `Poor`.
        - Verify "Pricing" dropdown excludes: `Negotiable`.
        - Repeat for `EditExchangeListingModal`.
    - **E2E Smoke**:
        - Create a "New" item with "Fixed Price" and verify successful publication and display in the exchange directory.

### Phase 3: Performance Review
- **Query Analysis**:
    - `lib/data/exchange.ts` uses the `supabase` client for data retrieval.
    - The `SELECT` logic is static and unaffected by enum narrowing.
    - No changes to `JOIN` or `WHERE` clauses are anticipated.
- **Schema & Indexing**:
    - Existing indexes on `exchange_listings(tenant_id)`, `exchange_listings(created_by)`, and `exchange_listings(status)` fully cover existing and proposed query patterns.
    - DB-level `CHECK` constraints are already in place; narrowing the application-level enums ensures failure happens earlier (or at least more predictably) without additional DB load.
- **Resource Usage**:
    - Zero change in memory or compute footprint.

### Phase 5: Strategic Alignment & Decision
- **Product Alignment**:
    - Confirmed with user in Issue #113: The strict DB schema is the single source of truth. Application layer must be narrowed.
    - Resolves recurring "Check constraint violation" errors during listing edits.
- **Sizing**: **XS** (Small).
    - Modification to `types/exchange.ts` (1-2 files).
    - Updates to `create-exchange-listing-modal.tsx`, `edit-exchange-listing-modal.tsx`, and `step-3-pricing-visibility.tsx`.
- **Decision**: **Prioritize (Ready for Development)**.

---

## 9. Definition of Done (DoD)
- [ ] `ExchangeCondition` in `types/exchange.ts` narrowed to: `new`, `slightly_used`, `used`, `slightly_damaged`, `maintenance`.
- [ ] `ExchangePricingType` in `types/exchange.ts` narrowed to: `free`, `fixed_price`, `pay_what_you_want`.
- [ ] All UI dropdowns in `create-exchange-listing-modal.tsx` and `edit-exchange-listing-modal.tsx` strictly match the narrowed types.
- [ ] Server actions in `app/actions/exchange-listings.ts` successfully process edits with narrowed types.
- [ ] No "check constraint violation" errors encountered during manual smoke test of listing edits.
- [ ] Documentation gaps logged in `docs/documentation_gaps.md`.

✅ [REVIEW COMPLETE] Issue #113 is now Ready for Development.
