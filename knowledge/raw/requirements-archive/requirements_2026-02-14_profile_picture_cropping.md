source: requirement
imported_date: 2026-04-08
---
# Profile Picture Cropping

## Problem Statement
Users currently upload profile pictures and banners directly without the ability to crop or adjust the framing. This often results in poorly centered or cut-off avatars, especially given the circular display format of user profiles. This leads to a suboptimal visual experience and user frustration.

## User Persona
- **New User**: Uploading their first profile picture during the onboarding flow.
- **Existing User**: Updating their profile picture or banner from the profile settings page.

## Context
The goal is to introduce a cropping step immediately after a file is selected but before it is permanently saved or displayed.
- **Interaction**: Modal (Dialog) appears with the selected image.
- **Capabilities**: Pan and Zoom (pinch/scroll).
- **Constraints**:
  - Profile Picture: Locked 1:1 aspect ratio with a circular mask preview.
  - Banner: (Optional scope: maintain current behavior or add generic cropping. Primary focus is Profile Picture).
- **Tech Stack**:
  - `react-easy-crop` for the UI logic.
  - Browser `Canvas` API for generating the cropped image blob.
  - `radix-ui/react-dialog` for the modal carrier.

## Dependencies
- **Libraries**: Need to add `react-easy-crop`.
- **Components**:
  - `IdentityStep` (Onboarding)
  - `EditableProfileBanner` (Settings)
  - `ProfileEditForm`
- **API**: Existing `/api/upload` endpoint can be reused; it just receives a different Blob (the cropped one).

## Documentation Gaps
- None identified. `IdentityStep` and `EditableProfileBanner` are well-understood.

## Issue Context
- **Related Issues**: None found directly blocking.
- **Similar Features**: Check-in image uploads (no cropping there either).

## Technical Options

### Option 1: Client-Side Cropping (Recommended)
Use `react-easy-crop` to allow the user to define the crop area. Generate the cropped image on the client using the browser's `Canvas` API and upload *only* the cropped blob.
- **Pros**:
  - **Bandwidth Efficient**: Only the final, optimized image is uploaded.
  - **Privacy**: Uncropped parts of the image never leave the user's device.
  - **Performance**: No server-side processing required.
  - **UX**: What you see is exactly what you get.
- **Cons**:
  - Requires adding a dependency (`react-easy-crop`).
  - Slight client-side processing overhead (negligible for avatars).
- **Effort**: Medium (Create `ImageCropper` component + `canvas-utils`).

### Option 2: Server-Side Cropping
Upload the original full-size image along with crop coordinates (x, y, width, height). Use a server-side library (like `sharp` in an Edge Function) or Supabase Storage Image Transformations to generate the avatar.
- **Pros**:
  - Non-destructive (original image preserved).
  - Client logic is strictly UI (no canvas manipulation).
- **Cons**:
  - **Bandwidth**: User uploads full 5MB+ raw photos for a 100KB avatar.
  - **Complexity**: Requires new API endpoint or Edge Function.
  - **Storage**: Higher storage costs.
- **Effort**: High (Backend logic + API updates).

### Option 3: CSS Masking (No Physical Crop)
Upload the full image and save crop coordinates as metadata. Apply these coordinates using CSS `object-position` and `transform` whenever the avatar is displayed.
- **Pros**:
  - Fastest implementation code-wise.
  - Non-destructive.
- **Cons**:
  - **Bandwidth**: Clients download full-size images just to show a thumbnail.
  - **Inconsistency**: Hard to use in contexts without CSS (e.g., emails, OpenGraph tags).
  - **Performance**: significant layout shift/paint cost on frontend.
- **Effort**: Low (Metadata storage).

## Recommendation

### Strategy: Option 1 (Client-Side Cropping)
This approach offers the best balance of user experience and implementation effort. By handling the crop on the client, we avoid the complexity of server-side image manipulation and reduce bandwidth usage. `react-easy-crop` is a mature, lightweight library that perfectly fits our need for a 1:1 circular crop.

### Implementation Plan
1.  Install `react-easy-crop`.
2.  Create a reusable `<ImageCropper>` component.
3.  Integrate into `IdentityStep` (Onboarding) and `EditableProfileBanner` (Settings).
4.  Ensure mobile responsiveness (touch support is built-in to the library).

### Metadata
- **Priority**: P2 
- **Size**: S 
- **Horizon**: Q1 26

## 8. Technical Review

### Phase 0: Issue Details
- **Issue**: #115 [Brainstorm] Profile Picture Cropping
- **Goal**: Implement client-side cropping using `react-easy-crop`.

### Phase 0: Impact Map
- **Components**:
  - `components/onboarding/steps/identity-step.tsx` (Onboarding profile photo)
  - `components/profile/editable-profile-banner.tsx` (Profile settings photo/banner)
- **Shared Logic**:
  - Need a new shared component `components/ui/image-cropper.tsx` (proposed).
  - Need `lib/utils/canvas-utils.ts` for browser-based cropping.

### Phase 0: Historical Context
- `identity-step.tsx`: Recently updated to improve onboarding flow.
- `editable-profile-banner.tsx`: Updated to support multi-tenant banner/profile management.
- No direct regressions found in recent commits related to upload logic; the direct upload is the standard pattern currently.

🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...
### Phase 1: Security Audit
- **Vibe Check**:
  - **Security Concern**: `/api/upload` endpoint lacks explicit user session validation.
  - **RLS Status**: Buckets `photos` and `documents` use `createClient()` (server-side anon client with cookies). If cookies are missing/invalid, it still proceeds.
- **Attack Surface**:
  - **Risk**: Unauthorized users can upload files if not caught by middleware.
  - **Hidden Vector**: `react-easy-crop` sends a `Blob`. Malicious users could bypass the UI to send large non-images directly to `/api/upload`.
- **Remediation**:
  - Add session check in `app/api/upload/route.ts`.
  - Ensure `lib/upload-security.ts` continues to enforce strict MIME types for images.

### Phase 2: Test Strategy
- **Sad Paths**:
  - **Cancellation**: Verify that closing the cropper modal without saving does not trigger an upload.
  - **Large Files**: Verify 5MB limit is enforced client-side before cropper initialization.
  - **Upload Errors**: Verify "Upload failed" toast is shown if `/api/upload` returns 500 post-crop.
  - **Invalid Images**: Verify handling of corrupted image files that fail to load in `react-easy-crop`.
- **Test Plan**:
  - **Unit Tests**: Test `getCroppedImg` utility in `lib/utils/canvas-utils.ts` using Vitest.
  - **Integration Tests**: Verify `ImageCropper` modal lifecycle (Open -> Crop -> Save).
  - **E2E Tests**:
    - **Flow A**: Onboarding `IdentityStep` image upload and crop.
    - **Flow B**: Profile `EditableProfileBanner` banner and avatar crop.

### Phase 3: Performance Assessment
- **Bandwidth Optimization**: Client-side cropping reduces upload payload from potentially 5MB+ to ~100-200KB for avatars.
- **Bundle Size**: `react-easy-crop` adds ~15KB gzip. This is a reasonable trade-off for the UX improvement.
- **Processing**: Browser Canvas API is efficient for the required 1:1 and banner aspect ratios.
- **Storage Profile**: Smaller average file size helps reduce Supabase Storage consumption over time.

### Phase 4: Documentation Logic
- **User Manuals**:
  - Update `docs/01-manuals/resident-guide/profile-setup.md` to include instructions on the new cropping step.
- **Technical Docs**:
  - **Schema**: Update `docs/02-technical/schema/tables/users.md` to clarify that `profile_picture_url` and `banner_image_url` are now sourced from client-side cropped blobs.
  - **API**: Document the security hardening for `/api/upload` in `docs/02-technical/api/api-reference.md`.
  - **Shared Components**: Add documentation for the new `<ImageCropper />` component in the component library docs (or equivalent).
- **Gaps Logged**:
  - Added entry for missing `ImageCropper` component documentation in `docs/documentation_gaps.md`.

### Phase 5: Strategic Alignment & Decision
- **Sprint Sizing**: S (Small)
- **Decision**: Recommended for immediate prioritization.
- **Definition of Done**:
  - [ ] Reusable `<ImageCropper />` component created.
  - [ ] `IdentityStep` (Onboarding) integrated with cropper.
  - [ ] `EditableProfileBanner` (Settings) integrated with cropper.
  - [ ] Multi-tenant isolation verified (user can only crop/upload their own photos).
  - [ ] `/api/upload` hardened with session check.
  - [ ] Mobile responsive behavior verified (touch interaction).
  - [ ] Unit tests for canvas utility pass.

✅ [REVIEW COMPLETE] Issue #115 is now Ready for Development.
