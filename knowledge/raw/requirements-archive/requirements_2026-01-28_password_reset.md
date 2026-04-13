source: requirement
imported_date: 2026-04-08
---
# Requirements: Admin-Mediated Password Reset

## Problem Statement
The application currently lacks a way for users to reset their passwords if they forget them. Since the system does not have automated email or SMS services configured for the current alpha phase, a manual, admin-mediated process is required to ensure users can regain access to their accounts securely.

## User Persona
- **Resident**: A user who has an existing account but has lost their password.
- **Admin**: A community manager or super admin who facilitates the password reset process.

## Context
Existing authentication is handled via Supabase. The system already has an "Invitation" mechanism that uses unique tokens to allow users to set their initial passwords. This project aims to adapt that pattern for password recovery.

## User Stories
- **RS-1**: As a Resident, I want to request a password reset from the login screen so that I can notify an admin that I've lost access.
- **RS-2**: As an Admin, I want to receive a notification when a resident requests a password reset so that I can take action promptly.
- **RS-3**: As an Admin, I want to generate a secure, one-time-use link for a specific resident that allows them to set a new password.
- **RS-4**: As a Resident, I want to use the link provided by my admin to securely set a new password and log back in.

## Functional Requirements
1.  **Request Flow**:
    - The login screen shall include a "Forgot Password?" link.
    - Clicking the link shall open a form requesting the user's email.
    - Upon submission, the system shall verify if a resident with that email exists.
    - If the user exists, the system shall create a "Password Reset Request" (likely a new record in `resident_requests` or a specific notification).
    - The user shall receive a confirmation message: "Request sent. Your admin has been notified. They will contact you with a reset link."
2.  **Admin Flow**:
    - Admins shall see password reset requests in their dashboard/requests area.
    - Admins shall have a button (e.g., in the Resident's edit form or the request details) to "Generate Reset Link".
    - Generating the link shall create a unique, time-limited token associated with the user's account.
    - The system shall display the reset link for the admin to copy and share manually.
3.  **Reset Flow**:
    - The reset link shall direct the user to a dedicated password reset page (`/t/[slug]/password-reset/[token]`).
    - The page shall validate the token's existence and expiration.
    - If valid, the user shall be presented with "New Password" and "Confirm Password" fields.
    - Upon successful reset, the user's password in Supabase Auth shall be updated, the token invalidated, and the user redirected to the login page.

## Non-Functional Requirements
- **Security**: Tokens must be securely generated (UUID) and stored. Reset tokens must expire after a configurable period (e.g., 24 hours).
- **Audit**: Admin actions related to generating reset links should be logged if possible.

## Dependencies
- **Supabase Auth**: Required for password updates via the Admin API (`service_role`).
- **Resident Requests**: Potential integration with the existing requests/notifications system.

## Documentation Gaps
- Missing official authentication flow documentation.
- Missing Admin and Resident guides for manual password recovery.
- Migration required for storing reset tokens or reusing `invite_token`.

## Technical Options

### Option 1: Minimalist (Reuse Existing Schema)
- **Mechanism**: Reuse `users.invite_token` and `users.invited_at` for password resets.
- **Implementation**:
    - **Request**: User submits email on Login -> Create `resident_request` record.
    - **Admin**: Admin clicks "Reset" -> Server action generates UUID in `users.invite_token`.
    - **Reset**: landing page validates `invite_token` and uses Support Role to update password.
- **Pros**:
    - Fast implementation (2-3 hours).
    - Zero database migrations.
    - Leverages existing "Invite" link UI patterns.
- **Cons**:
    - Semantic debt (reusing "invite" for "reset").
    - Cannot distinguish between an active invite and an active reset request in the DB.
- **Effort**: Low (S)

### Option 2: Clean Separation (Dedicated Schema)
- **Mechanism**: Add `reset_token` and `reset_token_expires_at` to the `users` table via migration.
- **Implementation**:
    - **Request**: Same as Option 1.
    - **Admin**: Server action updates the dedicated reset fields.
    - **Reset**: Dedicated logic that checks the specific reset fields and expiry time.
- **Pros**:
    - Architecturally clean; no conflicts with the onboarding flow.
    - Explicit expiration control (e.g., reset links expire in 4 hours vs 24 hours for invites).
- **Cons**:
    - Requires database migration.
    - Slightly more boilerplate in server actions.
- **Effort**: Medium (M)

### Option 3: Ephemeral Request Tokens
- **Mechanism**: Store the reset token within the `resident_requests` table metadata.
- **Implementation**:
    - **Request**: Create `resident_request` with a `token` field in the payload.
    - **Admin**: Admin "approves" the request, which activates the token already in the request record.
    - **Reset**: Validation queries the `resident_requests` table directly.
- **Pros**:
    - Keeps the `users` table strictly for profile/auth state.
    - Perfect audit trail (the token is tied to the request record).
- **Cons**:
    - Diverges from the existing pattern where tokens are on the `users` table.
    - Slightly more complex verification queries.
- **Effort**: Medium (M)


## Recommendation

### Selected Solution: Option 4 (Secure Private Table)
Following the **Technical Review (Phase 1)**, the initial recommendation of Option 2 (adding tokens to `public.users`) was deemed a **Critical Security Risk** due to RLS policies exposing user data to the user themselves (risk of session hijacking).

**New Recommendation**: Implement a **Dedicated Private Table** (`private.password_resets`) that is NOT exposed via the public API or RLS. All interactions must occur via `security definer` Server Actions.

### Metadata
- **Priority**: P0
- **Size**: M
- **Horizon**: Q1 26
- **Status**: Ready for Development


## 8. Technical Review

### Phase 0: Issue Details
- **Title**: [Brainstorm] Password Reset Feature
- **Original ID**: 152669783
- **Extraction Date**: 2026-01-29

### Phase 0: Impact Map
- **Frontend**: `app/t/[slug]/login/login-form.tsx` (Needs UI update for "Forgot Password")
- **Backend**: 
  - New DB columns/table for reset tokens.
  - New Server Actions for requesting/generating resets.
  - Integration with `app/actions/resident-requests.ts` if using the generic request system.
- **Dependencies**: Supabase Auth, `resident_requests` table.

### Phase 0: Historical Context
- **Login Module**: Deeply refactored ~Jan 16 (Commit `3dfa31c`) to improve UX and remove auto-login.
- **Request Module**: `resident-requests.ts` handles creation/updates.

### Phase 1: Security Audit
- **Vibe Check**: 
  - ⚠️ **Critical Risk**: The recommendation to add `reset_token` to `public.users` is dangerous. The `users_select_own` policy makes all columns visible to the authenticated user. If a session is hijacked, the attacker could read a newly generated reset token if it exists.
  - **Recommendation**: Create a dedicated `password_resets` table with NO public RLS access (only accessible via Security Definer functions) or use a hashed token approach.
- **Attack Surface**:
  - **Enumeration**: Request endpoint must not reveal if an email exists (always say "If account exists, request sent").
  - **Spam**: `createResidentRequest` needs rate limiting to prevent flooding admins.
  - **Token Handling**: Tokens should be short-lived (e.g., 1 hour) and invalidated after use.

### Phase 2: Test Strategy
- **Sad Paths**:
  - Request pending while another exists (Debounce/Throttle).
  - Invalid/Expired Token usage.
  - Admin attempting to reset Super Admin (Role hierarchy check).
- **Test Plan**:
  - **Unit**: Token generation (ensure high entropy), Expiry validation logic.
  - **Integration**: `requestPasswordReset` creates `resident_request`. `verifyRecoveryToken` validates hash.
  - **E2E**: Full flow: Request -> Admin Generate -> Reset -> Login.

### Phase 3: Performance Assessment
- **Schema Impact**: Low. New table `private.password_resets` is minimal.
- **Query Impact**: Requests are low frequency. Index on `token_hash` required.

### Phase 4: Documentation Plan
- **Manuals**:
  - Update `resident-guide.md`: "How to recover access".
  - Update `admin-guide.md`: "Processing Password Reset Requests".
- **Technical**:
  - New `docs/02-technical/flows/auth/password-reset.md`.
  - Update `docs/02-technical/schema/tables/resident_requests.md` (new request type).

### Phase 5: Strategic Alignment
- **Decision**: **Prioritize**. Critical missing feature for self-service/low-admin-overhead management.
- **Sizing**: **Medium** (requires new secure schema, admin UI, and public pages).

## 9. Specification (Consolidated)

### Database Schema
Create a new table `private.password_resets` (not exposed via API):
```sql
create table private.password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) not null,
  token_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_by uuid references public.users(id), -- Admin who generated it
  created_at timestamptz default now()
);
```

### Workflow
1.  **Resident Request**: User submits email on Login page.
    - System checks `users` table (internal function).
    - If found, creates `resident_requests` entry (Type: `password_reset`).
    - UI shows "If an account exists, a request has been sent."
2.  **Admin Action**:
    - Admin sees request in Dashboard.
    - Clicks "Generate Recovery Link".
    - System generates high-entropy token, hashes it -> `private.password_resets`.
    - Returns link: `https://app.nido.com/auth/reset?token=...`
3.  **Recovery**:
    - Resident clicks link.
    - Server verifies hash & expiry.
    - If valid, allow `updateUser` password change.
    - Mark token `consumed`.


## 10. Technical Review (Self-Service Transition)

### Phase 0: Issue Details
- **Title**: [Requirement] Password Reset Feature
- **Current ID**: 70
- **Extraction Date**: 2026-02-14
- **Snapshot**: Transitioning from Admin-Mediated to **Self-Service Email-Based Reset** using Supabase Auth native capabilities (PKCE).

### Phase 0: Impact Map
- **Frontend**:
    - `app/t/[slug]/login/login-form.tsx`: Add "Forgot Password?" link.
    - `app/t/[slug]/forgot-password/page.tsx`: **[NEW]** Page to request reset link.
    - `app/t/[slug]/update-password/page.tsx`: **[NEW]** Page to set new password.
    - `middleware.ts`: Verify if update-password route protection is needed or handled by component.
- **Backend / API**:
    - `app/auth/confirm/route.ts`: **[NEW]** PKCE token exchange route.
    - `app/actions/auth-actions.ts`: Check for existing auth actions; likely need new wrappers if not using client-side auth directly for reset (issue implies `supabase.auth.resetPasswordForEmail`).
- **Dependencies**:
    - Supabase Auth Configuration (Email Templates).
    - `users` table (standard Supabase Auth integration).

### Phase 0: Historical Context
- **Login Component**: `components/library/login-form.tsx` refactored Nov 2025 for design tokens and layout.
- **Auth Actions**: `app/actions/auth-actions.ts` exists (needs verification).
- **Previous Decision**: Admin-mediated approach was previously selected (Jan 28) but is now superseded by Self-Service (Issue #70).

### Phase 1: Security Audit
- **Vibe Check**:
    - **Rule: Backend-First**: While `supabase.auth.resetPasswordForEmail` is convenient client-side, it exposes the app to unthrottled requests and lacks app-specific logging.
    - **Recommendation**: **Wrap the reset request in a Server Action**. This allows us to strict rate-limit requests (prevent email spam) and log attempts for security audits, adhering to "Backend-First" principles.
    - **Rule: Data Minimization**: By using native auth, we avoid storing sensitive tokens in our own tables. Good.
- **Attack Surface**:
    - **Email Enumeration**: The UI must display a generic success message ("If an account exists...") regardless of whether the email is found. Supabase API returns 200 OK for non-existent emails by default (good security practice). Verify this behavior.
    - **Spam / DoS**: Publicly accessible form needs rate limiting.
        - *Risk*: Malicious actor triggers 1000 emails to `target@example.com` or floods the system.
        - *Mitigation*: Server Action with rate limiting (IP-based or simple text-captcha if needed, though hidden is better). Captcha might be overkill for MVP, but rate limiting is essential.
    - **Open Redirect**: The `redirectTo` parameter in the client-side call can be manipulated.
        - *Mitigation*: Hardcode the redirect URL in the Server Action or strict allowlist validation.
        - *Recommendation*: Use `{{ .SiteURL }}/auth/confirm` as the base and ensure it handles the `next` param safely.

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Rate Limit Exceeded**: User requests reset > 3 times in 1 minute. Should see "Too many requests, please try again later."
    - **Invalid Email Format**: Client-side validation (Zod) blocks submission.
    - **Service Down**: Supabase API unavailable. Application handles 5xx error gracefully.
    - **Expired Token**: User clicks old link. `update-password` page detects invalid hash/error param and prompts to request new link.
- **Test Plan**:
    - **Unit Tests (`vitest`)**:
        - Create `app/actions/__tests__/auth-actions.test.ts`:
            - Mock `supabase.auth.resetPasswordForEmail`.
            - Verify rate limiter logic (if implemented in action).
            - Verify generic response on success/failure.
    - **E2E Tests (`playwright`)**:
        - Create `e2e/auth-reset.spec.ts`:
            - **Flow 1**: Navigate to Login -> Click "Forgot Password" -> Verify URL `/t/[slug]/forgot-password`.
            - **Flow 2**: Submit invalid email (no `@`) -> Verify client-side Zod error.
            - **Flow 3**: Submit valid email -> Verify success toast/message appears.
    - **Manual Verification**:
        - Dev Env: Trigger reset -> Check `Inbucket` (http://localhost:54324) -> Click link -> Verify redirect to `update-password` -> Set new password -> Login.

### Phase 3: Performance Assessment
- **Schema Impact**: None (Leverages existing `auth.users`).
- **Query Impact**: Minimal. `resetPasswordForEmail` is indexed by email internally in Supabase Auth.
- **Bottlenecks**: Email delivery latency (provider dependent). Ensure UI shows "Check your email" immediately and doesn't block.

### Phase 4: Documentation Plan
- **User Manuals**:
    - Update `docs/01-manuals/resident-guide.md`: Add "How to Reset Password" section.
    - Update `docs/01-manuals/admin-guide.md`: Remove "Manual Reset" instructions (or keep as fallback if Self-Service fails?). Mark as "Superseded by Self-Service".
- **Technical Docs**:
    - Create `docs/02-technical/flows/auth/password-reset.md`: Mermaid diagram of the PKCE flow.
- **Gaps to Log**:
    - Missing `docs/02-technical/flows/auth/` directory structure.
    - Missing explicit `auth-actions.ts` documentation.

### Phase 5: Strategic Alignment & Decision
- **Context Scan**:
    - **Issue #108 (Double Login Regression)**: Highly relevant. Password reset flow involves redirects and session checks. The `auth/confirm` route must ensure the `last-active` cookie is handled or bypassed correctly to prevent immediate logout after reset.
    - **Issue #99 (Request Access)**: Shared real estate on the login page. Coordinate UI placement.
- **Decision**: **Prioritize (Ready for Development)**.
- **Sizing**: **S (Small)**. Transitioning to native Supabase Auth significantly reduces complexity compared to the previous admin-mediated plan.
- **Recommendation**: Proceed with implementation, ensuring the `auth/confirm` route handles PKCE exchange robustly and links to a secure `update-password` page.

## 11. Definition of Done (DoD)
- [ ] **Functional**: Forgot Password link exists and navigates correctly.
- [ ] **Functional**: Reset email is sent via Supabase (verify in Inbucket).
- [ ] **Functional**: `auth/confirm` route correctly exchanges token for session.
- [ ] **Functional**: User can set new password on `update-password` page and login.
- [ ] **Security**: No email enumeration (generic success message).
- [ ] **Security**: Reset request wrapped in Server Action for potential rate limiting.
- [ ] **Testing**: Vitest unit tests for server actions pass.
- [ ] **Testing**: Playwright E2E flow cover success and failure (invalid email).
- [ ] **Documentation**: `resident-guide.md` and technical flow docs updated.
- [ ] **Alignment**: Coordinate UI with Issue #99 to maintain a clean login screen.



