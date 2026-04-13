source: research
imported_date: 2026-04-12
---
# Exploration: Issue 66 - Image Upload Residential Lots

**Date**: 2026-04-12
**Type**: codebase
**Depth**: deep
**Issue**: GitHub #66

## Context

**User Story (from issue)**: Extend image upload feature to private residential lots, allowing residents to showcase their homes in the directory/profile.

**Selected Approach (from issue)**: Option 1 - Direct Extension of lots table, adding `photos` and `hero_photo` columns.

This exploration validates the approach and identifies what changes are needed.

## Prior Work

**Wiki References**:
- `knowledge/wiki/patterns/file-upload-security.md` — Core upload security patterns
- `knowledge/wiki/lessons/magic-byte-validation.md` — Upload validation lessons
- `knowledge/wiki/patterns/supabase-multi-tenancy.md` — RLS patterns

**Requirements Document**:
- `knowledge/raw/requirements-archive/requirements_2026-01-25_residential_lot_images.md` — Full requirements analysis (completed Jan 2026)
- Recommends: Add `photos text[] DEFAULT '{}'` and `hero_photo text` to `lots` table
- Recommends: Add RLS policy for resident updates
- Recommends: PhotoManager entityType extension

**Prior Audit Findings** (related):
- `knowledge/raw/audits/codebase-review/audit_2026-04-11_upload-api.md` — Upload API audit (Apr 2026)
- Issue C4: Photos bucket has no creation migration
- Issue H3: DELETE endpoint has zero callers
- Issue H5: No file size limit on photos bucket

## Findings

### 1. PhotoManager Component

**File**: `components/photo-manager.tsx`

**Current entityTypes**: 6 total
```typescript
entityType?: "location" | "family" | "user" | "pet" | "neighborhood" | "event"
```

**getEntityLabel function** (lines 144-154):
```typescript
const getEntityLabel = () => {
  const labels = {
    location: "location",
    family: "family",
    user: "profile",
    pet: "pet",
    neighborhood: "neighborhood",
    event: "event",
  }
  return labels[entityType] || "item"
}
```

**Change required**: Add `"lot"` to entityType union and `"lot": "home"` to labels.

### 2. Lots Table Schema

**Current columns** (from migration `clean_schema_final.sql`):
```
id, neighborhood_id, lot_number, address, created_at, updated_at, tenant_id, location_id
```

**Missing columns** (need to add):
- `photos text[] DEFAULT '{}'` — Array of photo URLs
- `hero_photo text` — Primary photo for showcase

**Verification**: No migration adds these columns yet ✅

### 3. Upload API

**File**: `app/api/upload/route.ts`

**Bucket selection** (line 40):
```typescript
const bucket = isDoc ? "documents" : "photos"
```
- Images go to `photos` bucket
- Documents go to `documents` bucket

**Path pattern** (from `lib/supabase-storage.ts` line 20):
```typescript
const path = `${date.getFullYear()}/${date.getMonth() + 1}/${uniqueId}-${filename}`
```
- Note: No tenant_id prefix in current pattern
- Storage RLS extracts tenant_id from first path segment via `storage.foldername(name)[1]`

**Verification**: No changes needed to upload API ✅

### 4. Storage RLS

**Current policies** (from `20260321000004_fix_storage_rls.sql`):
- Uses `storage.foldername(name)[1]` to extract tenant_id
- Checks against `public.get_user_role()` and `public.get_user_tenant_id()`
- Allows `super_admin` full access
- Allows `tenant_admin` access to their tenant's paths

**Critical gap**: Current policies only allow admin roles, NOT residents to upload.

**Required change**: New RLS policy for `photos` bucket allowing residents to upload to their tenant path.

### 5. Integration Points

**Family settings page**: `app/t/[slug]/dashboard/settings/family/page.tsx`
- Renders `FamilyManagementForm`

**Family management form**: `app/t/[slug]/dashboard/settings/family/family-management-form.tsx`
- Line 658: PhotoManager with `entityType="family"`
- Line 1043: PhotoManager with `entityType="pet"`
- **Has PhotoManager already** — can add lot PhotoManager here

**Admin lot edit**: `app/t/[slug]/admin/lots/[id]/edit/edit-lot-form.tsx`
- Currently **no PhotoManager**

**Where PhotoManager would be added**:
1. Primary: Family settings form (resident-facing)
2. Secondary: Admin lot edit form (tenant_admin-facing)

## Risk Analysis

### 🔴 Blocker: RLS Policy Gap

Current storage policies don't allow resident uploads. Residents would get "Unauthorized" errors when trying to upload lot photos.

**Fix**: Add new RLS policy allowing `resident` role to upload to their tenant's path.

### 🟡 High: Bucket Configuration

The `photos` bucket doesn't have `file_size_limit` set at database level (Issue H5 from prior audit).

**Fix**: Add migration to configure bucket limits.

### 💭 Medium: DELETE Endpoint

The DELETE endpoint (`/api/upload/delete`) has zero callers (Issue H3 from prior audit). PhotoManager removes photos client-side only, never calls API.

**Fix**: Either wire up DELETE or remove dead code.

## Verification Commands

```bash
# Show entityTypes in PhotoManager
grep "entityType" components/photo-manager.tsx | head -5

# Check lots table columns
grep -A20 "CREATE TABLE.*lots" supabase/migrations/*.sql

# Check upload endpoint
cat app/api/upload/route.ts | head -50
```

## Summary

The requirements document correctly identified the approach. All required changes are straightforward:

1. **Database**: Add `photos` and `hero_photo` columns via migration ✅
2. **PhotoManager**: Add `"lot"` to entityType and label ✅
3. **RLS**: Add resident UPDATE policy (CRITICAL gap) 🟡
4. **Storage**: Configure file size limit on photos bucket 🟡
5. **Integration**: Add PhotoManager to family settings form ✅

## Refactoring Opportunities

These items from the audit can fold into this work with minimal added effort:

| # | Item | Effort | How to Fold In |
|---|------|--------|----------------|
| **1** | **DELETE endpoint dead code** (`2026-04-11-delete-upload-dead-code.md`) | Small | Wire PhotoManager to call `/api/upload/delete` when removing photos. Currently removes from UI only. |
| **2** | **Hardcoded bucket names** (`2026-04-11_upload-hardcoded-bucket-names.md`) | Tiny | Create `STORAGE_BUCKETS` constant, use in upload API and PhotoManager while editing entityType. |

### Why These Fit

- **#1**: We're already extending PhotoManager for lots. Adding deletion support is natural parallel work — makes the feature complete.
- **#2**: Adding `"lot"` to entityType means editing `getEntityLabel`. Extracting bucket names to constants costs 5 minutes and prevents typo risk.

### Out of Scope (Keep Separate)

- **Upload tenant isolation** — Medium effort, requires changes to `lib/supabase-storage.ts`. Could break existing uploads. Keep as separate refactor.

## Recommendations

- [ ] **P1**: Add migration to create `photos` and `hero_photo` columns on `lots` table
- [ ] **P1**: Add `"lot"` to PhotoManager entityType and getEntityLabel
- [ ] **P1**: Add RLS policy allowing residents to UPDATE their lot (not all lots)
- [ ] **P2**: Add storage bucket configuration (file_size_limit, allowed_mime_types)
- [ ] **P2**: Integrate PhotoManager into family settings form for resident lot photos
- [ ] **P2**: Wire up DELETE endpoint in PhotoManager (from refactoring #1)
- [ ] **P2**: Extract bucket names to STORAGE_BUCKETS constant (from refactoring #2)

**Recommendation**: Ready for development. The approach is validated and all dependencies exist. Priority is P1 fixes for RLS policy gap before residents can upload.