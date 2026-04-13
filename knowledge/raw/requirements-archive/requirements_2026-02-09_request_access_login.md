source: requirement
imported_date: 2026-04-08
---
# Requirements: Request Access on Login Page

## 1. Problem Statement

The application currently requires **admins to manually create resident accounts** before users can access the platform. The login page shows a static "Ask your admin for an invite" message, providing no actionable self-service path. This creates two friction points:

1. **For prospective residents**: They must contact an admin out-of-band (email, WhatsApp, in-person) to request access, with no visibility into whether their request was received.
2. **For admins**: They must manually collect first name, last name, family name, and lot number before creating the user — information the resident already knows.

Additionally, the current rollout is limited to **residents who currently live in Costa Rica** to support scaling and stability during early testing. This geographic constraint needs to be acknowledged during the request flow — however, requests from non-CR residents should still be **saved** (not blocked), with a notification about the rollout plan. This is a **temporary** constraint that will be removed when the platform scales globally.

## 2. User Persona

- **Prospective Resident**: A person who currently lives in the community (Costa Rica) and wants to join the app. They know their name, family name, and lot number.
- **Community Admin**: A tenant admin who currently manually creates residents. They need to verify and approve access requests before sending invites.

## 3. User Stories

- **RA-1**: As a Prospective Resident, I want to request access from the login page so that my admin receives my information and can create my account.
- **RA-2**: As a Prospective Resident, I want to indicate whether I currently live in Costa Rica so the platform can inform me about rollout timing.
- **RA-2b**: As a Prospective Resident who is NOT yet in Costa Rica, I want to be informed about the rollout plan so I know when to expect access.
- **RA-3**: As an Admin, I want to see "Access Requested" entries in my residents list so that I can review and approve new user requests.
- **RA-3b**: As an Admin, I want to distinguish between residents who are already in Costa Rica vs. not yet, so I can prioritize onboarding.
- **RA-4**: As an Admin, I want the request to pre-populate the resident creation form so that I don't have to re-enter information the user already provided.
- **RA-5**: As an Admin, I want to see lot occupancy context (empty vs. occupied + family info) when reviewing a request so I can make informed approval decisions.

## 4. Functional Requirements

### 4.1 Request Form (Public / Unauthenticated)
1. The login page's "New here? Ask your admin for an invite" section shall be **renamed** (e.g. "New here? Request access") and its link shall navigate to a **Request Access form** (new page).
2. The form shall collect:
   - **Email** (required) — used to check for duplicates
   - **First Name** (required)
   - **Last Name** (required)
   - **Family Name** (required, e.g. "Miller Family")
   - **Lot Number** (required) — dropdown/select populated from the tenant's lots
   - **Costa Rica Confirmation** (required) — yes/no checkbox: "I currently reside in Costa Rica"
3. **Duplicate Email Check**: If the email is already registered to an existing user, show: *"Looks like there's already an account using this email, please get in touch with your administrator."*
4. **Costa Rica Behavior** (non-blocking):
   - **If checked YES**: Standard submission flow.
   - **If checked NO**: Show informational message: *"Thank you! We'll reach out when access becomes available in your area."* — request is still saved.
5. **Lot Occupancy Notice**: If the selected lot already has registered residents, show a neutral message: *"This lot already has registered residents. An admin will review your request and determine the best way to set up your account."* No resident names or PII are exposed.
6. **Submission**: On success, return the user to the login screen with a confirmation toast: *"Your request has been submitted. An admin will review it shortly."*

### 4.2 New User Status: `access_requested`
1. A new status value `access_requested` shall be added to the resident lifecycle, extending the current derived statuses: `passive`, `created`, `invited`, `active`, `inactive`.
2. The admin `ResidentsTable` shall display `access_requested` entries with a distinct badge (e.g. amber/orange).

### 4.3 Admin Approval Flow
1. The admin Residents page shall have a **new tab** (e.g. "Access Requests") showing pending access requests alongside the existing residents tab.
2. The Access Requests tab shall have **sub-tabs or filters** to distinguish:
   - **"In Costa Rica"** — requests where `in_costa_rica = true` (priority onboarding)
   - **"Not yet in CR"** — requests where `in_costa_rica = false` (deferred onboarding)
3. Each pending request shall surface **lot occupancy context** at review time:
   - 🟢 **"Empty lot — new household"** → Simple approval path
   - 🟡 **"Lot has residents — [Family Name] ([N] members)"** → Admin chooses: add to family, independent, or reassign
4. Clicking an access-requested entry shall allow the admin to **review and confirm** the data (name, family, lot).
5. Upon confirmation, the "Approve" action opens the existing **create-resident wizard pre-populated** with request data (name, email, lot). Lot context loads automatically via `useFamilyByLot`, and the admin makes the family assignment decision using the existing UI.
6. Once the resident is created, the admin sends an invite link as per the existing invite mechanism.

### 4.4 Email Automation (Deferred — Separate Issue)
1. **Current approach**: Use existing Supabase Auth invite mechanism for #99.
2. **Follow-up**: A separate GitHub issue (already drafted) covers Resend integration for automated welcome emails, branded templates, and transactional notifications.
3. **Bridge**: Ship #99 first with manual invite flow; Resend replaces it later without breaking changes.

## 5. Non-Functional Requirements

- **Security**: The request form is public (unauthenticated). The lot list must be served without leaking sensitive data. No PII beyond what the user submits should be exposed.
- **Rate Limiting**: The submission endpoint should be rate-limited to prevent spam.
- **Accessibility**: The form must follow existing design system patterns and be mobile-first.

## 6. Context & Issue Context

### Current Login Form
- File: `app/t/[slug]/login/login-form.tsx`
- The "New here?" section at line ~228 currently has a placeholder `href="#"`.

### Current Resident Lifecycle
- Statuses are **derived** in `getResidentStatus()` (line 111 of `residents-table.tsx`):
  - `passive` → no email
  - `created` → has email, not invited
  - `invited` → has `invited_at`
  - `active` → has `last_sign_in_at` within 30 days OR `onboarding_completed`
  - `inactive` → last sign-in > 30 days ago
- There is **no explicit `status` column** on the `users` table — statuses are computed.

### Lots Table
- `lots` table has `id`, `neighborhood_id`, `lot_number`, RLS requires authentication.
- **RLS Gap**: The request form is unauthenticated, so a public/anonymous endpoint or server action is needed to fetch lots for a given tenant.

### Documentation Gaps
- Missing `docs/02-technical/flows/auth/request-access.md` (new flow).
- Missing specification for public/anonymous data endpoints.

## 7. Dependencies

| Issue | Title | Relationship |
|-------|-------|-------------|
| #70 | [Requirement] Password Reset Feature | Both modify the login page. Coordinate UI placement. |
| #77 | [Brainstorm] Auto Logout / Session Timeout | Related auth system. No blocking dependency. |
| TBD | Resend Email Integration | Follow-up: replaces manual invite with automated welcome emails. Already drafted. |

## 8. Technical Options

### Option 1: Dedicated `access_requests` Table + API Route

**Mechanism**: Create a new `public.access_requests` table to store unauthenticated submissions. A public Next.js API route (`/api/v1/access-request`) handles form submissions and lot fetching. Admin sees requests in a new tab/filter on the residents page.

**Implementation**:
- **Database**: New `access_requests` table with columns: `id`, `tenant_id`, `email`, `first_name`, `last_name`, `family_name`, `lot_id`, `in_costa_rica` (BOOLEAN, temporary), `status` (`pending`/`approved`/`rejected`), `created_at`.
- **API**: `POST /api/v1/access-request` (public, rate-limited) to submit. `GET /api/v1/lots?tenant_slug=X` (public) to fetch lot list.
- **Admin**: New **"Access Requests" tab** on the existing residents page with **CR/non-CR sub-tabs**. "Approve" action opens existing create-resident wizard pre-populated with request data + lot context via `useFamilyByLot`.
- **Frontend**: New `/t/[slug]/request-access` page with the form. Lot occupancy notice shown when selected lot is occupied.

**Pros**:
- Clean separation — requests are isolated from the `users` table until approved.
- No risk of "ghost users" in the system.
- Easy to add request metadata (notes, rejection reason) in the future.
- RLS is simple: public insert, admin-only read/update.

**Cons**:
- Requires a new table + migration.
- Two API routes needed (lots + submit).
- Admin needs a new UI section to manage requests.

**Effort**: M (Medium) — ~1 sprint

---

### Option 2: Reuse `resident_requests` Table

**Mechanism**: Leverage the existing `resident_requests` table and system. Create a new request type `access_request` with the form data stored in a metadata/payload JSON column.

**Implementation**:
- **Database**: No new table needed. Add `access_request` as a valid request type. Store form fields in the existing `metadata` or `details` JSON column.
- **API**: Single public API route for submission. Lots endpoint still needed.
- **Admin**: Requests appear in the existing "Requests" admin dashboard alongside other request types.
- **Frontend**: Same new request-access page.

**Pros**:
- Reuses existing infrastructure (request system, notifications, admin UI).
- No new migration for table creation.
- Admin already knows the "Requests" workflow.

**Cons**:
- `resident_requests` is designed for authenticated residents — it has a `user_id` FK. Adapting for unauthenticated users requires making `user_id` nullable or using a service-role bypass.
- Mixes concerns: access requests are fundamentally different from "fix my faucet" requests.
- Pre-filling the resident creation form from JSON metadata is fragile.
- RLS policies on `resident_requests` assume authenticated users.

**Effort**: S (Small) — but with technical debt

---

### Option 3: Direct User Creation with `access_requested` Status Column

**Mechanism**: Add an explicit `status` column to the `users` table. When someone submits the request form, create a `users` row immediately with `status = 'access_requested'` (no Supabase Auth account yet). Admin "approves" by changing status to `created` and then sending an invite as usual.

**Implementation**:
- **Database**: Add `status TEXT DEFAULT 'created'` column to `users` table. Migration to backfill existing users.
- **API**: Public route creates user row directly (service role). Lots endpoint needed.
- **Admin**: `getResidentStatus()` checks the new `status` column first. "Approve" action transitions `access_requested` → `created`.
- **Frontend**: Same new request-access page.

**Pros**:
- No separate table — the user record is the request.
- Admin approval is a simple status flip.
- Pre-population is trivial (data is already in the `users` table).
- Simplifies the overall status model by making it explicit instead of derived.

**Cons**:
- Creates "real" user rows for unauthenticated submissions — potential for junk/spam data.
- Requires careful RLS: `access_requested` users should NOT appear in resident-facing queries (neighbor directory, etc.).
- Migration to add `status` column and backfill all existing users is a moderate effort.
- Blurs the line between "someone who requested access" and "a real resident."

**Effort**: M (Medium) — migration complexity

---

## 9. Recommendation

### ✅ Recommended: Option 1 — Dedicated `access_requests` Table

**Rationale**:

| Criteria | Option 1 (Dedicated Table) | Option 2 (Reuse resident_requests) | Option 3 (Direct User Creation) |
|---|---|---|---|
| **Separation of Concerns** | ✅ Clean boundary | ❌ Mixes request types | ❌ Blurs user vs. requester |
| **Security (RLS)** | ✅ Simple: anon insert, admin read | ⚠️ Requires nullable FK workaround | ⚠️ Ghost users visible to residents |
| **Spam Resistance** | ✅ Isolated from users table | ✅ Isolated | ❌ Pollutes users table |
| **Admin UX** | ✅ Clear "Access Requests" section | ⚠️ Mixed in with maintenance requests | ✅ Inline in residents list |
| **Pre-fill on Approve** | ✅ Straightforward copy | ⚠️ JSON extract fragile | ✅ Already in users table |
| **Future Extensibility** | ✅ Add rejection reason, notes, history | ⚠️ Constrained by existing schema | ⚠️ Status column grows |
| **Effort** | M | S (with debt) | M |

**Decision**: Option 1 provides the best balance of clean architecture, security, and future-proofing for an alpha-stage feature that will likely evolve. The extra effort vs. Option 2 is justified by avoiding technical debt that would block future request management features (rejection reasons, request history, bulk approval).

### Classification

| Property | Value |
|----------|-------|
| **Priority** | P1 — High (critical for onboarding new residents without manual admin work) |
| **Size** | M — Medium (~1 sprint: migration + API + frontend + admin UI) |
| **Horizon** | Now — Alpha feature, blocks first community rollout |

### 9.1 Technical Analysis: New Scope Items (Feb 2026 Feedback)

The following items were added based on stakeholder feedback (Issue #99 comments, Feb 22-25). They build on the approved Option 1 architecture.

#### A. Costa Rica Distinction (Non-Blocking)

**Change**: The CR checkbox goes from blocking gate → informational yes/no. All requests are saved regardless.

**Implementation**:
- **Schema**: Add `in_costa_rica BOOLEAN NOT NULL DEFAULT false` to `access_requests` table. _Temporary column — flagged for removal when geographic rollout constraint is lifted._
- **Frontend**: Replace mandatory gate with a checkbox. On unchecked: show inline info banner *"Thank you! We'll reach out when access becomes available in your area."* — form still submits.
- **API**: No change to validation — just store the boolean. No business logic branches on it.
- **Removal plan**: When rollout expands, a single migration drops the column and removes the frontend checkbox. No cascading changes needed.

**Effort**: XS | **Risk**: Low

---

#### B. Admin CR/Non-CR Sub-tabs

**Change**: Access Requests tab gets filter sub-tabs for `in_costa_rica = true/false`.

**Implementation**:
- **Backend**: `GET /api/v1/access-requests?in_costa_rica=true|false` filter param. Already paginated.
- **Frontend**: Two sub-tabs within the Access Requests tab: "In Costa Rica" (default) / "Not yet in CR". Uses existing tab component pattern from residents page. Counts shown in tab labels.
- **Removal plan**: When geographic constraint is lifted, remove sub-tabs (single-line UI change) and drop the query param. No schema dependency beyond the column in (A).

**Effort**: S | **Risk**: Low

---

#### C. Lot Occupancy Context at Admin Review

**Change**: When admin reviews a pending request, show the lot occupancy status alongside the request data.

**Implementation**:
- **Backend**: Extend the access request detail query to JOIN on `lots` → `users` → `family_units` to fetch:
  - Lot status: empty vs. occupied
  - If occupied: family name + member count
- **Frontend**: Surface context badges in the request review card:
  - 🟢 _"Empty lot — new household"_
  - 🟡 _"Lot has residents — The Garcia Family (2 members)"_
- **Approval action**: "Approve" opens the existing `create-resident-form` wizard. The `useFamilyByLot` hook loads automatically when the lot is pre-filled, presenting the standard family assignment choices (add to family / independent / reassign). **No new UI needed** — leverages existing wizard.

**Effort**: S | **Risk**: Low — relies on existing `useFamilyByLot` hook

---

#### D. Lot Occupancy Notice on Public Form

**Change**: When a user selects a lot that already has residents, show a neutral informational message.

**Implementation**:
- **API**: Extend `GET /api/v1/lots?tenant_slug=X` response to include an `is_occupied BOOLEAN` field. Do NOT return resident names, count, or family info (PII exposure risk).
- **Frontend**: On lot selection change, if `is_occupied = true`, show inline notice: *"This lot already has registered residents. An admin will review your request and determine the best way to set up your account."*
- **Security**: The `is_occupied` boolean is minimally revealing — it confirms occupancy but leaks no PII. If even this is sensitive, it can be removed without API contract changes (just always return `false`).

**Effort**: XS | **Risk**: Low

---

#### Aggregate Impact on Sizing

| Original Size | New Items Total | Revised Size |
|---|---|---|
| M (Medium, ~1 sprint) | +XS + S + S + XS ≈ S | **M** (unchanged — new items are small increments within existing workstreams) |

## 10. Technical Review (Re-Review: Feb 25, 2026)

> This section was regenerated following the `/02_review` pipeline after new scope items were added (Costa Rica distinction, lot occupancy context, admin sub-tabs). Previous review date: Feb 14, 2026.

### Phase 0: Context Gathering

#### Issue Details
- **Issue**: [#99 Request Access on Login Page](https://github.com/mjcr88/v0-community-app-project/issues/99)
- **Labels**: `enhancement`, `Design`
- **Priority**: P1 — High | **Size**: M — Medium (~1 sprint)
- **Updated**: 2026-02-25 (4 comments, issue body updated with new user stories RA-2b, RA-3b, RA-5)

#### Scope Summary (Updated)
| Area | Description |
|------|-------------|
| **Request Form** | New `/t/[slug]/request-access` page — email, name, family, lot dropdown, CR checkbox (non-blocking), lot occupancy notice |
| **Backend** | New `access_requests` table + `POST /api/v1/access-request` (rate-limited) + `GET /api/v1/lots?tenant_slug=X` (public, with `is_occupied` flag) |
| **Admin UI** | New "Access Requests" tab on residents page with CR/non-CR sub-tabs + lot occupancy context badges at review time |
| **Approval Flow** | "Approve" opens existing create-resident wizard pre-populated via `useFamilyByLot` |
| **CR Distinction** | Temporary `in_costa_rica BOOLEAN` column — non-blocking; all requests saved |
| **Email Automation** | Deferred to separate issue — ships with existing Supabase Auth invite mechanism |

#### Impact Map

**Frontend (Modified)**:
| File | Lines | Impact |
|------|-------|--------|
| `app/t/[slug]/login/login-form.tsx` | 277 | ✅ Already updated — links to `/request-access` (line 261). No further changes needed. |
| `app/t/[slug]/admin/residents/residents-table.tsx` | 501 | Add "Access Requests" tab + `access_requested` status badge. Current statuses: `passive`, `created`, `invited`, `active`, `inactive`. |
| `app/t/[slug]/admin/residents/create/create-resident-form.tsx` | 746 | Pre-populate wizard from approved request data. Already imports `useFamilyByLot`. |

**Frontend (New)**:
| File | Purpose |
|------|---------|
| `app/t/[slug]/request-access/page.tsx` | Public request form with lot dropdown, CR checkbox, lot occupancy notice |

**Backend (New)**:
| File | Purpose |
|------|---------|
| `app/api/v1/access-request/route.ts` | `POST` handler — rate-limited, Zod-validated submission |
| `app/api/v1/lots/route.ts` | `GET` public endpoint — lot list with `is_occupied` boolean (no PII) |
| `supabase/migrations/YYYYMMDD_create_access_requests.sql` | New table + RLS + indexes |

**Hooks & Data Layer**:
| File | Lines | Impact |
|------|-------|--------|
| `hooks/admin/use-family-by-lot.ts` | 81 | Used as-is for approval flow — queries `users` + `family_units` by lot |
| `lib/data/residents.ts` | — | May need accessor for `access_requests` admin queries |
| `lib/data/families.ts` | — | Used by `useFamilyByLot` for family context |
| `lib/validation/schemas.ts` | — | Add Zod schema for access request payload |

#### Historical Context (Since Last Review: Feb 14)
| Commit | Date | Impact |
|--------|------|--------|
| `5ff2bcd` fix(#70): CodeRabbit feedback | Post Feb 15 | Login page area — minor fixes |
| `7c4df08` fix(#70): 8 CodeRabbit findings | Post Feb 15 | Login/auth area |
| `0e5ca7f` feat(#70): self-service password reset | Post Feb 15 | **Major**: Added `/forgot-password` link to login form. Login form structure changed. |
| `fce79d7` feat(112): Inventory Logic | Post Feb 15 | Touched `residents-table.tsx` — unrelated inventory feature |

**Key finding**: The login form (`login-form.tsx`) has been **significantly updated** since the last review. It now already contains the "Request access to this community" link (line 261-265) pointing to `/t/[slug]/request-access`. The "New here? Ask your admin" text has already been replaced. **No login form modifications are needed for #99.**

**Dependency status**: Issue #70 (Password Reset) has been **merged** (`0e5ca7f`). The shared login page is no longer a coordination risk.

#### Handoff Log
```
→ Phase 0 Step 1 (Product Manager): Issue retrieved via MCP. 4 comments analyzed. Req doc at 405 lines with Section 9.1 additions.
→ Phase 0 Step 2 (Explorer Agent): Impact map built. 3 modified files, 3 new files, 4 hooks/data dependencies. Login form already updated.
→ Phase 0 Step 3 (Code Archaeologist): Git log analyzed. 4 relevant commits since last review. #70 merged — no longer blocking.
```

🔁 **[PHASE 0 COMPLETE]** Handing off to Security Auditor...

### Phase 1: Vibe & Security Audit

#### Vibe Code Check Assessment

**1. Frontend Database Access**:
- ⚠️ **Pre-existing violation**: `hooks/admin/use-family-by-lot.ts` uses browser `createClient()` in a `"use client"` hook to query `users` and `family_units` directly. This is used by the create-resident wizard. **Not introduced by #99**, but if approval flow leverages this hook, the pattern persists. Recommend flagging for future refactor but not blocking #99.
- ✅ **#99 design is clean**: Both new API routes (`POST /access-request`, `GET /lots`) will be server-side Next.js route handlers using `service_role` or server-client. No new frontend DB access.

**2. RLS Architecture (Mixed — Not Pure Zero-Policy)**:
- The project uses **RLS policies extensively** on existing tables (`clean_schema_final.sql`: 50+ policies on users, lots, events, family_units, etc.).
- The `lots` table has RLS: `"Residents can view lots in their tenant"` — authenticated only, scoped by `get_user_role()` and `get_user_tenant_id()`.
- **Decision for `access_requests`**: Enable RLS but use **service_role bypass** in the API route handler (consistent with `vibe-code-check` Backend-First principle). No RLS policies on `access_requests` itself — all access via service role in server actions/API routes.

**3. Input Validation**: All inputs MUST use Zod. ✅ — design already specifies this.

#### Attack Surface Analysis

| Vector | Threat | Severity | Mitigation |
|--------|--------|----------|------------|
| **Spam POST** | Attacker floods `/api/v1/access-request` with fake submissions | 🔴 High | **Rate limit by IP** — existing `rateLimit()` uses user ID (authenticated). Need a new `withPublicRateLimit` wrapper using `request.headers.get('x-forwarded-for')` or `request.ip`. Recommend: 3 requests / 60 seconds per IP. |
| **Lot enumeration** | `GET /lots` reveals lot structure and occupancy (via `is_occupied` flag) | 🟡 Medium | The `is_occupied` boolean is minimally revealing but does confirm which lots have residents. **Mitigation**: Return only `id`, `lot_number`, `is_occupied`. No PII. If occupancy is deemed sensitive, default `is_occupied = false` always. |
| **Email harvesting** | Duplicate email check reveals whether an email is registered | 🟡 Medium | The error message "Looks like there's already an account..." **confirms account existence**. **Mitigation**: Use rate limiting + consider returning a generic success even on duplicates (but current UX requirement shows specific message — accepted risk). |
| **Cross-tenant injection** | Attacker submits `tenant_id` from a different tenant | 🔴 High | **Resolve `tenant_id` from `tenant_slug` on the server side**, never accept `tenant_id` from the client. Validate that the `lot_id` belongs to the resolved `tenant_id`. |
| **Lot ID manipulation** | Attacker submits a `lot_id` that belongs to a different tenant | 🔴 High | **Server-side validation**: Query `lots` table to confirm `lot_id` belongs to the tenant identified by the slug. Reject with 400 if mismatch. |
| **CSRF on public form** | Bot submission via automated tool | 🟡 Medium | Consider adding a CAPTCHA (hCaptcha/Turnstile) or honeypot field. Not in current spec — recommend as fast-follow if spam becomes an issue. |

#### Critical Finding: Unauthenticated Rate Limiting Gap

The existing rate-limiting infrastructure (`lib/rate-limit.ts` + `lib/api/middleware.ts`) is designed for **authenticated** requests only — it rate-limits by `user.id` inside the `withAuth` wrapper. The `POST /api/v1/access-request` endpoint is **public/unauthenticated**, so it cannot use `withAuth`.

**Required**: Create a `withPublicRateLimit()` middleware that:
1. Extracts identifier from IP address (`x-forwarded-for` header or `request.ip`)
2. Uses a stricter window: 3 requests per 60 seconds (vs. 10/10s for authenticated)
3. Returns 429 with standard rate-limit headers
4. Falls back gracefully if Redis is unavailable (same pattern as existing)

#### Critical Finding: Lots RLS Blocks Public Access

The `lots` table has RLS policy `"Residents can view lots in their tenant"` which requires `get_user_role() = 'resident'` — an **authenticated** user. The public request form needs lot data without authentication.

**Required**: The `GET /api/v1/lots` route must use `supabaseAdmin` (service role) to bypass RLS and query lots. The route handler strips all sensitive fields, returning only `{ id, lot_number, is_occupied }`.

#### Handoff Log
```
→ Phase 1 Step 1 (Vibe Check): vibe-code-check skill applied. Mixed RLS confirmed. No new frontend DB access in #99 design.
→ Phase 1 Step 2 (Attack Surface): 6 vectors analyzed. 2 Critical (spam + cross-tenant), 3 Medium (lot enumeration, email harvesting, CSRF).
→ Phase 1 Step 3 (Independent Research): Verified rate-limit infrastructure. Identified unauthenticated rate-limiting gap and lots RLS blocking issue.
```

🔁 **[PHASE 1 COMPLETE]** Handing off to Test Engineer...

### Phase 2: Test Strategy

> Test infrastructure: **Vitest** for unit tests (`vitest`), **Playwright** for E2E. Existing test patterns in `middleware.test.ts`, `events-availability.test.ts`, etc.

#### Sad Paths (Updated for New Scope)

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| SP-1 | **Duplicate email** — email exists in `users` table | Show: "Looks like there's already an account using this email, please get in touch with your administrator." |
| SP-2 | **Duplicate email** — email exists in `access_requests` (pending) | Show: "You've already submitted a request. An admin will review it shortly." |
| SP-3 | **Cross-tenant lot** — submit `lot_id` belonging to a different tenant | 400 Bad Request. Server validates lot belongs to resolved tenant. |
| SP-4 | **Rate limited** — 4th submission from same IP within 60s | 429 Too Many Requests with `X-RateLimit-*` headers. |
| SP-5 | **Empty/missing fields** — client-side validation bypass | 400 Bad Request. Zod schema rejects on server. |
| SP-6 | **Non-CR checkbox unchecked** — user is not in Costa Rica | Request saves normally. Inline banner shown: "We'll reach out when access becomes available in your area." Toast on success. |
| SP-7 | **Occupied lot selected** — lot has existing residents | Inline notice: "This lot already has registered residents. An admin will review..." Form still submits. |
| SP-8 | **XSS in name fields** — `<script>alert(1)</script>` in first_name | Zod strips/rejects HTML. Stored value is sanitized. |
| SP-9 | **Emoji in family name** — `The García 🏡 Family` | Should be accepted — Zod allows unicode. |
| SP-10 | **Very long input** — 10,000 char email | 400 Bad Request. Zod maxLength validation. |

#### Test Plan

**Unit Tests (Vitest)** — File: `app/api/v1/access-request/route.test.ts`

| Test | Description |
|------|-------------|
| `POST valid request → 201` | Full payload with all required fields → row created |
| `POST missing email → 400` | Zod rejects missing required field |
| `POST duplicate email (users) → 409` | Returns specific message for existing user |
| `POST duplicate email (access_requests) → 409` | Returns specific message for pending request |
| `POST cross-tenant lot → 400` | Lot ID doesn't belong to resolved tenant |
| `POST rate limited → 429` | 4th request from same IP within window |
| `POST with in_costa_rica=false → 201` | Request saves normally, non-blocking |
| `POST XSS in name → 400 or sanitized` | HTML tags rejected or stripped |

**Unit Tests (Vitest)** — File: `app/api/v1/lots/route.test.ts`

| Test | Description |
|------|-------------|
| `GET valid tenant slug → 200` | Returns array of `{ id, lot_number, is_occupied }` |
| `GET invalid tenant slug → 404` | Tenant not found |
| `GET response excludes PII` | No `owner_id`, `neighborhood_id`, or resident names in response |

**Integration Tests** — File: `tests/integration/access-request-flow.test.ts`

| Test | Description |
|------|-------------|
| Submit valid request → verify `access_requests` row | Confirm DB write with correct `tenant_id`, `status=pending`, `in_costa_rica` flag |
| Admin approve → verify `users` row created | Confirm approval transitions `access_requests.status` to `approved` and creates user record |
| Admin approve occupied lot → verify wizard context | Confirm `useFamilyByLot` loads family data for pre-populated lot |

**E2E Tests (Playwright)** — File: `e2e/access-request.spec.ts`

| Test | Description |
|------|-------------|
| Full happy path | Login → "Request access" → Fill form (all fields + CR ✓) → Submit → Toast → Back to login |
| Non-CR path | Fill form with CR unchecked → See info banner → Submit → Toast |
| Occupied lot notice | Select an occupied lot → See "already has registered residents" message |
| Duplicate email | Submit with existing email → See administrator contact message |
| Admin review | Admin login → Residents → Access Requests tab → CR sub-tab → Review card with lot context |

**Manual Verification**

| Step | Action |
|------|--------|
| 1 | Navigate to `/t/[slug]/login`. Verify "Request access to this community" link is visible. |
| 2 | Open request form. Verify all fields render: email, first/last name, family name, lot dropdown (populated), CR checkbox. |
| 3 | Submit form with valid data. Verify toast: "Your request has been submitted." and redirect to login. |
| 4 | Submit form with CR unchecked. Verify info banner appears. Verify form still submits. |
| 5 | Select an occupied lot. Verify neutral occupancy notice appears. |
| 6 | Login as admin → Residents page → Verify "Access Requests" tab appears with pending request. |
| 7 | Verify CR/non-CR sub-tabs filter correctly. |
| 8 | Click a pending request → Verify lot context badge (🟢/🟡). Verify "Approve" opens create-resident wizard pre-populated. |

#### Handoff Log
```
→ Phase 2 Step 1 (Sad Paths): 10 scenarios including new scope items (non-CR, occupied lot, emoji, XSS).
→ Phase 2 Step 2 (Test Plan): Unit (11 tests), Integration (3 tests), E2E (5 tests), Manual (8 steps).
→ Phase 2 Step 3 (Infrastructure): Vitest + Playwright confirmed. Test file locations specified.
```

🔁 **[PHASE 2 COMPLETE]** Handing off to Performance Optimizer...

### Phase 3: Performance Assessment

#### Live Data Introspection (Supabase MCP — `nido.prod`: `csatxwfaliwlwzrkvyju`)

| Table | Row Count | Notes |
|-------|-----------|-------|
| `lots` | **282** | Moderate — safe to load all for dropdown (single query, no pagination needed) |
| `users` | **38** | Small — N+1 JOINs are negligible at this scale |
| `family_units` | **13** | Tiny — no performance concern |
| `tenants` | **1** | Single-tenant deployment |
| `access_requests` | **0** | Does not exist yet |

#### Schema Design for `access_requests`

```sql
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  family_name TEXT NOT NULL,
  lot_id UUID NOT NULL REFERENCES lots(id),
  in_costa_rica BOOLEAN NOT NULL DEFAULT false, -- TEMPORARY: Remove when geographic rollout constraint is lifted
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
-- No policies: Backend-First, service_role only access
```

#### Indexes Required

| Index | Columns | Purpose | Priority |
|-------|---------|---------|----------|
| `idx_ar_tenant_status` | `(tenant_id, status)` | Admin dashboard filtering by tenant + status | 🔴 Required |
| `idx_ar_email` | `(lower(email))` | Case-insensitive duplicate email lookup | 🔴 Required |
| `idx_ar_tenant_cr` | `(tenant_id, in_costa_rica)` | CR/non-CR sub-tab filtering | 🟡 Nice-to-have (combine with status index for composite) |

**Recommendation**: Use a single composite index `(tenant_id, status, in_costa_rica)` instead of separate ones — covers both admin dashboard filtering and CR sub-tab queries.

#### N+1 Analysis

| Query | Pattern | Risk |
|-------|---------|------|
| Admin list access requests | Single query with filter on `tenant_id + status` | ✅ No risk |
| Admin review with lot context | JOIN `access_requests → lots → users → family_units` | 🟡 Low risk — At 282 lots and 38 users, even a naive approach is fast. Use single query with LEFT JOINs. |
| `GET /lots` for dropdown | Single query: `SELECT id, lot_number FROM lots WHERE tenant_id = ?` | ✅ No risk — 282 rows is trivially small |
| `is_occupied` check | Sub-query: `EXISTS (SELECT 1 FROM users WHERE lot_id = lots.id AND tenant_id = ?)` | ✅ No risk at 38 users — but add the lot-level check in the same query as lot listing to avoid N+1 |

#### Lot Dropdown Optimization

With **282 lots**, loading all into a dropdown is acceptable. No virtual scrolling or search-as-you-type needed. However:
- **Sort by `lot_number`** (natural sort if alphanumeric, e.g. "Lot 1", "Lot 2", ... "Lot 282")
- **Cache with SWR/React Query** — lot list is static-ish; cache for the session to avoid re-fetching

#### Handoff Log
```
→ Phase 3 Step 1 (Schema Analysis): access_requests table designed. 3 indexes identified — recommended composite index.
→ Phase 3 Step 2 (Live Introspection): Supabase MCP confirmed lots=282, users=38. No performance risks at current scale.
→ Phase 3 Step 3 (N+1 Analysis): 4 query patterns reviewed. All low risk. Lot dropdown is trivially small.
```

🔁 **[PHASE 3 COMPLETE]** Handing off to Documentation Writer...

### Phase 4: Documentation Logic

#### Mandatory Documentation Audit

| # | Category | Path | Relevant? | Action |
|---|----------|------|-----------|--------|
| 1 | **User Manuals — Resident** | `docs/01-manuals/resident-guide/` | ✅ Yes | **[NEW]** `request-access.md` — How to request access from the login page, including CR checkbox explanation and lot selection |
| 2 | **User Manuals — Admin** | `docs/01-manuals/admin-guide/` | ✅ Yes | **[NEW]** `review-access-requests.md` — How to review, filter by CR status, understand lot context badges, and approve requests |
| 3 | **Analytics** | `docs/02-technical/analytics/` | ✅ Yes | **[UPDATE]** `posthog-analytics.md` — Add events: `access_request_submitted`, `access_request_approved`, `access_request_rejected` |
| 4 | **API** | `docs/02-technical/api/` | ✅ Yes | **[NEW]** `access-requests.md` — Endpoint specs for `POST /api/v1/access-request` and `GET /api/v1/lots` (both public/unauthenticated) |
| 5 | **Architecture** | `docs/02-technical/architecture/domains/` | ✅ Yes | **[NEW]** `access-requests.md` — Domain architecture for the access request lifecycle. Also **[UPDATE]** `identity.md` if it exists (add access_requested state to auth lifecycle) |
| 6 | **Flows** | `docs/02-technical/flows/` | ✅ Yes | **[NEW]** `auth/request-access-flow.md` — Sequence diagram: request → admin review → approve → create resident → invite |
| 7a | **Schema — Tables** | `docs/02-technical/schema/tables/` | ✅ Yes | **[NEW]** `access_requests.md` — Full table definition with column descriptions, constraints, and temporary column flags |
| 7b | **Schema — Policies** | `docs/02-technical/schema/policies/` | ✅ Yes | **[NEW]** `access_requests.md` — Plain English: "No RLS policies. Backend-First: service_role only. RLS enabled with zero policies." |
| 8 | **Infrastructure** | `docs/02-technical/infrastructure/` | 🟡 Partial | **[UPDATE]** — Document any new env vars if needed (e.g., rate-limit config). No new services required. |

#### Documentation Gaps Identified (New — Feb 25 Re-Review)

The following are **new or reinforced** gaps discovered during this re-review:

| Gap | Criticality | Notes |
|-----|------------|-------|
| Missing `docs/02-technical/flows/auth/` directory entirely | 🔴 Critical | Directory doesn't exist. Needed for request-access flow AND password-reset flow |
| Missing `docs/02-technical/schema/tables/lots.md` | 🟡 Medium | Lots table is central to this feature. Already logged Jan 27 but still missing. |
| Missing analytics events for access request lifecycle | 🟡 Medium | `access_request_submitted`, `_approved`, `_rejected` not defined |
| Missing `docs/02-technical/architecture/domains/identity.md` | 🟡 Medium | Auth lifecycle should document `access_requested` as a pre-user state |

#### Handoff Log
```
→ Phase 4 Step 1 (Documentation Audit): 8 categories audited. 7 require new files, 2 require updates.
→ Phase 4 Step 2 (Gap Analysis): 4 new/reinforced gaps identified. Critical: missing flows/auth/ directory.
→ Phase 4 Step 3 (Gap Logging): Updated docs/documentation_gaps.md.
```

🔁 **[PHASE 4 COMPLETE]** Documentation gaps logged. Handing off to Strategic Alignment...

### Phase 5: Strategic Alignment & Final Scoring

#### Classification Matrix (Re-assessed)

| Dimension | Assessment | Rationale |
|-----------|-----------|-----------|
| **Priority** | **P1 — High** | Self-service access request reduces admin burden and enables community growth. Directly supports user acquisition pipeline. |
| **Size** | **M — Medium (~1 sprint)** | Scoped to 6 new files + 2 modified files. No infra changes. Email deferred to separate issue. |
| **Horizon** | **Now** | Foundations are in place (login form link exists, middleware ready, rate-limiting infrastructure ready). |
| **Risk** | **Low → Medium** | Two critical findings from security audit (unauthenticated rate-limiting gap, lots RLS blocking) are well-understood and have clear mitigations. Pre-existing `useFamilyByLot` violation is not blocking. |

#### Dependency Analysis

| Dependency | Status | Impact on #99 |
|-----------|--------|---------------|
| **Issue #70** (Password Reset) | ✅ Merged | No conflict. Login form shared space is already updated. |
| **Login Form** (`login-form.tsx`) | ✅ Ready | Link to `/request-access` already exists (line 261). No further changes needed. |
| **Rate Limiting** (`lib/rate-limit.ts`) | ⚠️ Needs extension | Existing infrastructure supports authenticated. New `withPublicRateLimit()` wrapper needed. |
| **Create Resident Wizard** (`create-resident-form.tsx`) | ✅ Ready | Admin approval flow pre-populates this wizard. No changes to wizard itself. |
| **Email Automation** (Resend) | ⏸️ Deferred | Explicitly out of scope per Feb feedback. Separate issue to be created. |

#### Blockers & Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | Unauthenticated API abuse (spam) | Medium | High | `withPublicRateLimit()` with 3 req/60s per IP |
| R2 | Cross-tenant lot injection | Low | High | Server-side slug→tenant_id resolution + lot ownership validation |
| R3 | Lot dropdown performance at scale (100s of lots) | Low | Low | 282 lots currently — trivial. Monitor if tenant grows to 1000+. |
| R4 | Feature flag missing — no way to disable access requests | Low | Medium | Add `access_requests_enabled` boolean to `tenants` table (follows existing pattern) |

#### Final Review Score

| Phase | Score | Notes |
|-------|-------|-------|
| **Phase 0: Context** | 9/10 | Comprehensive re-review with full impact map and dependency check |
| **Phase 1: Security** | 8/10 | 6 vectors analyzed, 2 critical findings with clear mitigations. Pre-existing violation flagged. |
| **Phase 2: Test Strategy** | 8/10 | 10 sad paths, 19 test cases across layers, 8 manual steps |
| **Phase 3: Performance** | 9/10 | Live data introspection. Schema designed with indexes. No performance risks. |
| **Phase 4: Documentation** | 7/10 | 8 categories audited, 4 gaps logged. Some gaps are pre-existing. |
| **Phase 5: Strategic** | 8/10 | Clear classification, dependencies mapped, 4 risks identified and mitigated |
| **Average** | **8.2/10** | |

#### Verdict

> ✅ **Ready for Development** — Issue #99 is well-scoped, security-reviewed, and performance-validated. Two critical security items (unauthenticated rate-limiting, lots RLS bypass) require implementation attention but have clear solutions. Email automation is correctly deferred. Recommend proceeding to `/03_scope` for sprint planning.

#### Pre-Conditions for Development

1. ✅ Requirements document updated with re-review (this section)
2. ✅ Security findings documented with mitigations
3. ✅ Test strategy defined with test file locations
4. ✅ Performance validated with live data
5. ✅ Documentation gaps logged
6. ⬜ **Action**: Post summary to GitHub Issue #99 as a comment (next step)

---

*Re-Review completed: Feb 25, 2026 | Pipeline: `/02_review` v2 | Issue: #99*
