---
source: prd
imported_date: 2026-04-08
---
# Sprint 4: Community Experience & Auth Polish

## Goal Description
Enhance the onboarding and profile management experience while strengthening the authentication flow with self-service request and recovery features.

## Selected Issues

| Issue | Title | Size | Priority |
| :--- | :--- | :--- | :--- |
| #64 | Admin Replied | M | P1 | ✅ PR #143 |
| #100 | Resident Interest Creation & Directory Search Fix | XS | P2 | ✅ PR #142 |
| #109 | Profile Auto-Save & Visible Save Button | S | P1 | ✅ DONE (PR #144) |
| #99 | [Requirement] Request Access on Login Page | M | P1 | ✅ PR #138 |
| #111 | [READY] Add "Phase" Filter to Neighbor Directory (Grouped UI) | S | P1 | ✅ PR #152 |
| #70 | [Requirement] Password Reset Feature | S | P1 |

## Architecture & Git Strategy

### Branching Model
- **Base Branch**: `main`
- **Sprint Development Branch**: `feat/sprint-4`
- **Individual Feature Branches** (optional for parallel work):
  - `feat/100-111-directory-filters` (Combined due to UI refactor overlap)
  - `feat/109-profile-autosave`
  - `feat/99-70-auth-access` (Combined due to login page overlap)
  - `feat/64-admin-replied`

### Shared Infrastructure
- **Shared Comments**: Both #64 and future engagement features (#79) will use a unified `comments` table.
- **Neighbor Directory**: #111 refactors the UI into a "More Filters" pattern, which #100 must utilize.
- **Profile Components**: #109 affects the profile completion and edit forms.

---

## Technical Breakdowns

### 1. #64: Admin Replied (Core Comments Infrastructure)
- **Goal**: Unified social layer for Admin Replies and future Check-in interactions.
- **Database**:
  - `supabase/migrations/[TIMESTAMP]_create_comments_table.sql` [NEW]:
    - `id`, `tenant_id`, `author_id`, `content`, `parent_id`, `resident_request_id`, `created_at`.
- **Files**:
  - `components/requests/comment-section.tsx` [NEW]: Reusable comment thread component.
  - `app/t/[slug]/dashboard/requests/[requestId]/page.tsx`: Integrate `CommentSection`.
- **AC**:
  - [x] When an admin replies to a request, the resident receives a notification and can reply back within the same thread.
  - [-] Legacy `admin_reply` column content is migrated to the new `comments` table. (Decided not to migrate legacy data to keep system clean).
  - [x] Residents can opt-in to make their "Question" and "Other" requests public.
  - [x] Maintenance and Safety requests are automatically public for community transparency.
  - [x] Admins can reopen resolved or rejected requests to move them back to `in_progress`.
  - [x] Conversation window supports dynamic height and smooth scrolling.

### 2. #100 & #111: Directory Filters & Interests
- **Files**: 
  - `app/t/[slug]/dashboard/neighbours/neighbours-page-client.tsx`: 
    - Refactor `filterSections` into a Popover "More Filters".
    - Add `selectedPhases` state and filter logic.
    - Implement "Create Interest" in the `MultiSelect` search.
  - `components/profile/interests-form.tsx`: Add "Create" capability.
  - `components/onboarding/*`: Add "Create" capability to Onboarding Form and Wizard.
  - `app/t/[slug]/admin/*` [DELETE]: Removed Admin Interest Management UI.
  - `supabase/migrations/[TIMESTAMP]_allow_interest_creation.sql`: Update RLS.
- **AC**:
  - [x] When "More Filters" is clicked, "Phase", "Interests", and "Skills" multi-selects are visible.
  - [x] When a search term has no match in Interests, a "Create" button appears and works in Profile and Onboarding settings (RLS allow).
  - [x] Admin interest management UI is completely removed to simplify the admin experience.
  - [x] [Phase 2G] Request Access Form: renamed "Family Name" -> "Household Name" and refined tone.
  - [x] [Phase 2H] RLS Hardened: `interests` INSERT validated by tenant, `user_interests` SELECT added.
  - [x] [Phase 2H] User Feedback: Toast notifications added for all interest creation failure paths.

### 3. #109: Profile Auto-Save
- **Files**: 
  - `app/t/[slug]/dashboard/settings/profile/profile-edit-form.tsx`: 
    - Refactor `handleSubmit` to `saveProfile(silent: boolean)`.
    - Add `onBlur` listeners to all inputs and `onValueChange` to selects.
    - Add `saveStatus` indicator.
  - `components/onboarding/*`:
    - Refactored `ProfileWizard.tsx` to handle decoupled silent saves across its steps.
- **AC**:
  - [x] When a field loses focus or changes, a "Saving..." indicator appears and changes to "Saved" on success.
  - [x] The form elements are auto-saved seamlessly using Server Actions safely.
  - [x] Wizard's "Continue" buttons are consistently visible and layout doesn't jump.

### 4. #70: Password Reset ✅ MERGED (PR #137)
- **Goal**: Self-service password reset flow for tenant-scoped multi-tenant app.
- **Database**:
  - `check_resident_email(email, tenant_id)` [NEW]: `SECURITY DEFINER` RPC that checks `public.users` for tenant membership before sending reset emails.
- **Files**:
  - `app/auth/confirm/[slug]/route.ts` [NEW]: PKCE code exchange route handler.
  - `app/t/[slug]/forgot-password/` [NEW]: Forgot password page + form.
  - `app/t/[slug]/update-password/` [NEW]: Update password page + form.
  - `app/actions/auth-actions.ts`: Added `resetPassword` and `updatePassword` server actions.
  - `lib/supabase/middleware.ts`: Added early return for `/auth/` paths to prevent session interference.
- **AC**:
  - [x] Residents can request a password reset from the login page.
  - [x] Reset flow is tenant-scoped; only residents of the current tenant receive reset emails.
  - [x] To prevent email enumeration, `resetPassword` always returns success regardless of outcome.
  - [x] PKCE token exchange handles Host-header-based redirects safely.
  - [x] Users can securely set a new password and log in.

### 5. #99: Request Access on Login Page (Rescoped Feb 25, 2026)

> **Requirement doc**: `docs/07-product/02_requirements/requirements_2026-02-09_request_access_login.md`

#### Backend (New)
| File | Purpose |
|------|---------|
| `app/api/v1/access-request/route.ts` | `POST` — `withPublicRateLimit()`, Zod validation, duplicate email check, `service_role` insert |
| `app/api/v1/lots/route.ts` | `GET ?tenant_slug=X` — public, `service_role` bypass for lots RLS, returns `{ id, lot_number, is_occupied }` |
| `supabase/migrations/YYYYMMDD_create_access_requests.sql` | New table + RLS enabled (zero policies, Backend-First) + composite index `(tenant_id, status, in_costa_rica)` |
| `supabase/migrations/YYYYMMDD_add_access_requests_enabled.sql` | Add `access_requests_enabled BOOLEAN DEFAULT false` to `tenants` table (feature flag) |
| `lib/api/public-rate-limit.ts` | `withPublicRateLimit()` — 3 req/60s per IP via `x-forwarded-for` |
| `lib/validation/access-request-schema.ts` | Zod schema for access request payload |

#### Frontend (New)
| File | Purpose |
|------|---------|
| `app/t/[slug]/request-access/page.tsx` | Public form: email, name, family, lot dropdown (282 lots), CR checkbox, lot occupancy notice |

#### Frontend (Modified)
| File | Change |
|------|--------|
| `app/t/[slug]/login/login-form.tsx` | ✅ Already updated — "Request access" link exists. **No changes needed.** |
| `app/t/[slug]/admin/residents/residents-table.tsx` | Add "Access Requests" tab + `access_requested` badge + CR/non-CR sub-tabs + lot occupancy 🟢/🟡 badges |
| `app/t/[slug]/admin/residents/create/create-resident-form.tsx` | Pre-populate wizard from approved request data (lot context via existing `useFamilyByLot`) |

#### Schema: `access_requests`
```sql
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  family_name TEXT NOT NULL,
  lot_id UUID NOT NULL REFERENCES lots(id),
  in_costa_rica BOOLEAN NOT NULL DEFAULT false, -- TEMPORARY: remove when geographic rollout lifts
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
-- No policies: Backend-First, service_role only access

CREATE INDEX idx_ar_tenant_status_cr ON public.access_requests (tenant_id, status, in_costa_rica);
CREATE INDEX idx_ar_email ON public.access_requests (lower(email));
```

#### AC — Public Request Form
- [ ] AC1: Given login page, when "Request access" clicked, then navigate to `/t/[slug]/request-access`.
- [ ] AC2: When valid data submitted + CR checked, then row inserted with `in_costa_rica=true` + toast on login page.
- [ ] AC3: When CR unchecked, then row saved with `in_costa_rica=false` + info banner: "We'll reach out when access becomes available in your area."
- [ ] AC4: When email already exists in `users`, then show: "Looks like there's already an account using this email..."
- [ ] AC5: When email already exists in `access_requests` (pending), then show: "You've already submitted a request..."
- [ ] AC6: When occupied lot selected, then show: "This lot already has registered residents..."

#### AC — Rate Limiting & Security
- [ ] AC7: Given 4th `POST` from same IP within 60s, then return 429.
- [ ] AC8: Given `lot_id` belonging to different tenant, then return 400.
- [ ] AC9: Given `access_requests_enabled = false` on tenant, then request-access route returns 403 / form shows disabled state.

#### AC — Admin Review
- [ ] AC10: Given admin on Residents page, when "Access Requests" tab clicked, then pending requests visible.
- [ ] AC11: Given requests with mixed CR values, when sub-tab selected, then filtered by `in_costa_rica`.
- [ ] AC12: Given request for empty lot, then show 🟢 "Empty lot — new household".
- [ ] AC13: Given request for occupied lot, then show 🟡 "Lot has residents — [Family] ([N] members)".
- [ ] AC14: When "Approve" clicked, then create-resident wizard opens pre-populated with request data + lot context via `useFamilyByLot`.

#### Security Notes
- **Unauthenticated rate-limiting gap**: Existing `withAuth` middleware rate-limits by user ID. New `withPublicRateLimit()` needed for IP-based limiting.
- **Lots RLS blocks public access**: `lots` table requires authenticated user. `GET /api/v1/lots` must use `service_role` bypass.
- **Cross-tenant injection**: Resolve `tenant_id` from `tenant_slug` server-side. Validate `lot_id` belongs to resolved tenant.

#### Handovers
- **Backend → Frontend**: `POST /api/v1/access-request` returns `{ success: true }` or `{ error: string, code: string }`. Frontend waits for this.
- **Backend → Admin**: Access requests query returns `{ ...request, lot_status: 'empty' | 'occupied', family_name?: string, family_member_count?: number }`.

---

## Verification Plan

### Automated Tests
- `npm run test`: Unit tests for filter logic in `neighbours-page-client`.
- `npx vitest run app/api/v1/access-request`: 8 unit tests (valid request, missing fields, duplicate email, cross-tenant lot, rate limit, non-CR, XSS).
- `npx vitest run app/api/v1/lots`: 3 unit tests (valid tenant, invalid tenant, PII exclusion).
- `npx playwright test e2e/access-request.spec.ts` [NEW]: 5 E2E tests (happy path, non-CR, occupied lot, duplicate, admin review).

### Manual Verification
- **Cropping**: Upload an off-center photo and verify correct 1:1 cropping.
- **Auto-save**: Change a field, click away, and refresh the page to see if value persisted.
- **Access Request (Public)**: Submit form → verify toast + redirect. Submit with CR unchecked → verify banner. Select occupied lot → verify notice.
- **Access Request (Admin)**: Residents → Access Requests tab → verify sub-tabs → verify lot badges → Approve → verify wizard pre-populated.
- **Password Reset**: ✅ Already merged and verified (#70).
- **Feature Flag**: Set `access_requests_enabled = false` on tenant → verify form shows disabled state / route returns 403.

## Implementation Order
1. ~~**Security & Infrastructure**: #70 (Password Reset)~~ ✅ Merged
2. ~~**Core Feature**: #99 (Request Access)~~ ✅ PR #138 (in review, all 12 CR findings addressed)
3. **Social Infrastructure**: #64 (Comments Architecture)
4. **UX Optimization**: #111 (Directory Refactor) followed by #100 (Interest Fixes)
5. **Onboarding Polish**: #109 (Auto-save)

## Sprint Schedule

| Issue | Size | Est. Hours | Start Date | Target Date |
| :--- | :--- | :--- | :--- | :--- |
| #70 | S | ~~4-8h~~ | ~~Feb 16~~ | ✅ Merged |
| #99 | M | 14-20h | Feb 25 | ✅ PR #138 (Mar 1) |
| #111 | S | 4-8h | Mar 10 | ✅ PR #152 |
| #100 | XS | 2-4h | Mar 8 | ✅ PR #142 |
| #64 | M | 8-16h | Mar 8 | ✅ PR #143 |
| #109 | S | 4-8h | Mar 9 | ✅ PR #144 |

*Note: Dates to be updated by project owner. #99 est. hours increased from 12-16h → 14-20h to reflect expanded scope (CR distinction, admin sub-tabs, lot occupancy context, feature flag).*

## Definition of Done
- [ ] Code passes `npm run lint` & `npx tsc --noEmit`
- [ ] PR reviewed by at least 1 team member
- [ ] Manual QA verification completed per ACs
- [ ] No new P0 bugs introduced
- [ ] Documentation updated (if applicable)

## Release Notes

### 🚀 Request Access on Login Page (#99)
New residents can now request community access directly from the login screen — no admin setup needed upfront.

🤝 **Self-Service Request Form**
Enter your details, pick your lot from a searchable dropdown, and indicate Costa Rica residency. The form shows lot availability in real-time.

🛡️ **Admin Approval Workflow**
Admins see incoming requests in a new "Access Requests" tab with CR/Non-CR filtering. Approve to pre-populate the resident wizard, or reject with one click.

📱 **Feature Flag Control**
Communities can enable/disable the request form per tenant via the backoffice — no code deploy needed.

### 🚀 Resident Interest Creation & Directory Search Fix (#100)
Residents can now instantly add their own unique interests directly from their profile or onboarding flow without waiting for an admin.

🧑‍🤝‍🧑 **Connect with Neighbors**
Added a search capability in the directory to find neighbors who share your newly created interests instantly.

✏️ **Smarter Interest Management**
Say goodbye to the limited admin curated list. Just start typing, and if it's not there, create it!

### 🚀 Journey Phase Filter & Grouped UI (#111)
Easily find neighbors based on where they are in their community journey, with a cleaner interface.

🔎 **Phase Filter**
A new dynamic "Journey Phase" filter lets you connect with people specifically in the "Planning," "Building," "Arriving," or "Integrating" stages.

🗂️ **Cleaner UI**
To avoid clutter, we've grouped "Interests," "Skills," and "Journey Phase" under a single unified "More Filters" menu.

### 🚀 Resident Requests Comments & Reopen (#64)
Upgraded resident requests with a unified discussion system and better lifecycle management.

🗣️ **Discussion Threads**
Replaced the legacy single admin-reply column with a rich, multi-reply discussion thread. Residents and Admins can converse seamlessly.

🔓 **Reopen Requests**
Admins can now instantly Reopen a resolved or rejected request instead of asking residents to submit a new one.

🔒 **Privacy Controls**
Added simple Public/Private visibility toggles to Requests for community transparency.

### 🚀 Profile Auto-Save & Polish (#109)
Your profile data now saves seamlessly in the background as you type or select options.

💾 **Zero-Click Saving**
Goodbye to the big "Save Changes" button. A subtle "Saving..." and "Saved" indicator gives you instant feedback that your data is secure.

📱 **Mobile Onboarding Fixed**
The setup wizard now pins the "Continue" buttons to the bottom of your screen, meaning you'll never have to endlessly scroll to move to the next step. Responsive design at its best.
