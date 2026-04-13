---
title: Residential Lot Images
description: Allow residents to upload and display photos of their homes (lots) in the community
status: draft
created: 2026-04-12
priority: high
issue: GitHub #66
---

# Specification: Residential Lot Images

## Feature Overview

**Problem**: Lots currently have no photo capabilities. Residents need to showcase their homes in the directory, and the map sidepanel should display lot photos when users click on a lot marker.

**Solution**: Extend image upload to residential lots, with photos visible in the map sidepanel and tenant isolation via storage path prefixing.

### Scope

**In Scope:**
- Add `photos` and `hero_photo` columns to lots table
- Extend PhotoManager component with "lot" entity type
- RLS policy allowing residents to INSERT/UPDATE their own lot's photos
- Map sidepanel integration — show lot photos in LocationInfoCard
- Tenant isolation — Virtual Isolation: new uploads get tenant_id prefix, legacy files work via RLS policy
- Wire up DELETE endpoint in PhotoManager

**Out of Scope:**
- Advanced gallery features (zoom, slideshow)
- Face detection in photos
- Bilingual support (deferred)
- Physical migration of existing uploaded files

---

## Design Decisions

| Section | Decision | Rationale |
|---------|----------|-----------|
| **Data Model** | `photos text[] DEFAULT '{}'` + `hero_photo text` on lots table | Matches existing pattern for locations/neighborhoods |
| **Map Sidepanel** | Fetch lot photos via lot_id in LocationInfoCard | Follows existing pattern (lot, residents, pets fetched separately) |
| **Tenant Isolation** | RLS "Legacy Mode" — new uploads get tenant_id prefix, legacy files work via policy | No file migration risk |
| **RLS for Photos** | Resident INSERT + UPDATE on own lot | Full CRUD for lot owners |
| **Upload Flow** | Add PhotoManager to Family settings form + Admin lot edit | Meets user story, minimal effort |

---

## Requirements

### User Stories (Gherkin)

#### Story 1: Resident uploads photos of their home (lot)

> **As a** resident, **I want to** upload photos of my home/lot, **so that** I can showcase my property and help neighbors identify my lot on the community map.

**Given** I am a logged-in resident with an assigned lot  
**When** I navigate to Family settings, attach photos to my lot, and submit the form  
**Then** the photos are uploaded to storage with tenant_id prefix, and the `photos` column on my lot record is updated with the file paths  
**And** the upload progress is displayed during the upload process  
**And** I can see thumbnails of my uploaded photos after successful upload

#### Story 2: Resident views lot photos in map sidepanel

> **As a** resident, **I want to** see photos of a lot when I click on it in the map, **so that** I can visually identify properties and understand the community layout.

**Given** I am viewing the community map  
**When** I click on a lot marker to open the LocationInfoCard sidepanel  
**Then** the sidepanel displays the lot's photos (both `hero_photo` and `photos` array) in the existing photos section  
**And** the hero photo appears as the primary image  
**And** thumbnail images are clickable for preview

#### Story 3: Resident deletes a photo from their lot

> **As a** resident, **I want to** remove a photo I previously uploaded, **so that** I can keep my lot's photo collection current and accurate.

**Given** I am viewing my lot's photos in Family settings or Admin panel  
**When** I click the delete button on a specific photo and confirm the deletion  
**Then** the photo is removed from the `photos` array in the lot record  
**And** the corresponding file is deleted from storage  
**And** the UI updates to reflect the removal immediately

#### Story 4: Tenant admin manages lot photos in admin panel

> **As a** tenant administrator, **I want to** upload, view, and delete photos for any lot in the community, **so that** I can manage property visuals across the entire community.

**Given** I am a tenant admin with access to the admin panel  
**When** I navigate to lot management, select a specific lot, and use the PhotoManager to add or remove photos  
**Then** I can upload new photos that get stored with tenant_id prefix  
**And** I can view all photos associated with any lot  
**And** I can delete any photo from any lot

### Acceptance Criteria

| # | Criterion | Metric | How to Verify |
|---|-----------|--------|---------------|
| AC1 | Resident can upload photos to their assigned lot | Photos appear in `photos` column after upload | Upload 3 photos in Family settings, verify DB `photos` array contains 3 file paths |
| AC2 | Uploaded photos display in map sidepanel | LocationInfoCard shows photos within 500ms of opening | Click lot marker, verify photos visible in sidepanel |
| AC3 | Hero photo designated as primary | First photo or explicitly set hero_photo displays first | Set hero_photo, verify it appears as primary in sidepanel |
| AC4 | Photo upload includes progress indicator | Progress bar or spinner shown during upload | Upload large photo, observe loading state |
| AC5 | Photo deletion removes from DB and storage | File removed from storage bucket, `photos` array updated | Delete photo, verify storage file gone and DB updated |
| AC6 | RLS allows resident INSERT/UPDATE on own lot | Policy permits own lot photo modifications | Create test resident, verify they can modify their lot's photos |
| AC7 | Tenant isolation via storage path prefix | New files stored under `tenants/{tenant_id}/lots/` | Upload photo, verify storage path starts with tenant_id |
| AC8 | Admin can modify any lot's photos | Admin role can update photos for all lots | Login as admin, modify photos for different lots |
| AC10 | Empty state shows placeholder | No photos displays "No photos yet" message | View lot with zero photos, verify placeholder shown |

### Edge Cases

| Scenario | Expected Behavior | Handling |
|----------|-------------------|----------|
| Network failure during upload | Show error toast, retain form state, allow retry | Display "Upload failed. Please try again." with retry button |
| Invalid file type uploaded | Reject file immediately, show validation error | Accept only jpg/jpeg/png/webp, reject others with error message |
| File size exceeds limit (>10MB) | Reject with size limit error | Show "File too large. Maximum size is 10MB." |
| Permission denied (not own lot) | RLS blocks action, show appropriate error | Return 403 with "You don't have permission to modify this lot's photos" |
| Concurrent photo updates | Last write wins, no data corruption | RLS handles, no merge conflicts expected |
| Storage bucket missing | Show configuration error, prevent upload | Catch error, display "Storage not configured. Contact administrator." |
| Empty photos array | Display placeholder in sidepanel | Show "No photos available" with upload prompt (if permitted) |
| Tenant migration (legacy files) | Legacy files work via RLS policy | Existing files without tenant_id prefix accessible via "Legacy Mode" policy |
| Photo deletion fails | Show error, retain photo in UI | Toast error "Could not delete photo. Please try again." |

---

## Architecture

### Data Model

**Schema Changes to `lots` Table:**

```sql
ALTER TABLE lots 
ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hero_photo text;
```

**Index Recommendations:**
```sql
CREATE INDEX idx_lots_hero_photo ON lots(hero_photo) 
WHERE hero_photo IS NOT NULL;
```

### Database Functions

**1. Create get_user_lot_id() function:**

```sql
CREATE OR REPLACE FUNCTION public.get_user_lot_id()
RETURNS text SECURITY DEFINER
AS $$
  SELECT lot_id::text FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE;
```

### RLS Policies

**1. Lots table policy:**

```sql
CREATE POLICY "resident_can_manage_own_lot_photos" ON lots
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.lot_id = lots.id
  )
);
```

**2. Storage RLS policy for resident lot photos:**

```sql
CREATE POLICY "Residents manage lot photos" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'photos' AND 
  (storage.foldername(name))[1] = public.get_user_tenant_id()::text AND
  (storage.foldername(name))[2] = 'lots' AND
  (storage.foldername(name))[3] = public.get_user_lot_id()::text
);
```

**3. Legacy mode policy for existing files:**

```sql
CREATE POLICY "storage_tenant_isolation_extended" ON storage.objects
FOR ALL USING (
  bucket_id = 'photos' 
  AND (
    (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    OR (storage.foldername(name))[1] IS NULL
  )
);
```

### API Design

**1. Upload path format:**
```
tenants/{tenant_id}/lots/{lot_id}/{year}/{month}/{uuid}-{filename}
```

**2. Modify uploadFile() in lib/supabase-storage.ts:**
- Add optional `tenantId` parameter
- Change path format
- Add path validation to reject `..` or absolute paths

**3. Add authorization to deleteFile():**
- Verify user owns the photo before deletion
- Check tenant_id matches path's tenant_id
- If path is lots-based, verify user's lot_id matches

### PhotoManager Component Changes

**1. Add "lot" to entityType:**

```typescript
entityType?: "location" | "family" | "user" | "pet" | "neighborhood" | "event" | "lot"
```

**2. Update getEntityLabel:**

```typescript
const labels = {
  // ... existing
  lot: "home",
}
```

**3. Wire up DELETE endpoint in removePhoto():**

```typescript
const removePhoto = async (urlToRemove: string) => {
  setDeleting(urlToRemove)
  
  try {
    // DELETE from storage
    const deleteResponse = await fetch(`/api/upload/delete?url=${encodeURIComponent(urlToRemove)}`, {
      method: 'DELETE',
    })
    
    if (!deleteResponse.ok) {
      throw new Error('Failed to delete from storage')
    }
    
    // ... rest of local state update
  }
}
```

### LocationInfoCard Changes

**Fetch lot photos via lot_id:**

```typescript
if (location.type === "lot" && location.lot_id) {
  const { data: lotData } = await supabase
    .from('lots')
    .select('id, lot_number, photos, hero_photo')
    .eq('id', location.lot_id)
    .single()
  
  if (lotData) {
    location.photos = lotData.photos
    location.hero_photo = lotData.hero_photo
  }
}
```

---

## Tasks

### Database Tasks

| Task | Effort | Complexity | Notes |
|------|--------|-----------|-------|
| Add photos and hero_photo columns to lots table | Small | Low | Simple ALTER TABLE with defaults |
| Create get_user_lot_id() function | Small | Low | Follows existing get_user_tenant_id() pattern |
| Add RLS policy for lots table | Medium | Medium | Requires conflict check with existing policies |
| Add storage RLS policy for resident lot photo access | Medium | High | Must integrate with existing storage policies |

**Concerns:**
- Verify `users.lot_id` column exists or adjust to use `residents` table
- Check storage RLS policy conflicts before adding

### Backend Tasks

| Task | Effort | Complexity | Notes |
|------|--------|-----------|-------|
| Modify uploadFile() to add tenantId parameter | Small | Low | Add optional parameter, modify path template |
| Add authorization to deleteFile() | Medium | Moderate | Requires auth context extraction and path parsing |
| Wire up DELETE endpoint in PhotoManager | Small | Low | Add fetch call in removePhoto() |

**Concerns:**
- DELETE endpoint should also enforce authorization
- User context must flow to storage function

### Frontend Tasks

| Task | Effort | Complexity | Notes |
|------|--------|-----------|-------|
| Add "lot" to PhotoManager entityType | Small | Low | Two string additions |
| Add PhotoManager to Family settings form | Medium | Medium | State + handlers + UI (similar to existing family/pet) |
| Update LocationInfoCard for lot photos | Small | Low | Display logic exists; verify data fetch |

**Concerns:**
- Task 2 depends on how lot photo data flows into the form
- Task 3 may need coordination with location data fetch

### Summary

| Category | Total Tasks | Effort Range |
|----------|-------------|--------------|
| Database | 4 | Small to Medium |
| Backend | 3 | Small to Medium |
| Frontend | 3 | Small to Medium |
| **Total** | **10** | - |

---

## Risks

1. **Users table may not have lot_id column** — residents linked via `residents` table or `family_units`. Verify schema before implementation.

2. **Storage RLS policy conflicts** — adding new policy for residents may shadow existing admin policies. Test thoroughly.

3. **DELETE endpoint lacks auth** — current implementation has no authorization. Must add before wiring up PhotoManager.

4. **No existing lot photo data flow** — Family settings form needs to receive lot photo data. May need parent component changes.

---

## Related Files

- Research: `knowledge/raw/research/explore_2026-04-12_issue66_residential_lot_images.md`
- Prior requirements: `knowledge/raw/requirements-archive/requirements_2026-01-25_residential_lot_images.md`
- Refactoring: `knowledge/raw/refactoring/2026-04-11_upload-tenant-isolation.md`
- Wiki: `knowledge/wiki/patterns/supabase-multi-tenancy.md`
- Wiki: `knowledge/wiki/patterns/file-upload-security.md`
- Wiki: `knowledge/wiki/lessons/supabase-storage-rls.md`

---

*Status: draft — awaiting implementation*