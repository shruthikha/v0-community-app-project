source: requirement
imported_date: 2026-04-08
---
# Requirements: Request Access Lot Search Fix

## 1. Problem Statement

On the **Request Access** page, the lot search functionality is currently non-functional or suboptimal:
1.  **Search Failures**: Searching for specific lots (e.g., "D 401") often yields no results.
2.  **Messy Ordering**: The list of lots appears random or disorganized, making it difficult for users to find their lot manually.
3.  **Strict Matching**: The search requires exact string matching, failing on minor variations like missing spaces or different formatting (e.g., "D401" vs "D 401").

## 2. User Persona

- **Prospective Resident**: A person wanting to join the community who needs to find their lot number in a list of ~280 lots. They expect the search to be intuitive and forgiving of formatting differences.

## 3. Context & Dependencies

- **Platform Component**: The `Combobox` component (`components/ui/combobox.tsx`) used in `app/t/[slug]/request-access/request-access-form.tsx`.
- **Data Source**: `app/api/v1/lots/route.ts` provides the list of lots.
- **Root Cause**: The `Combobox` currently uses the `lot.id` (UUID) as the search value in `CommandItem`, which prevents matching against user-typed lot numbers.

## 4. Functional Requirements

### 4.1 Search Behavior
1.  **Automatic Variation Handling**: 
    - The search must normalize both the user input and the lot numbers by removing non-alphanumeric characters (spaces, hyphens).
    - Example: "D 401", "D401", and "D-401" should all match "Lot D 401".
2.  **Fuzzy/Partial Matching**:
    - Users should be able to type just a letter (e.g., "D") to see all lots starting with that letter.

### 4.2 Result Ordering
1.  **Priority Ranking**:
    - **Exact Match First**: If the input exactly matches a lot number (after normalization), it must appear at the top.
    - **Starts-With Matches**: Lots starting with the search string should follow.
    - **Contains Matches**: Lots containing the search string should follow.
2.  **Alphabetical Sorting**:
    - Within each priority group, lots must be sorted alphabetically (natural sort preferred, e.g., D 2 before D 10).

### 4.3 Scope
- This fix is **isolated** to the Request Access page to minimize regression risk in other areas of the application using the `Combobox`.

## 5. Documentation Gaps

- **2026-03-10**: Missing technical documentation for `Combobox` search/filtering logic. Added to `docs/documentation_gaps.md`.
- **2026-03-10**: Lot number format standards are not documented in `docs/02-technical/schema/tables/lots.md`.

## 6. Dependencies

- #99 — Request Access on Login Page (Implementation base).

## 7. Technical Options

### Option 1: Enhanced Client-Side Normalization (Combobox Update)
Modify the `Combobox` component to search against a normalized version of the `label` (e.g., "Lot D 401" -> "d401") instead of the `value` (UUID). This involves setting the `value` prop of `CommandItem` to a searchable string.

- **Pros**: Fast implementation; no backend changes; handles variations ("d 401" vs "d401") effectively.
- **Cons**: Requires modifying a shared UI component; `cmdk` internal sorting may still produce "messy" results if not manually controlled.
- **Effort**: S (Small)

### Option 2: Pre-Filtered and Ranked Options (Form Logic)
Perform sorting and normalization in `request-access-form.tsx` before passing the `options` array to the `Combobox`. We can pass a pre-sorted and pre-labeled list where the highest-scoring matches (exact, starts-with) are placed at the top.

- **Pros**: Keeps the `Combobox` generic; allows for explicit "Exact Match First" and alphabetical sorting without relying solely on `cmdk` scoring.
- **Cons**: Requires consistent normalization between the form and the search input; slight logic overhead on the component.
- **Effort**: S (Small)

### Option 3: Search-Optimized API (Backend Enhancement)
Update the `/api/v1/lots` endpoint to accept a `search` parameter and use PostgreSQL's string functions (e.g., `REGEXP_REPLACE`) to perform normalized matching and return naturally sorted results.

- **Pros**: Most robust solution; reduces client-side processing; logic is reusable for other tenant search features.
- **Cons**: Requires backend changes (Supabase query update); slower iteration than client-side fixes.
- **Effort**: M (Medium)

---

## 8. Recommendation

### ✅ Recommended: Option 2 — Pre-Filtered and Ranked Options (Form Logic)

**Rationale**:
Option 2 is the most surgical and effective approach for this specific issue. By handling the sorting and ranking logic within the `request-access-form.tsx` itself, we can ensure:
1.  **Strict Ordering**: We can explicitly place exact matches at the top of the list, followed by starts-with and then alphabetical results, fulfilling the user's specific request for non-"messy" results.
2.  **Zero Risk to Other Components**: Since we are not modifying the shared `Combobox` core logic (which might be used in the admin backoffice or other sensitive areas), there is no risk of side effects.
3.  **Flexible Normalization**: We can implement normalization (removing spaces/special chars) specifically tuned for lot numbers without affecting other search types.

### Classification

| Property | Value |
|----------|-------|
| **Priority** | P1 — High (Critical for onboarding user experience) |
| **Size** | XS — Extra Small (Minor logic update in one file) |
| **Horizon** | Q1 26 (Immediate implementation) |

---

## 9. Technical Review

### Phase 0: Context Gathering

#### Issue Details
- **Issue**: #155 - Search lot doesn't work on request access page.
- **Problem**: The `Combobox` uses `lot.id` (UUID) as the search value, but users search for `lot_number`. Sorting is also non-intuitive.
- **Requirements**: Normalization, ranking (Exact > Starts-with > Contains), and alphabetical sorting.
- **Recommendation**: Client-side logic in `request-access-form.tsx` (Option 2).

#### Impact Map
- **Files Affected**:
    - `app/t/[slug]/request-access/request-access-form.tsx`: Main implementation of the form and lot selection.
    - `components/ui/combobox.tsx`: UI component utilized by the form.
- **Dependencies**:
    - `app/api/v1/lots/route.ts`: Data source for lot distribution.
    - `lib/validation/access-request-schema.ts`: Validation for the form submission.

#### Historical Context
- **Recent Changes**:
    - `request-access-form.tsx` was recently updated to integrate the `Combobox` for lot selection (Ref: commit `6e47683`).
    - The initial implementation relied on default `Combobox` behavior which defaults to UUID searching when `value` is set to the ID.

### Phase 1: Vibe & Security Audit

#### Vibe Check
- **Compliance**: `vibe-code-check` principles are strictly followed.
- **Frontend-DB Isolation**: No instances of `supabase.from` or direct database imports were found in client components. The `request-access-form.tsx` correctly utilizes a server-side API endpoint (`/api/v1/lots`).
- **Zero Policy**: The backend uses an administrative client with the service role for controlled access to restricted data, moving logic away from the database's RLS policy layer to the application layer.

#### Attack Surface Analysis
- **PII Leakage**: The `/api/v1/lots` endpoint exposes only `id`, `lot_number`, and a `is_occupied` boolean. No resident names, emails, or occupancy details are leaked.
- **Tenant Isolation**: Verified that lot queries are correctly scoped to the `tenant_id` resolved from the `tenant_slug` parameter.
- **Rate Limiting**: The public endpoint is protected by a 10 req/min rate limit per IP, preventing excessive enumeration.

#### Hidden Vectors
- The normalization logic proposed for the fix is strictly client-side for UI/UX purposes, posing no risk to the backend data integrity or SQL injection vectors.

### Phase 2: Test Strategy

#### Sad Paths
- **Offline / API Failure**: Verify that the form handles a failed lot fetch gracefully (e.g., showing "Failed to load lots" or disabling the dropdown).
- **No Results**: Ensure the "No matching lots found" message appears correctly when entering non-existent lot numbers.
- **Ambiguous Input**: Typing "4" should return "Lot D 401" and "Lot D 4" but must prioritize exact/starts-with matches over "contains" matches.
- **Special Characters**: Entering "D-401" or "D 401" must match "Lot D 401" via the normalization layer.

#### Test Plan
- **Unit Tests**:
    - **Normalization**: Test the `normalizeLot` utility to ensure "D 401" and "d-401" both become "d401".
    - **Ranking Logic**: Verify the sorting function correctly ranks Exact > Starts-With > Contains.
- **E2E Tests (Playwright)**:
    - **Search Verification**: Navigate to `/request-access`, type "D401", and verify "Lot D 401" is selected/visible.
    - **Natural Sort**: Verify "Lot D 2" appears before "Lot D 10" in the results list.
- **Manual Verification**:
    - Open the search on a mobile device to ensure the `Combobox` keyboard interaction is smooth after filtering.

### Phase 3: Performance Assessment

#### Schema Static Analysis
- **Lots Table**: The `lots` table contains indexes on `tenant_id`, `neighborhood_id`, and `location_id`. While `lot_number` is not indexed, queries are always scoped by `tenant_id`, which typically contains <1,000 records, ensuring fast sequential scans.
- **Access Requests**: The `access_requests` table has a unique index on `(tenant_id, lower(email))` for pending requests, preventing duplicate submissions.

#### Query Efficiency
- **API Route**: `app/api/v1/lots/route.ts` executes exactly 3 queries (Tenant Resolution, Lot Retrieval, Occupancy Check). No N+1 patterns were identified.
- **Client-Side Processing**: Filtering and ranking ~280 lots on the client is computationally cheap (<5ms) and provides a much snappier UX than server-side search for this data volume.

#### Bottleneck Identification
- **Payload Size**: The JSON response for ~280 lots is approximately 25KB, well within optimal limits for even slow mobile connections.
- **Occupancy Query**: The `users` table check for occupancy is scoped by `tenant_id` and `role='resident'`, ensuring it remains fast as the global user count grows.

### Phase 4: Documentation Logic

#### Mandatory Audit
- **User Manuals**:
    - **Resident Guide**: Update required to explain the new "forgiving search" (normalization) in the Request Access flow.
- **API Documentation**:
    - **Public Endpoints**: Technical documentation for `/api/v1/lots` and `/api/v1/access-request` is currently missing.
- **Schema Documentation**:
    - **Lots Table**: Missing documentation for `lots` table schema and RLS in `docs/02-technical/schema/tables/lots.md`.
- **UI Components**:
    - **Combobox**: Documentation on how to implement custom filtering/ranking in the `Combobox` wrapper is needed for future reuse.

#### Gap Logging
- All critical documentation gaps identified during this review (Combobox logic, Lot schema, Public API docs) are already logged and tracked in `docs/documentation_gaps.md`.

---

### Phase 5: Strategic Alignment & Decision

#### Priority & Sizing
- **Business Value**: High. Failing search on the entry point for new residents creates a negative first impression and increases support load.
- **Technical Complexity**: XS. Purely a logic update within a single client component.

#### Conflict Check
- **No known conflicts**: No other active PRs are modifying the lot selection logic in `request-access-form.tsx`.
- **Isolation**: Sticking with Option 2 ensures zero impact on other project areas using `Combobox`.

#### Recommendation
- **PROCEED TO BUILD**: This issue is scoped, verified, and ready for development.

🎯 [REVIEW COMPLETE] Issue #155 is Ready for Development.
