---
source: prd
imported_date: 2026-04-08
---
# PRD: Sprint 1 - Security Polish & Infra
**Date:** 2026-02-02
**Status:** DRAFT
**Sprint Goal:** Secure the application foundation (Auth & Data) and establish a safe development environment to prevent production regressions.

## Selected Issues (Sprint Scope)

| Issue | Priority | Size | Est. Hours | Risk | Title |
|-------|----------|------|------------|------|-------|
| #76 | **P0** | **M** | 1-2d | HIGH | [Infra] Supabase DEV Environment |
| #75 | **P0** | **S** | 4-8h | HIGH | [Security] PII Leak Prevention |
| #77 | **P0** | **M** | 1-2d | HIGH | [Security] Automatic Logout / Session Timeout **[RELEASED]** |
| #63 | **P0** | **M** | 1-2d | MED | [Bug/Feat] Series RSVP Fix & Feature ([PR #92](https://github.com/mjcr88/v0-community-app-project/pull/92)) **[RELEASED]** |
| #83 | **P0** | **M** | 1-2d | MED | [Feat] GeoJSON Reliability & Map Color |
| #86 | **P1** | **S** | 4-8h | LOW | [Feat] User Location Beacon |
| #93 | **P1** | **S** | 4-8h | LOW | [Feat] Mobile Series RSVP UI |
| #72 | **P1** | **M** | 1-2d | MED | [Feat] Admin Family Selection Improvement |

---

## Architecture & Git Strategy

### 1. Repository & Branching Strategy
*   **Repository:** `mjcr88/v0-community-app-project`
*   **Base Branch:** `main` (Production)
*   **Feature Branches:** Create `feat/<issue-number>-<short-slug>` for each ticket.
    *   Example: `feat/76-supabase-dev-env`
*   **Merge Strategy:** Squash & Merge via Pull Request.

### 2. CI/CD & Environment
*   **Build System:** Next.js (`npm run build`).
*   **Linting:** Native ESLint (`npm run lint`).
*   **Deployments:** Vercel (Auto-deploy on merge to `main`).
*   **Critical Env Vars:**
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   *Note: Issue #76 will introduce strict DEV vs PROD env var separation.*

### 3. Dependency Map
*   **[Critical Path] Issue #76 (Supabase Dev Env):** MUST be completed first. It establishes the `v0-dev` project.
    *   *Impact:* Issues #77 and #75 need this safe environment to test Auth/RLS changes without risking Production data.
*   **Issue #77 (Auto Logout):** Requires `middleware.ts` updates.
*   **Issue #75 (PII Leak):** Requires Refactoring `page.tsx` data fetching patterns.
*   **Issue #83 (GeoJSON):**
    *   Requires `locations` table schema migration (add `color` column).
    *   Dependent on Issue #76 (Supabase Dev Env) for safe migration testing.
*   **Issue #63 (Series RSVP & Priority Feed):**
    *   **Part A (Series):** Logic exists in `actions/events.ts`, needs granular `scope` handling.
    *   **Part B (Feed):** Requires strict DB filtering on `event_rsvps` and `saved_events` to reduce noise.
    *   **Dependencies:** None (independent of other tickets, but affects Dashboard).
*   **Issue #86 (Location Beacon):**
    *   **Contextual Dependency:** Works best after #83 (keeps map updates grouped), but technically independent.
    *   Client-side only (no DB changes).
*   **Issue #93 (Mobile Series RSVP UI):**
    *   **Contextual Dependency:** Follows #63 (Series RSVP Logic).
    *   **Tech Stack:** `vaul` (Drawer), `radix-ui` (Dialog).
    *   **Impact:** Refactors `EventRsvpQuickAction` and `EventRsvpSection`.

---

## Implementation Plan
> *To be detailed in Phase 3*

### 1. [Infra] Supabase DEV Environment (#76)
*   **Owner:** `devops-engineer`
*   **Worklog:** [log_2026-02-03_supabase-dev-env.md](../../04_logs/log_2026-02-03_supabase-dev-env.md)
*   **Goal:** Configure existing project to separate Dev and Prod data.
*   **Implementation Steps:**
    1.  **Configure Existing Project:** Link local dev to project `ehovmoszgwchjtozsfjw` (v0-community-dev).
    2.  **Update `env` management:**
        *   Create `.env.local` (Gitignored) -> Point to `ehovmoszgwchjtozsfjw` keys.
        *   Create `.env.production` (Vercel) -> Point to PROD keys.
    3.  **Run Migrations:** Sync `ehovmoszgwchjtozsfjw` DB with Prod Schema.
*   **Acceptance Criteria:**
    - [x] Localhost connects to `v0-community-dev`.
    - [-] Vercel Preview deployments connect to `v0-community-dev`. (Skipped: Local-only workflow)
    - [x] Vercel Production connects to `v0-community-prod`. (Implicit)

### 2. [Security] PII Leak Prevention (#75)
*   **Owner:** `frontend-specialist` (Security Focus)
*   **Goal:** Stop sending raw user rows to the client in the Neighbors directory.
*   **Implementation Steps:**
    1.  Refactor `app/t/[slug]/dashboard/neighbours/page.tsx`.
    2.  Create a Data Transformation Object (DTO) / helper function `transformNeighbor(user)` that whitelist only public fields (id, name, avatar, unit).
    3.  Ensure `email`, `phone`, and `created_at` are NOT in the return object passed to the client component.
*   **Acceptance Criteria:**
    - [ ] Inspect Network Tab: Response for Neighbors request does NOT contain 'email'.
    - [ ] UI still renders names and units correctly.

### 3. [Security] Automatic Logout (#77)
*   **Owner:** `backend-specialist`
*   **Goal:** Force re-auth after 2 hours of inactivity unless "Remember Me" is checked.
*   **Implementation Steps:**
    1.  **Frontend:** Add "Remember Me" checkbox to Login Form (`app/login/page.tsx`).
    2.  **Auth Logic:**
        *   **Standard (Remember Me = TRUE):** Use default `localStorage` persistence. Session survives browser restart.
        *   **Strict (Remember Me = FALSE):** Use `sessionStorage` (cleared on tab close) OR set aggressive 2h idle timer.
    3.  **Middleware:** Ensure consistent session validation.
*   **Acceptance Criteria:**
    - [x] User logged in WITHOUT "Remember Me" is logged out after 2h idle.
    - [x] User logged in WITH "Remember Me" stays logged in after window close.

### 4. [Bug/Feat] Series RSVP & Priority Feed (#63)
*   **Owner:** `backend-specialist`
*   **Goal:** (A) Fix Series RSVP buttons & "Reply All" feature. (B) Reduce Priority Feed noise.
*   **Implementation Steps:**
    1.  **Part A: Series RSVP (Bug/Feature)**
        *   **Backend:** Update `app/actions/events.ts` to handle `scope="series"`. Propagate `requires_rsvp` to children.
        *   **Frontend:** Update `EventRsvpQuickAction.tsx` with "This Event Only" vs "All Future Events" toggle/modal.
    2.  **Part B: Priority Feed (Noise Reduction)**
        *   **API:** Refactor `app/api/dashboard/priority/route.ts`.
        *   **Logic:** Switch from "Fetch All -> Filter" to "Fetch Relevant Only".
        *   **Query:** Select events where:
            *   `start_date` is `NOW` to `NOW + 7 days`.
            *   AND (`user` has RSVP 'yes'/'maybe' OR `user` has Saved the event).
*   **Acceptance Criteria:**
    - [x] "RSVP All" adds user to all future instances of the series.
    - [x] "RSVP One" adds user only to that specific date.
    - [x] **Priority Feed:** Events WITHOUT RSVP/Save do NOT appear in the feed.
    - [x] **Priority Feed:** Events WITH RSVP 'yes' within 7 days DO appear.
    - [x] **Priority Feed:** No N+1 query performance issues.

### 5. [Feat] GeoJSON Reliability & Map Color (#83)
*   **Owner:** `frontend-specialist` (Full Stack usage)
*   **Worklog:** [log_2026-02-05_geojson_upload.md](../../04_logs/log_2026-02-05_geojson_upload.md)
*   **Goal:** reliable GeoJSON imports and map customization.
*   **Implementation Steps:**
    1.  **Database:** Add `color` column to `locations` table (Migration).
    2.  **Parser Fix:** Patch `lib/geojson-parser.ts` to preserve Z-coords and fix multi-segment merging.
    3.  **UI - Upload:** Update `GeoJSONUploadDialog` with color picker.
    4.  **UI - Editor:** Update `MapboxEditorClient` to edit/persist `color`.
    5.  **UI - Map:** Update `MapboxViewer` to render using `['get', 'color']`.
    6.  **UX:** Add "Trail Details" (difficulty, surface, elevation) to `ResidentMapClient` sidebar.
*   **Acceptance Criteria:**
    - [x] GeoJSON upload preserves Altitude (Z-axis).
    - [x] Separate LineStrings are NOT merged into Polygons.
    - [x] Can set a default color during GeoJSON import.
    - [x] Can edit the color of an existing location.
    - [x] Map reflects the custom colors.
    - [x] Walking Path metadata (surface, difficulty) appears in Resident sidebar.

### 6. [Feat] User Location Beacon (#86)
*   **Owner:** `mobile-developer` / `frontend-specialist`
*   **Goal:** Show live "Blue Dot" for user location on map.
*   **Implementation Steps:**
    1.  Create `useGeolocation` hook (wraps `navigator.geolocation`).
    2.  Update `MapboxViewer` to render User Marker.
    3.  Wire up "Find Me" button to fly to user location.
*   **Acceptance Criteria:**
    - [x] "Blue Dot" appears when permission granted.
    - [x] "Find Me" button centers map on user.
    - [x] Map does NOT auto-center if user pans away.
    - [x] Permission denied state handled gracefully.
*   **Links:**
    *   [Worklog](../../04_logs/log_2026-02-06_issue_86_user_location_beacon.md)
    *   [Walkthrough](../../../../.gemini/antigravity/brain/1ce3f1b6-f7e7-4f46-9b36-1059df9ea2d5/walkthrough.md)

### 7. [Feat] Mobile Series RSVP UI (#93)
*   **Owner:** `frontend-specialist`
*   **Goal:** Provide a responsive RSVP experience for series events (Dialog on Desktop, Drawer on Mobile).
*   **Implementation Steps:**
    1.  Create `components/ui/drawer.tsx` (using `vaul`).
    2.  Create `components/ui/responsive-dialog.tsx` (wrapper).
    3.  Refactor `EventRsvpQuickAction.tsx` and `EventRsvpSection.tsx` to use `ResponsiveDialog`.
*   **Acceptance Criteria:**
    - [ ] Desktop shows Center Modal for Series RSVP.
    - [ ] Mobile shows Bottom Sheet (Drawer) for Series RSVP.
    - [ ] "Just this event" and "This and future" options work in both views.
*   **Links:**
    *   [Requirements](../02_requirements/requirements_2026-02-07_mobile_series_rsvp.md)

---

## Definition of Done
- [ ] Code passes `npm run lint` & `npx tsc --noEmit`
- [ ] PR reviewed by at least 1 team member
- [ ] Manual QA verification completed per ACs
- [ ] No new P0 bugs introduced
- [ ] Documentation updated (if applicable)

## Sprint Schedule
**Sprint Start:** Feb 9, 2026 (Monday) [Revised]
**Sprint End:** Feb 13, 2026 (Friday)

| Issue | Title | Est. Duration | Start Date | Target Date | Owner | Dependencies |
|-------|-------|---------------|------------|-------------|-------|--------------|
| #77 | **Auto Logout** | 2 Days | **Feb 9** | **Feb 10** | Backend | #83 (Wait) |
| #83 | **GeoJSON & Color** | 2 Days | **Feb 9** | **Feb 10** | Frontend | #76 (Env) |
| #63 | **Series RSVP & Feed** | 2 Days | **Feb 11** | **Feb 12** | Backend | None |
| #75 | **PII Leak Prevention** | 1 Day | **Feb 11** | **Feb 11** | Frontend | #83 |
| #86 | **Location Beacon** | 1 Day | **Feb 12** | **Feb 12** | Mobile | #83 |
| #93 | **Mobile Series RSVP** | 1 Day | **Feb 13** | **Feb 13** | Frontend | #63 |

> *Note: Schedule aligns Frontend and Backend streams to run in parallel.*

## Release Notes
### Release Notes (Draft)
🚀 **[Supabase Dev Env]**
Established a safe, isolated development environment (`v0-community-dev`) to prevent production regressions.

🛡️ **[Refactor/Security]**
- Hardened `auto_preview.py` against command injection.
- Secured `/api/link-resident` endpoint with strict Auth checks.
- Clarified RLS Policies for Tenant/User data isolation.
- Fixed `orchestrator.md` skill references.
- Added E2E Smoke Tests for deployment validation.

🚀 **[GeoJSON & Map Color]**
🗺️ **[Feature] Reliable Map Import**
Admins can now upload GeoJSON files with confidence! We've fixed the "merged paths" bug and now preserve elevation data (Z-axis) for accurate walking path stats.

🎨 **[Style] Map Color Customization**
You can now set custom colors for each location! Differentiate "Walking Paths" from "Property Lines" directly in the Map Editor.
📍 **[Feature/Map] User Location Beacon**
Find yourself on the map! A new "Blue Dot" indicator shows your current location, and the "Find Me" button instantly centers the view on you.

🔒 **[Security] Privacy Enforcement**
Enhanced resident directory privacy! Sensitive contact info is now securely filtered on the server.

🛡️ **[Security] Admin Override**
Tenant Admins can now view full resident profiles to assist with community management, regardless of individual privacy settings.

🚀 **[Feature] Series RSVP & Priority Feed**
📅 **Series RSVP**: Say "Yes" once, and you're set! You can now RSVP to "This and Future" events in a series with a single click.
⚡ **Smart Priority Feed**: Your feed is now clutter-free. We only show events you've RSVP'd to ("Yes" or "Maybe") or explicitly Saved. No more noise from irrelevant community events.
✨ **[Fix] Upcoming Widget RSVP Counts**
Corrected display logic for recurring event series in the dashboard widget. RSVP counts now accurately reflect "This Event" vs series-wide attendance.
