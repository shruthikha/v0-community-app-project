source: requirement
imported_date: 2026-04-08
---
# Requirements: Granular Facility Location Types

## Problem Statement

Currently, facility location types are defined broadly and loosely (e.g., "Common Area"), grouping distinct facilities like "Pool", "Rancho", and "Yoga Shala" under a single umbrella. This causes:
1.  **User Confusion**: Users cannot distinguish where exactly they should go.
2.  **Navigation Issues**: Map pins may point to a general center of a common area rather than the specific facility, leading users to think a location is blocked or incorrect.
3.  **Data Inaccuracy**: Actions and information specific to a "Pool" vs a "Yoga Shala" cannot be distinctly managed.

## User Persona

*   **Admin**: Needs to classify facilities accurately when creating or editing them to ensure users get the right info.
*   **End User/Resident**: Needs to see specific facility types on the map to understand availability, rules, and exact location.

## Context

*   **Current Implementation**: `components/map/form-fields/FacilityFields.tsx` currently uses a free-text `Input` for `facilityType`. There is no standardization.
*   **Affected Components**:
    *   `FacilityFields.tsx` (Admin Input)
    *   Map Components (Display pins/clusters)
    *   Location Info Cards (Display type)

## Dependencies

*   **Related Issues**:
    *   None found in current repository.
*   **Documentation Gaps**:
    *   "Common Area" usage in DB is not visible in codebase (likely data-only).

## Issue Context

*   **Source**: User Request (Feedback from testing/usage).
*   **Gap**: No existing enum or strictly defined list for `facilityType`.

## Technical Options

### Option 1: Static List (Hardcoded Enum)
Define a static list of facility types in the frontend code and use a `Select` component.
*   **Pros**:
    *   Fastest implementation (just frontend changes).
    *   Ensures consistent data entry immediately.
    *   Zero database schema changes needed (if using string storage).
*   **Cons**:
    *   Adding a new type requires a code update and deployment.
    *   Rigid; doesn't allow admins to customize types on the fly.
*   **Effort**: XS (1-2 hours)

### Option 2: Database Managed Types (Dynamic)
Create a new database table/collection for `FacilityTypes` and manage them via an admin UI.
*   **Pros**:
    *   Fully dynamic; admins can add/edit types without developers.
    *   Can store metadata per type (e.g., specific icons, default rules).
*   **Cons**:
    *   Higher effort: Migration, API creation, Admin UI for managing types.
    *   Overkill if the list rarely changes.
*   **Effort**: M (1-2 days)

### Option 3: Hierarchical Structure (Type + SubType)
Keep the broad "Facility Type" (e.g. "Common Area") and add a new "Specific Type" field (e.g. "Pool").
*   **Pros**:
    *   Maintains backward compatibility with existing "Common Area" grouping.
    *   Allows for broader filtering (Show all Common Areas) vs specific finding (Show Pools).
*   **Cons**:
    *   More complex UI (Dependent dropdowns).
    *   Requires schema update to add the new field.
*   **Effort**: S (4-6 hours)

## Recommendation

*   **Selected Option**: Option 1 (Static List/Enum).
*   **Reasoning**: It offers the highest speed-to-value ratio. Validating the "types" first with a hardcoded list allows us to solve the user confusion immediately. If the list needs frequent updates later, we can migrate to Option 2 (DB Managed) as a Phase 2 project.
*   **Classification**:
    *   **Priority**: P1 (High Impact on UX)
    *   **Size**: XS (Simple frontend validation/select list)
    *   **Horizon**: Q1 26


## 8. Technical Review

### Phase 0: Context & History
*   **Impacted Files**:
    *   `components/map/form-fields/FacilityFields.tsx`: Validated as the primary input component. Currently uses free-text Input.
    *   `components/map/MapboxEditorClient.tsx`: Maps frontend `facilityType` to backend `facility_type`.
*   **Historical Context**:
    *   `FacilityFields.tsx` was last modified in Jan 2026 (Alpha Launch) to "save all location attributes".
    *   The code is React client component using server actions.
*   **Dependency Graph**:
    *   Frontend: `FacilityFields` -> `PhotoManager` / UI Components.
    *   Backend: `createLocation` / `updateLocation` actions -> DB.

### Phase 1: Security Audit
*   **Vibe Check**:
    *   `app/actions/locations.ts` implements RBAC (checking `is_tenant_admin`).
    *   `scripts/045_create_locations_table.sql` enables RLS. Policies exist for Super Admin (ALL), Tenant Admin (ALL within tenant), and Resident (SELECT within tenant).
*   **Attack Surface**:
    *   `facility_type` column is `text` with no constraint. DB accepts any string.
    *   No specific injection risk found (using PostgREST/Supabase client).
    *   **Note**: "Backend-First" principle implies we should eventually enforce this enum at DB level (CHECK constraint) or Zod schema, but Option 1 (Frontend only) leaves DB flexible.

### Phase 2: Test Strategy
*   **Sad Paths**:
    *   Legacy data with "Common Area" or undefined types. (Frontend must handle graceful fallback).
    *   Empty selection (Frontend validation required).
*   **Tests Required**:
    *   **Unit**: `FacilityFields.test.tsx` (if exists) or manual verification of Dropdown options.
    *   **Manual**: Admin > Map > Add Facility > Select Type > Save. Verify persistence.

### Phase 3: Performance
*   **Schema**:
    *   Table: `locations`. Column: `facility_type` (text).
    *   Indices: `idx_locations_tenant`, `idx_locations_type` exist.
    *   **Gap**: No index on `facility_type`. Filtering map pins by "Pool" will require scanning all facilities. Given "Alpha" data volume, this is acceptable (Size XS).
*   **N+1**: No new relations introduced.

### Phase 4: Documentation Logic
*   **Manuals**: Update Admin Guide to reflect specific facility types.
*   **Schema**: `docs/02-technical/schema/tables/locations.md` needs update to mention the standardized types.
*   **Gaps**: `documentation_gaps.md` to note the "Conceptual" Facility Type enum.

### Phase 5: Strategic Alignment
*   **Board Status**: Issue is "In Review".
*   **Sizing**: Confirmed XS (Frontend-only change).
*   **Recommendation**: **Prioritize** (Ready for Development).
*   **Missing Info**: Definitive list of Facility Types (e.g., Pool, Gym, Rancho, Yoga Shala, Tennis Court, etc.) needs to be provided by Product Owner.

## 9. Final Specification (For Development)
*   **Goal**: Replace free-text input with `Select` component in `FacilityFields.tsx`.
*   **Acceptance Criteria**:
    1.  User sees a Dropdown for "Facility Type".
    2.  User cannot type free text.
    3.  Saved value persists in DB `facility_type` column.
    4.  Legacy values (if any) are displayed gracefully (or we migrate them - TBD).
*   **Technical Implementation**:
    *   Create `const FACILITY_TYPES = [...]` constant (likely in `@/lib/constants` or component).
    *   Replace `Input` with `Select` in `FacilityFields.tsx`.
    *   Ensure `MapboxEditorClient` passes the value correctly (already done, just mapped).


