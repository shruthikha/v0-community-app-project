# Build Log: Password Reset Feature
**Issue:** #70 | **Date:** 2026-02-22 | **Status:** ✅ QA Complete — Ready to Merge

## Context
- **PRD Link**: TBA
- **Req Link**: [requirements_2026-01-28_password_reset.md](../../02_requirements/requirements_2026-01-28_password_reset.md)
- **Board Status**: Password reset flow working. Added tenant-scoped resident check to prevent non-residents from receiving reset emails.

## Clarifications (Socratic Gate)
**Answers from User:**
1. **Rate Limiting**: Built-in Supabase limits are acceptable. No custom rate limiting needed for now.
2. **UI Overlap (Issue #99)**: Stacked layout on the login form: first "Request Access", then "Forgot Password".
3. **Redirect Flow**: We will redirect the user to the manual login screen after successfully resetting the password, instead of auto-logging them in.

## Progress Log

### 2026-02-22: Initial Implementation
- Activated Build Phase 0. Checked out branch `feat/70-password-reset`.
- Implemented login form links, forgot-password page, update-password page, and `auth/confirm` route.
- User reported incorrect redirect to unstyled root `/login`. Investigating `auth/confirm` and site URL configuration.

### 2026-02-22: Debugging Phase 1 — `undefined` slug in URLs
- **Symptom**: URLs contained `/t/undefined/login` instead of the tenant slug.
- **Root Cause**: `ForgotPasswordPage` and `UpdatePasswordPage` were not awaiting `params` (required in Next.js 15+ where `params` is a `Promise`).
- **Fix**: Awaited `params` in both page components and passed the resolved `slug` to child forms.
- **Result**: ✅ Fixed — URLs now correct.

### 2026-02-22: Debugging Phase 2 — "Reset link is invalid or has expired"
- **Symptom**: Clicking the password reset email link always showed "The reset link is invalid or has expired."
- **Root Cause**: The `auth/confirm` route only handled `token_hash` params, but Supabase's default email templates (`{{ .ConfirmationURL }}`) redirect through the Supabase API and return a `?code=` param instead.
- **Fix**: Added `code` handling via `exchangeCodeForSession` in `auth/confirm/route.ts`.
- **Result**: ⚠️ Partially fixed — still getting errors (see Phase 3).

### 2026-02-22: Debugging Phase 3 — Supabase email rate limiting
- **Symptom**: "Email rate limit exceeded" when requesting password reset.
- **Root Cause**: Supabase's built-in SMTP limits emails to 3 per hour per email address.
- **Action**: Documented rate limits for user. Suggested using custom SMTP or different test email.
- **Result**: ℹ️ Not a code issue — operational constraint.

### 2026-02-22: Debugging Phase 4 — "Auth session missing!" on password update submission
- **Symptom**: User reached the Update Password form successfully but got "Auth session missing!" when submitting the new password.
- **Hypothesis 1**: `NextResponse.redirect()` vs `redirect()` — Tried switching to `redirect()` from `next/navigation`.
- **Result**: ❌ Did not fix. User still redirected to login with recovery session error.
- **Hypothesis 2**: Middleware timeout (Issue #108) destroying the recovery session.
- **Result**: ❌ Partially correct — see Phase 5.

### 2026-02-22: Debugging Phase 5 — Middleware destroying session on `/auth/confirm`
- **Symptom**: Server logs showed middleware enforcing timeout on `/auth/confirm` route:
  ```
  [v0] Middleware Debug: Enforcing timeout. lastActive=undefined
  [v0] Middleware Debug: Grace period FAILED. diff=140796
  [v0] Middleware: Session timed out. Logging out.
  ```
- **Root Cause**: Middleware intercepted `/auth/confirm` and called `signOut()` before the route handler could exchange the code. No `remember-me` or `last-active` cookie existed for the recovery flow. Grace period check on `last_sign_in_at` failed (diff > 60s).
- **Fix**: Added `/auth/` path exclusion to middleware timeout enforcement.
- **Result**: ⚠️ Fixed the timeout issue, but revealed the next problem (Phase 6).

### 2026-02-22: Debugging Phase 6 — `next` query parameter lost by Supabase
- **Symptom**: After fixing the middleware, user landed on login page without any error message.
- **Root Cause**: Supabase strips query parameters from the `redirect_to` URL during its own redirect chain. Our `?next=/t/ecovilla-san-mateo/update-password` was silently dropped. Route handler defaulted `next` to `/`, which hit `app/page.tsx` → `redirect("/t/ecovilla-san-mateo/login")`.
- **Fix**: Encoded the tenant slug in the URL **path** instead of as a query param. Changed `redirect_to` from `/auth/confirm?next=...` to `/auth/confirm/ecovilla-san-mateo`. Created dynamic route `app/auth/confirm/[slug]/route.ts`.
- **Result**: ⚠️ Route handler now correctly receives the slug, but session still doesn't persist (Phase 7).

### 2026-02-23: Debugging Phase 7 — Session cookies not persisting across redirect
- **Symptom**: Server logs show code exchange succeeds (307 redirect, no error) but `UpdatePasswordPage` finds no active session:
  ```
  GET /auth/confirm/ecovilla-san-mateo?code=xxx 307
  [v0] UpdatePasswordPage: No active session found for tenant ecovilla-san-mateo. Redirecting to login.
  GET /t/ecovilla-san-mateo/update-password 307
  ```
- **Hypothesis 1**: `cookies()` from `next/headers` doesn't merge into `NextResponse.redirect()`.
  - **Fix attempted**: Rewrote route handler to use middleware-style cookie pattern (`createServerClient` writing directly to `response.cookies`).
  - **Result**: ❌ Same symptom.
- **Hypothesis 2**: Middleware's `getUser()` call refreshing stale session, overwriting route handler cookies.
  - **Fix attempted**: Added early return in middleware for `/auth/` paths before `getUser()`.
  - **Result**: ❌ Same symptom.
- **Status**: 🟡 Root cause identified (see Phase 7b).

### 2026-02-23: Debugging Phase 7b — Hostname mismatch `0.0.0.0` vs `localhost`
- **Symptom**: Diagnostic logs confirmed `setAll` IS called, 2 cookies ARE on the response, exchange succeeds with session. But redirect URL was `http://0.0.0.0:3000/...` while the browser connected via `http://localhost:3000/...`.
- **Root Cause**: Next.js 16 with `-H 0.0.0.0` sets `request.url` hostname to `0.0.0.0`. Using `new URL(path, request.url)` generated redirects to `0.0.0.0`. Cookies set for `localhost` are NOT sent to `0.0.0.0` — different hostnames to the browser.
- **Fix**: Used the `Host` header from the request to construct redirect URLs instead of `request.url`.
- **Result**: ✅ **Password reset flow fully working!** User successfully reset password through the complete flow.

### 2026-02-23: Phase 8 — Tenant-Scoped Resident Check
- **Requirement**: User requested that only registered residents of the current tenant should receive password reset emails.
- **Implementation**:
  - Created `check_resident_email` Postgres RPC function (`SECURITY DEFINER`)
  - `resetPassword` server action now checks tenant membership before sending
  - Always returns `{ success: true }` to prevent email enumeration
  - Updated success message: "If you are a current resident in this community, you will receive an email with password reset instructions."
- **Iterations**:
  - ❌ v1: Joined `auth.users` to `residents` table on `r.id = u.id` → `residents` table is empty (unused).
  - ❌ v2: Changed join to `r.auth_user_id = u.id` → still empty, `residents` table not used in this project.
  - ❌ v3: Added UNION with `residents.email` direct check → still fails, table has 0 rows.
  - ✅ v4: Discovered app uses `public.users` table (not `residents`). Fixed RPC to query `users` where `role = 'resident'` and `tenant_id` matches.
- **Result**: ✅ Working — verified via SQL: `check_resident_email('test@email', tenant_id) → true`.

## Files Modified
| File | Status | Purpose |
|------|--------|---------|
| `app/t/[slug]/forgot-password/page.tsx` | Modified | Await `params` (Next.js 15+) |
| `app/t/[slug]/forgot-password/forgot-password-form.tsx` | Modified | Pass `tenantSlug`, style success UI |
| `app/t/[slug]/update-password/page.tsx` | Modified | Await `params`, add server-side session check |
| `app/t/[slug]/update-password/update-password-form.tsx` | Modified | Accept `tenantSlug` prop, style success UI |
| `app/t/[slug]/login/login-form.tsx` | Modified | Add "Forgot Password" link |
| `app/actions/auth-actions.ts` | Modified | Encode slug in URL path; tenant-scoped resident check |
| `app/auth/confirm/route.ts` | **Deleted** | Replaced by dynamic route |
| `app/auth/confirm/[slug]/route.ts` | **New** | Dynamic route; Host-header-based redirects; middleware-style cookies |
| `lib/supabase/middleware.ts` | Modified | Early return for `/auth/` paths, skip timeout for recovery paths |
| DB Migration: `add_check_resident_email_rpc` | **New** | Initial RPC (wrong table) |
| DB Migration: `fix_check_resident_email_join` | **New** | Fix join column |
| DB Migration: `fix_check_resident_email_both_paths` | **New** | Try multiple join paths |
| DB Migration: `fix_check_resident_email_use_users_table` | **New** | ✅ Final — uses `public.users` table |

## Decisions
- **Decision**: Encode tenant slug in URL *path* (not query param) for `redirect_to` because Supabase strips query params.
- **Decision**: Skip middleware `getUser()` entirely for `/auth/` paths to prevent cookie interference.
- **Decision**: Use middleware-style `createServerClient` in route handler (write cookies directly to response).
- **Decision**: Use `Host` header for redirect URLs instead of `request.url` to avoid hostname mismatch.
- **Decision**: Always return `{ success: true }` from `resetPassword` to prevent email enumeration.
- **Decision**: Use `public.users` table for resident check (not `residents` which is empty/unused).

## Blockers & Errors
- ✅ **Resolved**: Session cookie persistence — fixed by using `Host` header for redirect URLs.
- ✅ **Resolved**: Tenant-scoped check — fixed by using `public.users` table.
- ℹ️ **Rate Limit**: Supabase default SMTP limits to 3 emails/hour/address.

## Lessons Learned
- **Next.js 16 + `-H 0.0.0.0`**: `request.url` contains `0.0.0.0` as hostname, not the browser's actual hostname. Always use the `Host` header for constructing redirect URLs.
- **Supabase `redirect_to`**: Query parameters are stripped during Supabase's own redirect chain. Encode data in the URL path instead.
- **`NextResponse.redirect()` + cookies**: In Route Handlers, use the middleware-style `createServerClient` pattern (write cookies directly to the response) instead of `createClient()` which uses the `cookies()` store.
- **Middleware interference**: The middleware's `getUser()` call can refresh stale sessions and overwrite new session cookies. Skip middleware entirely for auth exchange paths.
- **Schema assumptions**: Always verify table names and column mappings against the actual database schema — don't assume table names from code patterns.

## Handovers
- Password reset flow is fully working including tenant-scoped check. Ready for Phase 5 (Closeout).

---

## QA Audit (2026-02-23)

### Phase 0: CodeRabbit Review
- **First review** (commit `0e5ca7f`): 8 actionable + 3 nitpick comments
- **Fix commit** (`7c4df08`): All 8 actionable items addressed
- **Remaining nitpicks** (2, low priority):
  - `update-password-form.tsx`: Unused `useRouter` import (dead code)
  - `update-password-form.tsx`: Hardcoded password min length 6 (matches Supabase default)
- **Build status**: ✅ Vercel deploys green on both environments

### Phase 1: Test Readiness Audit
- **E2E Tests**: No (E2E infrastructure not yet set up)
- **Unit Tests**: No (no auth-related unit tests exist)
- **Migrations Required**: Yes (1 — `check_resident_email` RPC, applied directly to Supabase)
- **Data Alignment**: Pass (RPC verified working against `public.users` table)
- **Coverage Gaps**: No automated test coverage for password reset flow

### Phase 2: Specialized Audit

**Security Findings:**
| Item | Result |
|------|--------|
| Email enumeration | ✅ Always returns `{ success: true }` |
| Open redirect | ✅ `NEXT_PUBLIC_APP_URL` env var configured |
| Tenant isolation | ✅ Fail-closed RPC gate |
| OTP type validation | ✅ Runtime allowlist `["recovery"]` |
| Error phishing | ✅ Error key allowlist in login page |
| Cookie security | ✅ `httpOnly`, `secure`, `sameSite: lax` |
| Middleware bypass | ✅ Early return for `/auth/` paths |

**Vibe Code Check: ✅ PASS**
- No frontend DB access (all via Server Actions)
- No new RLS policies (uses `SECURITY DEFINER`)
- No public buckets, no file uploads, no webhooks
- ✅ Zod validation added to all Server Action inputs

**Performance**: No impact — no new client bundles, heavy dependencies, or API calls in render path.

### Phase 3: Release Notes (Draft)

🔐 **Password Reset**
Residents can now securely reset their password from the community login page.

🏘️ **Tenant-Scoped Security**
Password reset emails are only sent to verified residents of each community, preventing cross-tenant information leakage.

🛡️ **Hardened Auth Flow**
Comprehensive security improvements including anti-phishing error messages, open-redirect prevention, and fail-closed tenant gating.

### Round 3: Final CodeRabbit Feedback (9 items)
All resolved in final commit:
1. **Empty origin guard** — `auth-actions.ts`: logs error and fails safely when origin is empty
2. **Zod `.transform()` for email** — `auth-actions.ts`: normalization co-located with schema
3. **`[v0]` → `[Auth]` log prefix** — `update-password-form.tsx`
4. **`aria-label` on toggle** — `update-password-form.tsx`: accessibility fix
5. **`autoComplete="new-password"`** — both password inputs
6. **Remove throw/catch indirection** — `update-password-form.tsx`: flat control flow
7. **AMR claim verification** — `route.ts`: PKCE code exchange now verifies `recovery` amr
8. **`ERROR_MESSAGES` to module scope** — `login/page.tsx`
9. **Remove `as any` cast** — `login/page.tsx`: tenant prop now properly typed

**Deferred**: `middleware.ts` → `proxy.ts` rename (Next.js 16+ convention, separate issue)

**Production migration**: `check_resident_email` RPC applied to `nido.prod` ✅
