source: requirement
imported_date: 2026-04-08
---
# Requirements: Admin Family Selection Improvement

## Goal Description
Admins currently face friction when creating residents because the system suggests creating a new family even if one already exists on a lot. This change streamlines the flow by automatically selecting the existing family while still allowing for manual overrides with mandatory confirmation.

## User Persona
- **Admin**: Needs to quickly add residents to the correct families without accidental duplication or unnecessary data entry.

## Context
- **Lot-Family Relationship**: Currently 1:1 (no multi-family support per lot).
- **Current Issue**: The UI defaults to "Create New Family" even when a family is linked to the selected lot.

## Requirements
1. **Automatic Selection**: When an admin selects a lot in the resident creation flow, the system must check if a family is already associated with that lot. If so, that family should be automatically selected.
2. **Override Mechanism**: If the admin chooses to "Create New Family" manually for a lot that already has one, they must be prompted with a confirmation dialog.
3. **Multi-family Constraint**: For the initial version, the system will maintain the 1:1 lot-to-family constraint in the UI logic.

## Dependencies
- `families` table schema (relation to `lots`).
- Admin Resident Creation UI component.

## Technical Options

### Option 1: Client-Side State Management (React-First)
Handle the selection logic entirely within the React form component. When a lot is selected, fetch the associated family (via a hook or cached data) and update the form state.
- **Pros**: Immediate UI response, low backend impact, simple implementation.
- **Cons**: Potential data staleness if lot-family relationships change frequently, logic is tied to a specific UI component.
- **Effort**: Small (S)

### Option 2: API-Driven Selection (Server-First)
Update the lot selection API endpoint to return the associated family ID in the response. The frontend automatically populates the family field based on this API response.
- **Pros**: Source of truth is centralized in the API, more robust against data changes, reusable by other clients.
- **Cons**: Requires modification of existing API endpoints, slightly more latency as it waits for API response.
- **Effort**: Medium (M)

### Option 3: Form Controller with Interceptors (Hook-based)
Create a custom React Hook or Form Controller that intercepts the "lot_id" change event. This controller manages the dependency between lot and family, including the override confirmation logic.
- **Pros**: Cleanest separation of concerns, high reusability for other admin forms, centralizes the "override" logic.
- **Cons**: Slightly higher complexity in state orchestration, abstract implementation.
- **Effort**: Medium (M)

## Recommendation
I recommend **Option 3: Form Controller with Interceptors (Hook-based)**. While it has slightly higher initial effort (M), it provides the most maintainable and stable architecture. By centralizing the selection and override logic in a reusable hook, we ensure that as the admin dashboard evolves, this logic remains consistent across different forms or views. It also makes the code easier to test in isolation without relying on the full form UI.

### Metadata
- **Priority**: P1 (High Impact for Admin Experience)
- **Size**: M
- **Horizon**: Q1 26

## Issue Context
- No existing GitHub issues found for this topic.
- [task.md](file:///Users/mj/.gemini/antigravity/brain/75ad19b3-c8b2-40e1-99f8-192c952f7575/task.md)

## 8. Technical Review

### Phase 0: Context & History
- **Impacted Files**:
  - `app/t/[slug]/admin/residents/create/create-resident-form.tsx` (Target UI for auto-selection logic)
  - `app/t/[slug]/admin/families/create/create-family-form.tsx` (Reference for creation logic)
  - `db/schema.ts` (Implicitly defined via SQL migrations in `scripts/`)
- **Historical Context**:
  - Recent activity in `create-resident-form.tsx` involves user deduplication and RLS fixes (Jan 17 2026).
  - Family unit creation logic was recently touched to support passive members and avatar uploads (Jan 10 2026).
  - **Risk**: The resident creation flow is high-traffic and complex due to valid deduplication and family linking logic. Changes here must ensure no regressions in identifying existing users.

### Phase 1: Vibe & Security Audit
- **Findings**:
  - `scripts/062_fix_rls_family_visibility.sql` sets strict tenant-scoped visibility for family members.
  - `scripts/058_allow_residents_insert_family.sql` permits family adds but is restricted to primary contacts.
- **Attack Surface**:
  - **Cross-Tenant Leakage**: The automatic selection feature queries families based on `lot_id`. It is CRITICAL that this query filters by `tenant_id` to prevent an admin from seeing/linking a family from another tenant if `lot_id`s are not standard UUIDs or if there's a logic bug.
- **Recommendation**: Ensure the "Find Family by Lot" query explicitly includes `AND tenant_id = current_tenant_id`.

### Phase 2: Test Strategy
- **Sad Paths**:
  1. **Lot Ghosting**: Lot has a family linked in DB, but family is soft-deleted (if applicable) or contains 0 members. System should still suggest it or handle gracefully.
  2. **Override Conflict**: Admin chooses "Create New Family" for a lot with an existing family. System *must* prompt for confirmation (as per requirements).
  3. **Race Condition**: Admin A adds Family X to Lot 1. Admin B simultaneously adds Resident Y to Lot 1. System should detect Family X or handle the collision.
- **Automated Tests**:
  - **Unit**: Mock the `useFamilyByLot` hook to return null, existing family, and error states. Verify form default values.
  - **Integration**: Test the new `Form Controller` component with specific inputs simulating the "Pre-populated" state.

### Phase 3: Performance Assessment
- **Schema Analysis**:
  - **Relationship**: `Family <-> Lot` is likely indirect via `Residents` (User -> LotID, User -> FamilyID).
  - **Query**: To find a family for a lot, we likely query: `SELECT family_unit_id FROM users WHERE lot_id = $1 AND tenant_id = $2 LIMIT 1`.
- **Index Check**:
  - **Requirement**: `users` table MUST have an index on `lot_id`.
  - **Verification**: `idx_users_lot_id` CONFIRMED in `scripts/022_extend_users_table_for_residents.sql`.
  - **Conclusion**: Lookup performance should be optimal.

### Phase 4: Documentation Plan
- **User Manuals**:
  - Update `docs/01-manuals/admin-guide/` (Resident Management section) to explain the new "Auto-Select Family" behavior and the "Override" warning.
- **API Docs**:
  - No public API changes expected (internal hook logic), so `api-reference.md` changes are likely minimal unless we add a specific `GET /api/lots/:id/family` endpoint.

### Phase 5: Strategic Alignment & Decision
- **Status**: The functionality is a high-value friction remover ("Paper Cut").
- **Recommendation**: **Prioritize**. Move to "Ready for Development".
- **Specification**: Implement **Option 3 (Form Controller)**. Ensure robust RLS checks in the lookup query.



## Implemented Behavior (2026-02-12)
- **Occupied Lots**:
  - System detects if a family unit exists for the selected lot.
  - Presents explicit options: "Add to Existing Family", "Create Independent Resident", or "Unlink Existing Residents".
  - "Unlink" clears the lot assignment for current residents (moving them to "No Lot") before assigning the new resident.
- **Household Settings**:
  - Added strict RLS bypass (Server Action) for adding existing residents to a family unit, ensuring only valid family members can perform this action.
