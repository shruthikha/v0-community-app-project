# Audit: Authentication (Cross-Cutting)

**Date**: 2026-04-11
**Type**: Cross-cutting: Auth
**Focus**: Security, Performance, Code Quality, Understanding
**Scope**: Authentication, session management, authorization

---

## Context

This audit spans the entire authentication and authorization system for the Ecovilla Community Platform. It covers:

- Login flows (tenant residents, backoffice admins, invites)
- Session management (middleware, cookies, timeouts)
- Password reset flows
- Authorization patterns (RLS, backend-first)
- User table and RLS policies

**Prior Wiki Reference:** `knowledge/wiki/patterns/backend-first-auth.md` — defense-in-depth pattern

---

## Prior Work

Wiki query found:
- `knowledge/wiki/patterns/backend-first-auth.md` — documents defense-in-depth auth pattern (RLS + backend-first)

Existing audits in `knowledge/raw/audits/`:
- `audit_2026-04-11_supabase_module.md`
- `audit_2026-04-11_components_module.md`
- `audit_2026-04-11_app_module.md`
- `audit_2026-04-11_lib_module.md`
- `audit_2026-04-11_packages_module.md`
- `audit_2026-04-11_full_codebase.md`

---

## Findings

### Critical

| Finding | File | Recommendation |
|---------|------|---------------|
| **Backoffice login queries users by email instead of auth user ID** | `app/backoffice/login/page.tsx` (lines 36-43) | Query users table by `user.id` instead of `email` to prevent email enumeration and ensure consistency with tenant login flow |

### High

| Finding | File | Recommendation |
|---------|------|---------------|
| **Session refresh on every request in middleware** | `lib/supabase/middleware.ts` (line 43) | Consider caching session check or adding an auth cache to reduce DB load |
| **No rate limiting on password reset endpoint** | `app/actions/auth-actions.ts` (lines 63-145) | Add rate limiting to prevent abuse of password reset flow |

### Medium

| Finding | File | Recommendation |
|---------|------|---------------|
| **Inconsistent error handling in login flows** | `app/t/[slug]/login/login-form.tsx` vs `app/backoffice/login/page.tsx` | Normalize error handling between tenant and backoffice login |
| **Debug logging in production code persists** | Multiple files (e.g., `app/t/[slug]/login/login-form.tsx` lines 131-139) | Ensure debug logs are stripped for production builds |
| **No dedicated auth test suite** | No auth-specific tests found | Create auth integration tests |

### Low

| Finding | File | Recommendation |
|---------|------|---------------|
| **Magic constants not centralized** | `auth-actions.ts`, `middleware.ts` | Extract timeout values to shared constants |
| **Two separate login pages share no component** | `app/t/[slug]/login/`, `app/backoffice/login/` | Consider shared login component for maintainability |

---

## Understanding Mapping

### Auth Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Tenant Login** | `app/t/[slug]/login/login-form.tsx` | Resident email/password authentication with tenant validation |
| **Backoffice Login** | `app/backoffice/login/page.tsx` | Super admin authentication |
| **Auth Middleware** | `lib/supabase/middleware.ts` | Session refresh and timeout enforcement |
| **Auth Actions** | `app/actions/auth-actions.ts` | Server actions for password reset/update |
| **Auth Confirm Route** | `app/auth/confirm/[slug]/route.ts` | Password reset token exchange |
| **Invite Validation** | `app/t/[slug]/invite/[token]/validate-invite-action.ts` | Timing-safe invite token validation |
| **Create Auth User** | `app/t/[slug]/invite/[token]/create-auth-user-action.ts` | Admin client for creating auth users during onboarding |

### Entry Points

1. **Tenant Login** (`/t/[slug]/login`)
   - User submits email + password
   - Supabase `signInWithPassword`
   - Tenant validation via users table query
   - Redirect to dashboard or admin dashboard

2. **Backoffice Login** (`/backoffice/login`)
   - User submits email + password
   - Supabase `signInWithPassword`
   - Role check for `super_admin`
   - Redirect to backoffice dashboard

3. **Password Reset** (`/t/[slug]/forgot-password`)
   - User submits email
   - Server action checks tenant + resident
   - Supabase sends reset email with tenant-encoded redirect

4. **Token Exchange** (`/auth/confirm/[slug]`)
   - Validates recovery OTP type
   - Exchanges code/token for session
   - Validates AMR claim (must include "recovery")

5. **Invite Flow** (`/t/[slug]/invite/[token]`)
   - Validates invite token (timing-safe)
   - Creates auth user with admin client
   - Links to resident record

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  LOGIN FLOW                                              │
│  ┌───────────┐     ┌──────────────────┐    ┌─────────┐ │
│  │ Login    │────▶│ Supabase Auth     │───▶│ Users   │ │
│  │ Form    │     │ signInWithPassword│    │ Table  │ │
│  └───────────┘     └──────────────────┘    └─────────┘ │
│       │                                           │      │
│       ▼                                           ▼      │
│  ┌────────────┐                          ┌──────────┐  │
│  │ Cookie     │◀─────────┬───────────────▶│ Tenant  │  │
│  │ Set       │           │                 │ Check   │  │
│  └────────────┘           │                 └──────────┘  │
│             ┌────────────┘                                 │
│             ▼                                              │
│  ┌─────────────────────────────────────┐                   │
│  │ Middleware (session refresh)        │◀────────────────┘
│  │ - 2hr timeout (if no remember me)    │
│  │ - Session refresh on every request  │
│  └─────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

### Patterns Used

1. **Defense-in-Depth**
   - RLS for tenant isolation (from `public.users`)
   - Backend-first authorization in server actions
   - Session validation in middleware

2. **Timing-Safe Comparison**
   - Invite token validation uses `crypto.timingSafeEqual`
   - Prevents timing attacks on token comparison

3. **Anti-Enumeration**
   - Password reset always returns `{ success: true }`
   - No user existence revealed via error messages

4. **Session Persistence**
   - Two modes: strict (2hr timeout) and remember (30 days)
   - Stored in httpOnly, secure, sameSite cookies

### Dependencies

| Module | Used By |
|--------|---------|
| `@supabase/ssr` | All auth flows |
| `@supabase/auth-helpers-nextjs` | Deprecated, not in use |
| `lib/supabase/server.ts` | Server actions |
| `lib/supabase/client.ts` | Client components |
| `lib/supabase/admin.ts` | Invite/privileged flows |

---

## Recommendations

### Immediate (High Priority)

- [ ] Fix backoffice login to query users by auth user ID instead of email
- [ ] Add rate limiting to password reset action
- [ ] Review debug logging in login form for production

### Future (Medium Priority)

- [ ] Create auth integration tests
- [ ] Consider shared login component
- [ ] Extract magic constants to shared config
- [ ] Implement session caching in middleware

---

## Security Summary

### Strengths

- ✅ RLS policies properly configured for user isolation
- ✅ Timing-safe token comparison
- ✅ Anti-enumeration on password reset
- ✅ httpOnly, secure, sameSite cookies
- ✅ Middleware skips auth paths to avoid session corruption
- ✅ OTP type validation in auth/confirm
- ✅ Email validation during invite flow

### Areas of Concern

- ⚠️ Backoffice login queries by email (enumeration risk)
- ⚠️ No rate limiting on password reset
- ⚠️ Debug logging persists in production

---

*Audit completed: 2026-04-11*