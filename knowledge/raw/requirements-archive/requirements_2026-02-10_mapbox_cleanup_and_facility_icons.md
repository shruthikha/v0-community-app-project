source: requirement
imported_date: 2026-04-08
---
# Requirement: Mapbox Cleanup & Facility Icons

## 1. Context
- **Objective**: Improve map performance/visuals and allow facility icon customization.
- **Current State**: 
    - Facility markers are rendered twice due to a code duplication (lines 1100-1143 and 1196-1249 in `MapboxViewer.tsx`).
    - Facility icons are hardcoded or use a default emoji.
- **Dependencies**: 
    - `MapboxViewer.tsx` (Map rendering)
    - `MapboxEditorClient.tsx` (Editor logic)
    - `FacilityFields.tsx` (Admin form)
    - `locations` table (Database)

## 2. Problem Statement
The current map implementation suffers from a copy-paste error that duplicates facility markers, causing z-fighting and rendering inefficiency. Additionally, the lack of icon customization for facilities limits the map's expressiveness, preventing admins from distinguishing between different facility types (e.g., gym vs. pool) effectively.

## 3. User Stories
- **As a System Admin**, I want to **remove duplicate code** in the map viewer so that the codebase is cleaner and markers render without z-fighting artifacts.
- **As a Community Admin**, I want to **set a custom emoji** for a facility (e.g., 🏋️ for Gym) so that residents can easily identify it on the map.
- **As a Community Admin**, I want to **upload a custom image icon** for a facility so that I can use branded or specific icons (e.g., a specific clubhouse logo) instead of generic emojis.
- **As a Resident**, I want to see **distinct icons** for different facilities on the map so that I can quickly find what I'm looking for.

## 4. Dependencies
- `app/actions/locations.ts`: Ensure `icon` field updates are handled (logic exists).
- `components/photo-manager.tsx`: Reuse for image uploads.
- `app/api/upload/route.ts`: API for handling file uploads.

## 5. Documentation Gaps
- None identified. `locations` table schema matches requirements.

---
🔁 [PHASE 1 COMPLETE] Handing off to Orchestrator...

## 6. Technical Options (Phase 2)

### Option 1: Dual Input (Text/File)
A single form field group that allows the user to either:
1.  Type/Paste an emoji character.
2.  Behave like an image upload button (reusing `photo-manager` patterns).
Logic in `FacilityFields` will determine if the input is text (emoji) or a file object (upload). `MapboxViewer` will conditionally render text or an `<img>` tag based on the content (URL check).
- **Pros**:
    - Full flexibility (emoji or custom brand logos).
    - Reuses existing backend `icon` field without schema changes.
    - Minimal new UI components needed.
- **Cons**:
    - Slightly more complex validation logic (is it a URL or text?).
    - Map rendering needs careful styling to handle both text size and image dimensions consistently.
- **Effort**: Medium (Frontend Logic)

### Option 2: Strictly Emoji Picker
Implement a dedicated emoji picker library (e.g., `emoji-picker-react`) in the Admin UI. Remove image upload capability for icons.
- **Pros**:
    - Extremely consistent visual style (all vector/text).
    - Zero file storage costs/complexity for icons.
    - Simplified mental model for admins ("Pick an icon").
- **Cons**:
    - Cannot use custom brand assets or specific logos.
    - Limited to available unicode emojis.
- **Effort**: Low (npm install + UI component)

### Option 3: Lucide Icon Library Integration
Use the existing Lucide icon set (already used in the app) and provide a picker for a subset of these icons. Store the icon name string (e.g., "dumbbell") in the DB.
- **Pros**:
    - Matches the application's design system perfectly.
    - SVG scaling is perfect.
- **Cons**:
    - Admins cannot upload *their* specific logo.
    - Limited to the set we expose.
    - Requires mapping icon names to components in `MapboxViewer`.
- **Effort**: Medium-High (Mapping logic + Picker UI)

---
🔁 [PHASE 2 COMPLETE] Handing off to Product Owner...

## 7. Recommendation (Phase 3)

### Selected Option: Option 1 (Dual Input)
We recommend **Option 1** because it directly addresses the user's request for flexibility ("simple text input or upload an image") without imposing new constraints. It leverages existing infrastructure (`photo-manager` and `icon` field) while maximizing admin freedom.

### Classification
- **Priority**: P1 (High Value, Visual Bug Fix + User Request)
- **Size**: XS (Targeted Component Updates)
- **Horizon**: Q1 26 (Immediate)

---
---
## 8. Technical Review

### Phase 0: Issue Details & Context gathering
- **Issue**: [#114](https://github.com/mjcr88/v0-community-app-project/issues/114)
- **Impact Map**:
    - `components/map/MapboxViewer.tsx`: Contains duplicate facility rendering logic (L1117-1159 and L1213-1265).
    - `components/map/form-fields/FacilityFields.tsx`: Lacks `icon` field input; needs to support dual emoji/upload.
    - `app/actions/locations.ts`: Server actions already support `icon` property.
    - `lib/data/locations.ts`: `BaseLocation` interface includes `icon: string | null`.
    - `components/photo-manager.tsx`: To be reused for icon image uploads.
    - `app/api/upload/route.ts`: Used for handling icon uploads to Supabase storage.
- **Historical Context**: Recent changes to Mapbox components have led to duplication of marker rendering logic, causing visual artifacts (z-fighting).
- **Handoff**: `🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...`

### Phase 4: Documentation Logic
- **Doc Gaps**:
    - **Visual Specs**: `map-visualization.md` lacks documentation for dynamic facility icons (fallback 🏛️ vs. custom emoji vs. image URL).
    - **Admin Manual**: No end-user guide exists for facility icon management (where to set them, recommended image dimensions).
    - **API Ref**: Internal `locations` API server actions are documented via code types, but a functional flow for handle-or-upload is missing.
- **Proposed Updates**:
    - **`map-visualization.md`**: Add "Section 5: Dynamic Iconography" detailing the fallback chain and rendering modes.
    - **`facility-management-manual.md`**: (New) Guide for community admins on customizing facility markers.
    - **`nido_patterns.md`**: Add the "Mapbox Lazy Loading" requirement to prevent further performance regressions.
- **Handoff**: `🔁 [PHASE 4 COMPLETE] Handing off to PM/Orchestrator for Final Alignment...`

### Phase 5: Strategic Alignment & Decision
- **Final Specification**:
    - **Goal**: Resolve "Mapbox Cleanup & Facility Icons" by unifying rendering logic and enabling custom iconography.
    - **Decision**: Approve "Dual Input" approach (Text/Emoji or File Upload).
    - **Performance Requirement**: Implementation must include refactoring to lazy-load `MapboxViewer` to fix existing bundle bloat.
    - **Security Requirement**: Role-based access for icon updates must be strictly enforced via server actions.
- **Priority**: P1 (Scheduled for immediate pick-up in Q1 26).
- **Status**: `🚀 [READY FOR DEVELOPMENT]`

---
**Review Flow State**: `[REVIEW CYCLE COMPLETE]`

### Phase 1: Vibe & Security Audit
- **Vibe Check**:
    - **Backend-First**: Server actions (`createLocation`, `updateLocation`) correctly enforce role checks (`is_tenant_admin` or `super_admin`) and tenant isolation.
    - **Zero Policy RLS**: Database policies for `locations` are assumed to be enabled; however, server-side validation acts as the primary gate.
- **Attack Surface**:
    - **Icon Uploads**: Reuses `app/api/upload/route.ts` which implements MIME type validation for images.
    - **Icon Rendering (XSS)**: `MapboxViewer.tsx` must ensure that the `icon` string is rendered safely. React's default escaping protects against basic XSS. For image URLs, a regex check is recommended to ensure they point to valid image formats/trusted domains.
    - **Storage Exhaustion**: Uploads are restricted to 10MB per file.
- **Handoff**: `🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...`

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Malformed URL**: Storing a non-image URL in the `icon` field. Result: Map marker should fallback to default icon ('🏛️').
    - **Invalid Emoji**: Inputting multi-character text in an emoji-only context.
    - **Upload Failure**: Handling 500 errors or timeouts during icon upload gracefully with user-facing toasts.
    - **Concurrent Edits**: Race conditions where two admins update the same facility icon. Overwrite is acceptable, but notification is better.
- **Verification Plan**:
    - **Unit Tests**:
        - Verify `MapboxViewer` icon rendering logic (branching between `text` and `img`).
        - Validate `FacilityFields` input handling for both text and file objects.
    - **Integration Tests**:
        - `POST /api/upload`: Validate file size (<10MB) and MIME type filtering.
    - **E2E Tests (Playwright)**:
        - Admin Flow: Map Editor -> Select Facility -> Update Icon (Emoji) -> Confirm map update.
        - Admin Flow: Map Editor -> Select Facility -> Upload Image -> Confirm map update.
- **Handoff**: `🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...`
