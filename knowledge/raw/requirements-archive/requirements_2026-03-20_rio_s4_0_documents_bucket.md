source: requirement
imported_date: 2026-04-08
---
# Requirements: Río S4.0 — Fix `documents` Storage Bucket in Dev

**Issue**: [#233](https://github.com/mjcr88/v0-community-app-project/issues/233)
**Epic**: [#162 — Río AI Sprint 4: Admin Experience](https://github.com/mjcr88/v0-community-app-project/issues/162)
**Sprint**: Sprint 10
**Date**: 2026-03-20

---

## Context

The `documents` Supabase Storage bucket exists in **prod** (`nido.prod`) since Alpha Launch (2025-12-31) but is absent from **dev** (`nido.dev`). Dev only has the `rio-documents` bucket (created Sprint 8). This is a dev environment gap — the bucket was created manually in prod before migrations were in place.

## Problem Statement

When a tenant admin attempts to upload a PDF document in the local dev environment, the browser console shows `Bucket not found`. This blocks all document upload testing in dev. No code was ever wrong — the uploader (`document-form.tsx`, `supabase-storage-client.ts`) correctly references `"documents"`, which simply doesn't exist in the dev project.

## User Personas

- **Tenant Admin**: Cannot test document uploads in dev without this fix.
- **Developer**: Cannot QA the ingest trigger (Sprint 10 S4.2) without a working upload path.

## Dependencies

- Prerequisite for: S4.2 (Ingest trigger), S4.3 (Status badges)

## Functional Requirements

- **FR1**: The `documents` bucket must exist in `nido.dev` with matching prod configuration: `public = true`, no file size limit.
- **FR2**: Only `tenant_admin` and `super_admin` roles may upload to the bucket.
- **FR3**: All authenticated and unauthenticated users may read (public bucket).
- **FR4**: Only `tenant_admin` and `super_admin` roles may delete objects.
- **FR5**: Migration must be idempotent (safe to re-run against prod where bucket already exists).

## Technical Requirements

- **File**: `supabase/migrations/20260321000000_documents_bucket.sql`
- **Pattern**: `INSERT ... ON CONFLICT DO NOTHING` for bucket; `DO $$ ... IF NOT EXISTS` guards for policies.
- **No code changes** to `document-form.tsx` or `supabase-storage-client.ts`.

## Acceptance Criteria

- [x] AC1: Admin selects a PDF in dev — no "Bucket not found" error.
- [x] AC2: File uploads successfully; `file_url` is a publicly accessible URL.
- [x] AC3: Resident attempting upload via direct API returns 403.
- [x] AC4: Running the migration twice does not error (idempotent).

## Classification

- **Priority**: P0 (Blocker for all other Sprint 10 tasks)
- **Size**: XS (migration only, no code change)
- **Branch**: `feat/sprint-10-rio-admin`
