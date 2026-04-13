source: requirement
imported_date: 2026-04-08
---
# Requirements: Image Upload for Residential Lots

## 📋 Objective
Extend the image upload feature to private residential lots, allowing residents to showcase their homes in the directory/profile.

## 👤 User Story
As a **Resident**, I want to upload and manage photos of my home from my family settings, so that I can showcase my property in the community directory in a dedicated section separate from my family photos.

## 📄 Context
- **Current State**: `PhotoManager` component exists and handles uploads for `location`, `family`, `user`, etc. Residents have profiles that show family photos, but not lot-specific photos.
- **Data Model**: `lots` table exists but currently only holds metadata (`lot_number`, `address`, etc.). It needs to support `photos` (text array) and `hero_photo` (text) similar to the `users` table.

## 🛠 Functional Requirements
1. **Management**: Residents can upload, delete, and set a 'hero' photo for their residential lot within the "Family Profile Settings".
2. **Separation**: Lot photos MUST be stored/managed independently of user/family photos.
3. **Display**: A new "Home Showcase" section in the resident's public profile in the directory.
4. **Privacy**: Lot photos should respect family/neighborhood privacy settings (if applicable).

## 🔗 Dependencies
- **Backend**: `lots` table schema needs update to include `photos` and `hero_photo` columns.
- **Frontend**: `PhotoManager` extension to support `lot` entity type.
- **API**: `/api/upload` (already exists, but verify generic usage).

## 💡 Technical Options (Phase 2)

### Option 1: Direct Extension of `lots` table
Update the `lots` table schema to include `photos` and `hero_photo` columns.
- **Pros**: Clean data model, directly associates images with the lot, minimal logic changes.
- **Cons**: Requires database migration.
- **Effort**: S (Schema change + UI update)

### Option 2: Junction Table for Lot Photos
Create a `lot_photos` table to store multiple images per lot.
- **Pros**: More flexible for future extensions (metadata per photo, ordering, etc.).
- **Cons**: More complex queries, overkill for simple directory showcase.
- **Effort**: M (New table, migration, updated actions)

### Option 3: Metadata Storage in `families` table
Store lot photo URLs in a JSONB field within the `family_units` table.
- **Pros**: No new schema columns for `lots`, keeps residential data near family data.
- **Cons**: Breaks entity relationship (photos belong to the lot, not the family unit itself), harder to search/index.
- **Effort**: S (JSONB update + UI update)

## 🎯 Recommendation (Phase 3)

### Selected Approach: Option 1 - Direct Extension of `lots` table
Option 1 is the most straightforward and aligns with how `photos` are currently handled for other entities like `users` and `locations`. It minimizes architectural complexity while delivering the required functionality with minimal effort.

- **Priority**: P1
- **Size**: S
- **Horizon**: Q1 26

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue**: [Brainstorm] Image upload residential lots
- **Item ID**: `151884757`
- **Status**: In review
- **Description**: Extend image upload feature to private residential lots. Residents upload via family settings, showcase in profile.
- **Artifact**: [requirements_2026-01-25_residential_lot_images.md](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-01-25_residential_lot_images.md)

### Phase 0: Impact Map
- **Backend**: `lots` table needs `photos` (text[]) and `hero_photo` (text) columns.
- **Frontend**: `components/photo-manager.tsx` needs to support `entityType="lot"`.
- **Logic**: `app/t/[slug]/admin/lots/` and resident-facing family settings need updates to include `PhotoManager`.
- **API**: `/api/upload` (generic usage check).

### Phase 0: Historical Context
- `photo-manager.tsx` supports 6 entity types; `lot` will be the 7th. Recent changes improved reliability and UI for the Alpha Cohort.

### Phase 1: Vibe & Security Audit
- **Vibe Check**: `lots` table has RLS enabled. Currently, residents have `SELECT` access to all lots in their tenant, but NO `UPDATE` access.
- **Attack Surface**: 
    - **RLS Gap**: A new policy is required to allow residents to update *only* the lot linked via `users.lot_id`. 
    - **Upload Path**: Generic `/api/upload` is used. Security relies on storage bucket policies.
    - **Constraint**: `lot_photos` bucket MUST be **Private**. Access via Signed URLs only.
- **Recommendation**: Implement `UPDATE` policy on `lots` matching `auth.uid()` to `users.id` where `users.lot_id = lots.id`.

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Permissions**: Verify a resident cannot update photos for a lot that isn't theirs.
    - **Validation**: Verify 10MB limit and max photo count (20) are enforced in `PhotoManager`.
    - **Data Integrity**: Verify setting a non-existent photo as `hero_photo` is handled or prevented.
- **Test Plan**:
    - **Unit**: Extend `PhotoManager` tests to cover `lot` entity label.
    - **Integration**: Supabase RLS test for `lots` table `UPDATE` by resident.
    - **Manual/E2E**: Resident user journey: Dashboard -> Profile Settings -> Lot Photo Upload -> Verify profile showcase.

### Phase 3: Performance Review
- **Scale**: Small dataset (282 lots, 18 users). Array columns for photos are highly efficient for this scale.
- **Optimization**: `idx_users_lot_id` index is present, ensuring $O(1)$ ownership validation.
- **Bottlenecks**: None identified for current and near-term growth.

### Phase 4: Documentation Plan
- **User Manuals**:
    - [NEW] `docs/01-manuals/resident-guide/home-showcase.md`: Resident instructions for property photos.
- **API**:
    - [GAP] `docs/02-technical/api/api-reference.md`: Missing generic upload/entity update documentation.
- **Schema**:
    - [NEW] `docs/02-technical/schema/tables/lots.md`: Column documentation for `lots`.
    - [NEW] `docs/02-technical/schema/policies/lots.md`: RLS policy documentation.

### Phase 5: Strategic Alignment & Decision
- **Conflicts**: No conflicting items found on the project board. Item 12 is the primary tracking item.
- **Sizing**: **S** (Small). Well-defined extension of existing patterns.
- **Decision**: **Prioritize**. Recommend moving to **Ready for development**.

🔁 [PHASE 5 COMPLETE] Documentation gaps logged. Handing off to User for Final Approval...

## 9. Specification

### Proposed Changes
1.  **Database**:
    - Add `photos text[] DEFAULT '{}'` to `lots` table.
    - Add `hero_photo text` to `lots` table.
    - Add RLS policy for resident updates.
2.  **Frontend**:
    - Extend `PhotoManager` `entityType` and `getEntityLabel`.
    - Integrate `PhotoManager` into the family/profile settings page for residents.
3.  **API**:
    - No changes required to `/api/upload`.