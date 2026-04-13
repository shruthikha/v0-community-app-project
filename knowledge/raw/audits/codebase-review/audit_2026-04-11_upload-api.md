# Audit: Upload API (app/api/upload)

**Date**: 2026-04-11
**Type**: Module
**Focus**: Security, Performance, Code quality, Understanding
**Scope**: app/api/upload/**

---

## Context

This audit examines the file upload module at `app/api/upload/`, which provides two API routes:
- `POST /api/upload` — Uploads files to Supabase Storage
- `DELETE /api/upload/delete` — Deletes files from Supabase Storage

This module is called by 8+ client components across the application (photo-manager, onboarding, profile, family management, neighborhoods, transactions). It is a **high-value attack surface** — file uploads are a common vector for malicious payloads, storage abuse, and unauthorized data access.

The retro coverage analysis (`retro_2026-04-11_audit-coverage-gaps.md`) explicitly flagged this module as a **HIGH GAP** — it was identified as unaudited in the prior audit sweep.

---

## Prior Work

### Wiki Patterns (Relevant)
- **Wiki reference:** `knowledge/wiki/lessons/supabase-storage-rls.md` — Storage bucket policies, tenant folder isolation patterns
- **Wiki reference:** `knowledge/wiki/patterns/supabase-multi-tenancy.md` — Tenant isolation via `tenant_id`, storage path-prefixing
- **Wiki reference:** `knowledge/wiki/tools/supabase-security-checklist.md` — Storage access matching bucket sensitivity
- **Wiki reference:** `knowledge/wiki/documentation-gaps.md` — Notes missing `patterns/file-upload-security.md` wiki entry

### Existing Audits
- `audit_2026-04-11_components_module.md` — Flagged "No server-side file type validation" but deferred to this audit
- `audit_2026-04-11_api_crosscutting.md` — Listed `/api/upload/` in non-v1 routes inventory but did not analyze it
- `retro_2026-04-11_audit-coverage-gaps.md` — Explicitly called out upload endpoint as unaudited (Section 3, "MEDIUM GAP")

### Requirements Context
- `requirements_2026-02-14_profile_picture_cropping.md` — Noted `/api/upload` "lacks explicit user session validation" as a security concern during profile cropping work
- `requirements_2026-02-10_mapbox_cleanup_and_facility_icons.md` — Referenced MIME type validation for images at this endpoint

### Gap Status
- **No wiki entry exists** for `patterns/file-upload-security.md` (listed as gap in `documentation-gaps.md:30`)
- **No wiki entry exists** for `lessons/storage-bucket-least-privilege.md` (listed as gap in `documentation-gaps.md:22`)

---

## Findings

### Critical

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| C1 | **No authentication check on POST /api/upload** | `app/api/upload/route.ts` | Add session verification via `createClient()` + `getUser()` before processing upload. Any unauthenticated request can upload files. |
| C2 | **No authentication check on DELETE /api/upload/delete** | `app/api/upload/delete/route.ts` | Add session verification before allowing deletion. Any unauthenticated request can delete any file. |
| C3 | **No tenant isolation on upload path** | `lib/supabase-storage.ts:19-20` | Upload path is `year/month/uuid-filename` — missing `tenant_id` prefix. RLS policies require first folder to be `tenant_id`. Uploads may fail RLS or land in wrong tenant scope. |
| C4 | **Photos bucket has no creation migration** | `supabase/migrations/` | RLS policies reference `bucket_id = 'photos'` but no migration creates the bucket. If bucket doesn't exist, all photo uploads fail silently or with confusing errors. |

### High

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| H1 | **No rate limiting on upload endpoints** | `app/api/upload/route.ts` | Add `withPublicRateLimit` or similar middleware. Without it, an attacker can flood storage with files (cost abuse, DoS). |
| H2 | **MIME type validation relies solely on client-provided `file.type`** | `lib/upload-security.ts:16` | `file.type` is set by the browser and easily spoofed. Add magic byte / file signature validation (e.g., check JPEG magic bytes `FFD8FF`). |
| H3 | **DELETE endpoint has zero callers — dead code** | `app/api/upload/delete/route.ts` | No component calls `/api/upload/delete`. The `photo-manager.tsx` removes photos client-side only (doesn't call delete API). Either wire it up or remove the endpoint to reduce attack surface. |
| H4 | **`deleteFile` bucket inference is fragile** | `lib/supabase-storage.ts:57-65` | Extracts bucket name from URL by parsing `/public/${bucket}/`. If URL format changes or bucket name contains special characters, deletion targets wrong bucket. |
| H5 | **No file size limit on `photos` bucket at database level** | `supabase/migrations/` | The `documents` bucket has `file_size_limit` set, but no migration creates/configures the `photos` bucket. Application-level 10MB check exists but is bypassable if endpoint is called directly. |

### Medium

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| M1 | **No Zod validation — manual checks only** | `app/api/upload/route.ts:14-35` | Use Zod schema for file validation. Consistent with codebase pattern (`patterns/zod-validation.md`). |
| M2 | **`error: any` type in catch blocks** | `app/api/upload/route.ts:45`, `app/api/upload/delete/route.ts:18` | Violates codebase `any` prohibition. Use `error instanceof Error` pattern. |
| M3 | **Error messages may leak internal details** | `app/api/upload/route.ts:47` | `error.message` is returned directly to client. Supabase errors may contain internal paths, bucket names, or SQL details. |
| M4 | **No test coverage** | — | Zero unit tests, zero E2E tests for upload routes. The `geojson-upload.spec.ts` E2E test exists but tests the GeoJSON upload button component, not the API route directly. |
| M5 | **`console.error` with potentially sensitive data** | `lib/supabase-storage.ts:31`, `app/api/upload/route.ts:46` | Logs full error objects which may contain file paths, user data, or internal Supabase details. |
| M6 | **No Content-Type validation on DELETE request** | `app/api/upload/delete/route.ts` | Accepts URL as query parameter. No validation that the URL belongs to the authenticated user's tenant. |

### Low

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| L1 | **TODO comment left in production code** | `app/api/upload/route.ts:18` | `// TODO: Pass type preference from client if needed.` — Resolve or remove. |
| L2 | **Hardcoded bucket strings** | `app/api/upload/route.ts:40`, `lib/supabase-storage.ts:12` | `"photos"` and `"documents"` are hardcoded in multiple places. Consider a constant or enum. |
| L3 | **Buffers entire FormData in memory** | `app/api/upload/route.ts:6` | `await request.formData()` buffers the full request body. For large files near the 10MB limit, this consumes significant server memory. Consider streaming for future scalability. |
| L4 | **No Content-Disposition or filename validation on upload** | `lib/supabase-storage.ts:15` | `sanitizeFilename` removes path components and special chars but doesn't validate length. Extremely long filenames could cause issues. |
| L5 | **Inconsistent bucket selection logic** | `app/api/upload/route.ts:40` | Bucket is inferred from MIME type (`isDoc ? "documents" : "photos"`). This is fragile — a PDF uploaded via the photo manager would go to `documents` bucket unexpectedly. |

---

## Understanding Mapping

### Components

```
app/api/upload/
├── route.ts          # POST handler — file upload
└── delete/
    └── route.ts      # DELETE handler — file deletion

lib/
├── upload-security.ts    # validateFileType, validateFileSize, sanitizeFilename
├── supabase-storage.ts   # uploadFile(), deleteFile() — server-side (uses createClient)
└── supabase-storage-client.ts  # uploadFileClient() — client-side (uses createClient client)
```

### Entry Points

| Route | Method | Purpose | Auth | Rate Limit |
|-------|--------|---------|------|------------|
| `/api/upload` | POST | Upload file to Supabase Storage | ❌ None | ❌ None |
| `/api/upload/delete` | DELETE | Delete file from Supabase Storage | ❌ None | ❌ None |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  Client Component (photo-manager, identity-step, etc.)             │
│  - Creates FormData with "file" field                              │
│  - fetch("POST /api/upload", { body: formData })                   │
└────────────────────────────────┬────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  POST /api/upload (route.ts)                                       │
│  1. Parse FormData → extract file                                  │
│  2. Dynamic import: validateFileType, validateFileSize             │
│  3. Check file.type against ALLOWED_FILE_TYPES                     │
│  4. Check file.size <= 10MB                                        │
│  5. Infer bucket: isDoc ? "documents" : "photos"                   │
│  6. Call uploadFile(file, bucket)                                  │
│  7. Return { url, pathname, contentType }                          │
└────────────────────────────────┬────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  uploadFile() (lib/supabase-storage.ts)                            │
│  1. createClient() — SSR Supabase client (uses cookies)            │
│  2. sanitizeFilename(file.name)                                    │
│  3. Generate path: year/month/uuid-filename                        │
│  4. supabase.storage.from(bucket).upload(path, file)               │
│  5. Get public URL                                                 │
│  6. Return { url, pathname, contentType }                          │
└────────────────────────────────┬────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Supabase Storage RLS                                              │
│  - Photos bucket: Admin INSERT/ALL policies (tenant_id isolation)  │
│  - Documents bucket: Admin INSERT/DELETE/UPDATE policies           │
│  ⚠️  Upload path does NOT include tenant_id prefix                 │
│  ⚠️  RLS policies check (storage.foldername(name))[1] == tenant_id │
│  ⚠️  This means uploads may be REJECTED by RLS                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Delete Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  DELETE /api/upload/delete?url=<public-url>                        │
│  1. Extract URL from query params                                  │
│  2. Call deleteFile(url) — defaults to "photos" bucket             │
│  3. deleteFile() parses URL to extract path                        │
│  4. supabase.storage.from(bucket).remove([path])                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Dependencies

**Imports (what this module depends on):**
| Module | Purpose |
|--------|---------|
| `@/lib/supabase-storage` | `uploadFile()`, `deleteFile()` |
| `@/lib/upload-security` | `validateFileType()`, `validateFileSize()`, `sanitizeFilename()` |
| `@/lib/supabase/server` | `createClient()` — SSR Supabase client |
| `uuid` | `v4 as uuidv4` — unique filename generation |
| `next/server` | `NextResponse` |

**Dependents (what calls this module):**
| Caller | Context |
|--------|---------|
| `components/photo-manager.tsx` | Bulk photo uploads for locations, families, etc. |
| `components/onboarding/steps/identity-step.tsx` | Profile picture during onboarding |
| `components/onboarding/steps/household-step.tsx` | Household member photos |
| `components/profile/editable-profile-banner.tsx` | Profile banner image |
| `components/transactions/mark-returned-dialog.tsx` | Return proof image |
| `app/t/[slug]/onboarding/profile/profile-form.tsx` | Profile photo upload |
| `app/t/[slug]/dashboard/settings/family/family-management-form.tsx` | Family photo management |
| `app/t/[slug]/admin/neighborhoods/create/create-neighborhood-form.tsx` | Neighborhood image |
| `components/_deprecated/onboarding/steps/keys-step.tsx` | Deprecated — still references endpoint |

### Patterns Used

| Pattern | Status | Notes |
|---------|--------|-------|
| Dynamic import for validation | ⚠️ Partial | `await import("@/lib/upload-security")` — lazy loaded but not necessary |
| MIME type whitelist | ✅ Present | `ALLOWED_FILE_TYPES` covers images, documents, spreadsheets |
| File size limit | ✅ Present | 10MB hardcoded |
| Filename sanitization | ✅ Present | Removes path components, strips special chars |
| UUID-based filenames | ✅ Present | Prevents filename collisions |
| Auth verification | ❌ Missing | No session check |
| Rate limiting | ❌ Missing | No abuse prevention |
| Tenant isolation | ❌ Missing | Upload path lacks `tenant_id` prefix |
| Zod validation | ❌ Missing | Manual validation only |
| Error handling | ⚠️ Partial | Try/catch exists but leaks error details |

---

## Recommendations

### Immediate (This Sprint) — 🔴 Critical

- [ ] **C1: Add authentication to POST /api/upload** — Call `createClient()` then `getUser()`. Reject unauthenticated requests with 401.
- [ ] **C2: Add authentication to DELETE /api/upload/delete** — Same as above.
- [ ] **C3: Add tenant_id to upload path** — Change path from `year/month/uuid-filename` to `tenant_id/year/month/uuid-filename`. Extract tenant_id from user's JWT or DB record. This is required for RLS policies to work correctly.
- [ ] **C4: Create photos bucket migration** — Add migration to create the `photos` bucket with appropriate config (public, file_size_limit, allowed_mime_types).

### Short-term (Next Sprint) — 🟡 High

- [ ] **H1: Add rate limiting** — Use `withPublicRateLimit` pattern from `lib/api/public-rate-limit.ts`. Suggest 20 uploads per minute per user.
- [ ] **H2: Add magic byte validation** — Check file signatures (JPEG: `FFD8FF`, PNG: `89504E47`, etc.) in addition to MIME type. Use a library like `file-type` or implement header checks.
- [ ] **H3: Resolve dead delete endpoint** — Either wire up `photo-manager.tsx` to call `/api/upload/delete` when removing photos, or remove the endpoint entirely.
- [ ] **H4: Fix bucket inference in deleteFile** — Make bucket an explicit parameter or parse more robustly.
- [ ] **H5: Add database-level file size limit on photos bucket** — Set `file_size_limit` in bucket creation migration.

### Medium-term (Backlog) — 🟡 Medium

- [ ] **M1: Add Zod validation** — Create Zod schema for file upload validation.
- [ ] **M2: Fix `any` types** — Use proper error typing in catch blocks.
- [ ] **M3: Sanitize error responses** — Return generic error messages to client, log details server-side only.
- [ ] **M4: Add test coverage** — Unit tests for upload-security.ts, integration tests for both routes.
- [ ] **M5: Redact sensitive data from logs** — Remove or hash file paths, user identifiers from error logs.
- [ ] **M6: Add tenant ownership check on delete** — Verify the file being deleted belongs to the authenticated user's tenant.

### Nice to Have — 💭 Low

- [ ] **L1: Resolve TODO comment** — Either implement type preference flag or remove.
- [ ] **L2: Extract bucket constants** — Create `BUCKET_NAMES` enum.
- [ ] **L3: Consider streaming uploads** — For future large file support.
- [ ] **L4: Add filename length validation** — Prevent extremely long filenames.
- [ ] **L5: Make bucket selection explicit** — Accept bucket as FormData field rather than inferring from MIME type.

---

## Security Posture Summary

| Control | Status | Risk |
|---------|--------|------|
| Authentication | ❌ Missing | 🔴 Critical |
| Authorization (tenant isolation) | ❌ Missing | 🔴 Critical |
| Rate limiting | ❌ Missing | 🟡 High |
| File type validation | ⚠️ Partial (MIME only) | 🟡 High |
| File size validation | ✅ Application-level only | 🟡 Medium |
| Filename sanitization | ✅ Present | ✅ OK |
| Path traversal prevention | ✅ Present (sanitizeFilename) | ✅ OK |
| Error handling | ⚠️ Leaks details | 🟡 Medium |
| Test coverage | ❌ None | 🟡 Medium |

---

*Audit completed: 2026-04-11*
*Next audit recommended: After critical fixes applied*
