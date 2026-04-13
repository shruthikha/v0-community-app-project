source: requirement
imported_date: 2026-04-08
---
# Requirements: Service/Food Inventory & Cancellation Logic

> **Status**: Draft
> **Created**: 2026-02-14
> **Finding**: From #82

## 1. Problem Statement
The current system logic for `requiresReturn: false` items is too broad. It assumes that *all* non-returnable items (Services, Food) should have their inventory restored upon completion.
*   **Bug**: For **Food & Produce** (consumables), this is incorrect. If a user gives away "Sourdough Starter", completing the transaction restores the quantity, effectively "duplicating" the item.
*   **Ambiguity**: For **Services**, "restoring" inventory implies a reusable slot (capacity), which is acceptable but not explicitly defined.
*   **Documentation Gap**: `docs/02-technical/flows/exchange-transactions.md` does not explain this behavior, nor does it clearly document the shared Cancellation flow.

## 2. User Persona
*   **Lender (Food)**: Expects that when they give away an item, it is gone from their inventory permanently.
*   **Lender (Service)**: Expects that when a service is completed, they *might* fail to get that time slot back (if it was time-bound) or *should* get it back (if it was capacity-bound). For now, preserving "Capacity" logic is providing the least disruption.
*   **Borrower**: Needs clear notifications when a request is cancelled or completed.

## 3. Context & Current Implementation
*   **File**: `app/actions/exchange-transactions.ts`
*   **Function**: `markItemPickedUp`
*   **Current Logic**:
    ```typescript
    if (!requiresReturn) {
      // ... set status to completed
      // ... restore listing quantity (ALWAYS)
    }
    ```

## 4. Scope & Goals
1.  **Code**: Refine `markItemPickedUp` to **prevent** inventory restoration for `Food & Produce` category.
2.  **Code**: Maintain inventory restoration for `Services & Skills` (maintain status quo for capacity models).
3.  **Docs**: Update `docs/02-technical/flows/exchange-transactions.md` to explicitly map these flows and the Cancellation triggers.

## 5. Dependencies
*   `actions/exchange-transactions.ts`
*   `actions/exchange-listings.ts`

🔁 [PHASE 1 COMPLETE] Handing off to Orchestrator...

## 6. Technical Options

### Option A: Specific "Consumable" Logic (Recommended)
Modify `markItemPickedUp` to distinguish between "Reusable Services" and "Consumable Goods".
*   **Logic**:
    *   If Category == "Food & Produce": **Do NOT restore inventory** (Item is gone).
    *   If Category == "Services & Skills": **Restore inventory** (Capacity is freed to maintain status quo).
*   **Pros**: Fixes the critical bug where giving away food restores it to stock.
*   **Cons**: Hardcoded category logic (brittle if category names change).
*   **Effort**: Small (Backend change in `actions/exchange-transactions.ts`).

### Option B: Document "Capacity" Semantics (Status Quo)
Keep the current code where *all* `requiresReturn: false` items restore inventory.
*   **Logic**: Treat `available_quantity` as "Active Concurrent Slots".
    *   For Food: "I can handle 5 pickups at once". Users must manually lower quantity if they run out.
*   **Pros**: No code change.
*   **Cons**: Confusing UX for Food/Giveaways. High risk of over-commitment.
*   **Effort**: None (Docs only).

### Option C: Strict Consumption for All Non-Returnables
Change logic so *no* `requiresReturn: false` items restore inventory.
*   **Logic**: If it doesn't come back, the inventory/slot is consumed forever.
*   **Pros**: Safest. Prevents over-commitment.
*   **Cons**: Breaks "Recurring Service" listings where quantity is used as "concurrent capacity".
*   **Effort**: Small.

🔁 [PHASE 2 COMPLETE] Handing off to Product Owner...

## 7. Recommendation

### Selected Option: Option A (Specific "Consumable" Logic)
We should distinguish between truly consumable items/food and reusable service slots. Giving away food should **permanently** consume inventory.

**Rationale**:
*   The current behavior (restoring inventory for Food) is a functional bug that risks over-commitment.
*   "Services" can remain as "capacity-based" (restoring) for now to minimize disruption, though strict consumption (Option C) is a valid future consideration.

### Implementation Details
*   Modify `markItemPickedUp` in `app/actions/exchange-transactions.ts`.
*   Add logic: `const isConsumable = categoryName === "Food & Produce"`.
*   If `isConsumable`: **Skip** the inventory restoration step.
*   If `!isConsumable` (Services): **Keep** the inventory restoration step.

### Metadata
*   **Priority**: P1
*   **Size**: S
*   **Horizon**: Q1 26



## 8. Technical Review

### Phase 0: Context Gathering
*   **Issue Details**: #112 focuses on refining inventory restoration logic for non-returnable items, specifically differentiating between consumables (Food) and re-usable slots (Services).
*   **Impact Map**:
    *   `app/actions/exchange-transactions.ts`: Contains `markItemPickedUp`, the core logic for completion and inventory restoration.
    *   `app/actions/exchange-listings.ts`: Likely contains helper functions or related listing logic.
    *   `docs/02-technical/flows/exchange-transactions.md`: Needs updates to reflect the branching logic.
    *   `db/schema.ts`: To be verified for category relationship.
*   **Historical Context**:
    *   `app/actions/exchange-transactions.ts` saw recent updates in mid-February related to admin features (#107) and RSVP UI (#105).
    *   The inventory logic for `requiresReturn: false` has been broad since inception, assuming restoration for all non-returnables.

🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...

### Phase 1: Vibe & Security Audit
*   **Vibe Check**: Backend-First architecture confirmed via `"use server"` actions. Supabase client is session-aware and respects RLS.
*   **Attack Surface**:
    *   **Inventory Race Condition**: `markItemPickedUp` performs a non-atomic `available_quantity` update. While sufficient for community scale, it remains a potential vector for inventory desync if multiple updates happen concurrently.
    *   **Fragility Vector**: The logic relies on exact string matches for `"Services & Skills"` and `"Food & Produce"`. Renaming these categories in the database will silently break inventory restoration logic.
    *   **Authorization**: Explicit checks are present to ensure only borrowers or lenders can trigger status changes.
*   **Independent Research**: Verified that `cancelTransaction` only restores inventory if the status is `confirmed` (pre-pickup), which is secure. No vectors identified for bypassing pickup constraints.

🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...

### Phase 2: Test Strategy
*   **Sad Paths**:
    *   **Category Casing**: Verify if logic is case-insensitive (e.g., "Food & produce" vs "Food & Produce").
    *   **Authorization Bypass**: Ensure a non-involved user cannot trigger the `markItemPickedUp` action.
    *   **Idempotency**: Verify behavior when `markItemPickedUp` is called multiple times on the same transaction.
    *   **Null Handling**: Ensure `expected_return_date` and other non-returnable specifics don't crash the logic when null.
*   **Test Plan**:
    *   **Unit Tests (Vitest)**: Create `app/actions/exchange-transactions.test.ts`. Mock Supabase to verify the branching logic in `markItemPickedUp`.
    *   **E2E Tests (Playwright)**: Add a smoke test to verify that completing a "Food" pickup does not increment the listing's `available_quantity`.
    *   **Manual Verification**: Perform a full end-to-end transaction with "Food" and verify listing quantity in the dashboard.

🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...

### Phase 3: Performance Review
*   **Static Analysis**:
    *   `exchange_transactions` and `exchange_listings` tables are well-indexed for status and relationship lookups (`tenant_id`, `listing_id`, `borrower_id`, `lender_id`).
    *   The join on `exchange_categories` in `markItemPickedUp` is efficient for single-record retrieval.
*   **N+1 Issues**: Not present in the primary completion flow. Data is fetched in a single query per completion.
*   **Bottlenecks**:
    *   The Fetch-then-Update pattern for `available_quantity` is not atomic and could lead to race conditions under high load.
    *   **Recommendation**: Transition to direct SQL updates (e.g., `available_quantity = available_quantity + ?`) to ensure atomicity/performance.

🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...

### Phase 4: Documentation Logic
*   **Gap Analysis**:
    *   `docs/02-technical/flows/exchange-transactions.md`: Step 3 ("Inventory Logic") currently incorrectly states that `available_quantity` is always restored on completion.
    *   **Architecture Mapping**: The State Machine diagram needs a clarifying note for "Non-Returnable" items where `picked_up` and `completed` are effectively atomic steps.
*   **Proposed Updates**:
    *   Redesign Section 3 (Inventory Logic) to include the "Consumable" distinction.
    *   Update Section 4 (Edge Cases) to explicitly document the shared Cancellation Flow for both Lender and Borrower.

🔁 [PHASE 4 COMPLETE] Handing off to Product Manager...

### Phase 5: Strategic Alignment & Decision
*   **Final Recommendation**:
    *   **Bifurcated Logic**: Implement the "Food & Produce" vs "Services & Skills" check as proposed in the Requirement doc.
    *   **Robustness Patch**: While string matching is acceptable for the immediate fix, a migration to add `is_consumable` (boolean) to the `exchange_categories` table is recommended for long-term stability.
    *   **Atomic Updates**: Use direct Postgres increments/decrements for `available_quantity` to avoid race conditions.
*   **Approval Status**: Ready for development.

🏁 [REVIEW COMPLETE] Issue #112 is now **Ready for Development**.
