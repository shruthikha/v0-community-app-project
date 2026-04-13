---
title: Residential Lot Images — Implementation Plan
status: ready
created: 2026-04-12
issue: GitHub #66
---

# Residential Lot Images — Implementation Plan

## Goal

Extend image upload to residential lots, allowing residents to upload and display photos of their homes. Lot photos visible in map sidepanel (LocationInfoCard) with tenant isolation via storage path prefixing.

## Tasks

### Group 1: Database Schema

| # | Task | Type | Specialist | Files | Dependencies |
|---|------|------|------------|-------|--------------|
| 1 | Add photos text[] and hero_photo text columns to lots table | DB | @database-architect | `supabase/migrations/` | none |
| 2 | Create get_user_lot_id() helper function | DB | @database-architect | `supabase/migrations/` | none |
| 3 | Add index on hero_photo | DB | @database-architect | `supabase/migrations/` | task 1 |

**Verification:** Columns appear in `SELECT * FROM information_schema.columns WHERE table_name = 'lots';`

### Group 2: Storage Backend

| # | Task | Type | Specialist | Files | Dependencies |
|---|------|------|------------|-------|--------------|
| 4 | Modify uploadFile() to add tenantId parameter and new path format | Backend | @backend-specialist | `lib/supabase-storage.ts` | none |
| 5 | Add authorization to deleteFile() endpoint | Backend | @backend-specialist | `app/api/upload/delete/route.ts`, `lib/supabase-storage.ts` | task 4 |
| 6 | Add storage RLS policy for resident lot photo access | DB | @database-architect | `supabase/migrations/` | task 4 |

**Path format:** `tenants/{tenant_id}/lots/{lot_id}/{year}/{month}/{uuid-filename}`

**Verification:**
- Uploaded file in storage has tenant_id path prefix
- DELETE returns 403 for unauthorized files

### Group 3: PhotoManager Component

| # | Task | Type | Specialist | Files | Dependencies |
|---|------|------|------------|-------|--------------|
| 7 | Add "lot" to PhotoManager entityType and labels | Frontend | @frontend-specialist | `components/photo-manager.tsx` | none |
| 8 | Wire DELETE endpoint in PhotoManager removePhoto() | Frontend | @frontend-specialist | `components/photo-manager.tsx` | task 5 |

**Verification:** entityType="lot" renders, delete calls API

### Group 4: UI Integration

| # | Task | Type | Specialist | Files | Dependencies |
|---|------|------|------------|-------|--------------|
| 9 | Add PhotoManager to Family settings form with lot data | Frontend | @frontend-specialist | `app/t/[slug]/dashboard/settings/family/family-management-form.tsx` | tasks 1, 7 |
| 10 | Update LocationInfoCard to fetch and display lot photos | Frontend | @frontend-specialist | `components/map/location-info-card.tsx` | task 1 |

**Verification:** Lot photos visible in Family settings and map sidepanel

---

## Manual Test Checkpoints

### Checkpoint 1: Database Schema

**Tasks in this group:** 1, 2, 3

**What to test:**
1. Connect to development Supabase project (`ehovmosz...`)
2. Run migration file created by @database-architect
3. Query lots table schema in Supabase Studio

**What to verify:**
- [ ] `photos` column exists as `text[]` with default `'{}'::text[]`
- [ ] `hero_photo` column exists as `text` (nullable)
- [ ] Index `idx_lots_hero_photo` created
- [ ] `SELECT public.get_user_lot_id()` returns user's lot_id

**Edge cases:**
- [ ] Existing lots don't break (null photos handled)
- [ ] Migration can be reverted

**What "pass" looks like:** All 4 items verified in Supabase Studio

**What "fail" looks like:** Column creation fails — name conflict or permission

---

### Checkpoint 2: Backend Storage

**Tasks in this group:** 4, 5, 6

**What to test:**
1. Start dev server: `npm run dev`
2. Upload test file via Family settings or temp test
3. Test DELETE with authorized and unauthorized users

**What to verify:**
- [ ] New upload uses path format: `tenants/{tenant_id}/lots/{lot_id}/...`
- [ ] DELETE of owned file: succeeds (no error)
- [ ] DELETE of unowned file: returns 403

**Edge cases:**
- [ ] Legacy files readable (legacy mode policy)
- [ ] Path traversal rejected (`../../../etc/passwd`)

**What "pass" looks like:** Upload in correct storage path, authorized deletes succeed, unauthorized blocked

**What "fail" looks_like:** Wrong storage path, or unauthorized delete succeeds

---

### Checkpoint 3: PhotoManager Component

**Tasks in this group:** 7, 8

**What to test:**
1. Visit Family settings: `/t/ecovilla-san-mateo/dashboard/settings/family`
2. Check PhotoManager component renders with entityType="lot"

**What to verify:**
- [ ] entityType dropdown shows "lot" option
- [ ] Label shows "home" per getEntityLabel
- [ ] DELETE calls `/api/upload/delete?url=...`

**Edge cases:**
- [ ] Upload progress shown during upload
- [ ] Delete shows loading state

**What "pass" looks like:** PhotoManager accepts "lot" type, delete flows to API

**What "fail" looks like:** TypeScript error, or delete fails silently

---

### Checkpoint 4: UI Integration

**Tasks in this group:** 9, 10

**What to test:**
1. Upload photos in Family settings
2. Click lot marker on map to open sidepanel

**What to verify:**
- [ ] PhotoManager displays lot photos (from family associated lot)
- [ ] Map sidepanel shows lot photos when marker clicked
- [ ] Hero photo displays as primary image
- [ ] CRUD: upload → DB update persists
- [ ] CRUD: delete → removes from DB + storage

**Edge cases:**
- [ ] Empty lot shows placeholder "No photos yet"
- [ ] Large file (>10MB) rejected

**What "pass" looks like:** Full CRUD workflow succeeds

**What "fail" looks like:** Upload succeeds but DB not updated, or sidepanel empty despite DB having photos

---

## Risk Register

| Task | Risk | Reason | Rollback |
|------|------|--------|----------|
| 1. photos/hero_photo columns | MEDIUM | Schema add | `ALTER TABLE lots DROP COLUMN photos, hero_photo;` |
| 2. get_user_lot_id() | LOW | Helper | `DROP FUNCTION public.get_user_lot_id();` |
| 6. Storage RLS policy | HIGH | May conflict | Delete policy from migration |
| 4. uploadFile() path change | HIGH | Breaks existing uploads | Revert path format in code |
| 5. deleteFile() auth | MEDIUM | Auth logic | Revert route to no-auth |

**HIGH RISK mitigation:**
- Storage RLS: Use Supabase dev branch for testing before merge
- uploadFile(): Verify both legacy and new path formats work; ensure Legacy Mode policy allows old uploads to be readable

---

## Refactoring Items Included

- **Upload path missing tenant_id prefix** (`knowledge/raw/refactoring/2026-04-11_upload-tenant-isolation.md`)
  - Status: In progress — addressed by Task 4 (modify uploadFile() with tenantId parameter)
  - Effort: Medium
  - Included as part of Backend backend work

---

## Out of Scope

| Item | Reason |
|------|--------|
| Advanced gallery (zoom, slideshow) | Out of spec scope |
| Face detection | Out of spec scope |
| Bilingual support | Deferred per spec |
| Physical migration of existing files | Risk too high — "Legacy Mode" RLS handles access |
| Admin lot photo management in admin panel | May wire if time permits, but not in current tasks |

---

## Specialist Feedback Summary

**@database-architect:**
- Task 3 (RLS on lots) unnecessary — already exists
- Task 6 (Storage RLS) needs integration check with existing policies

**@backend-specialist:**
- Path format decision needed: `tenants/{tenant_id}/lots/{lot_id}/...`
- Task 5 needs scope expansion (auth check + path parsing + RLS)

**@frontend-specialist:**
- Task 9 (Family form) depends on DB columns existing first
- LocationInfoCard — just data fetch, display logic exists