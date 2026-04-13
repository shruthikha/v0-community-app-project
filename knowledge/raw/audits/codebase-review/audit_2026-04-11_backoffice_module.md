# Audit: Backoffice Module (app/backoffice/)

**Date**: 2026-04-11
**Type**: module
**Focus**: security, performance, quality, understanding
**Scope**: `app/backoffice/` (all files), related API routes (`app/api/seed-*`), related components

## Context

The backoffice module is the super-admin interface for managing tenants, tenant admins, and platform-wide feature flags. It was flagged as a **HIGH GAP** in `retro_2026-04-11_audit-coverage-gaps.md` — only the auth cross-cutting audit touched the login page (email enumeration). This is a full deep-dive audit.

## Prior Work

| Source | Coverage |
|--------|----------|
| `audit_2026-04-11_auth_crosscutting.md` | Backoffice login email enumeration (HIGH), inconsistent error handling, no shared login component |
| `audit_2026-04-11_data_flow_crosscutting.md` | Mentioned `create-auth-user-action.ts` in data flow |
| `audit_2026-04-11_supabase_module.md` | Mentioned `create-auth-user-action.ts` |
| `audit_2026-04-11_app_module.md` | Listed backoffice as super-admin interface |
| `retro_2026-04-11_audit-coverage-gaps.md` | Explicitly flagged backoffice as HIGH GAP |
| `knowledge/raw/refactoring/2026-04-11_backoffice-login-enumeration.md` | Refactoring opportunity for login enumeration |

## Understanding Mapping

### Structure

```
app/backoffice/
├── dashboard/
│   ├── layout.tsx              # Server component: auth + role guard + sidebar shell
│   ├── page.tsx                # Server component: tenant list table
│   ├── create-tenant/
│   │   └── page.tsx            # Client component: tenant + optional admin creation form
│   └── tenants/[id]/
│       ├── page.tsx            # Server component: view tenant details
│       ├── edit/
│       │   ├── page.tsx        # Server component: fetches tenant, renders form
│       │   └── edit-tenant-form.tsx  # Client: edit tenant, admin, delete
│       └── features/
│           ├── page.tsx        # Server component: fetches tenant, renders form
│           └── tenant-features-form.tsx  # Client: feature flags (712 lines)
├── invite/[token]/
│   ├── page.tsx                # Server component: validates invite token, renders signup
│   ├── create-auth-user-action.ts  # Server action: creates Supabase auth user via admin API
│   └── tenant-admin-signup-form.tsx  # Client: password set + sign-in form
└── login/
    └── page.tsx                # Client component: email/password login + role check
```

### Entry Points

| Route | Purpose | Type |
|-------|---------|------|
| `/backoffice/login` | Super admin login | Client page |
| `/backoffice/dashboard` | Tenant list | Server page + layout |
| `/backoffice/dashboard/create-tenant` | Create tenant + optional admin | Client page |
| `/backoffice/dashboard/tenants/[id]` | View tenant details | Server page |
| `/backoffice/dashboard/tenants/[id]/edit` | Edit tenant | Server page + Client form |
| `/backoffice/dashboard/tenants/[id]/features` | Feature flags | Server page + Client form |
| `/backoffice/invite/[token]` | Tenant admin signup | Server page |
| `/api/seed-event-categories` | Seed event categories | API route |
| `/api/seed-exchange-categories` | Seed exchange categories | API route |

### Data Flow

1. **Login**: Client → Supabase Auth (signInWithPassword) → Query `users` table by email → Check role → Redirect
2. **Dashboard**: Server component → `createClient()` → `auth.getUser()` → Query `users.role` → Query `tenants` → Render
3. **Create Tenant**: Client → `createClient()` → Insert `tenants` → Optionally insert `users` → Update `tenants.tenant_admin_id`
4. **Edit Tenant**: Client → `createClient()` → Check existing user by email → Insert/update `users` → Update `tenants`
5. **Delete Tenant**: Client → `createClient()` → Check neighborhoods/residents → Delete `tenants`
6. **Feature Flags**: Client → `createBrowserClient()` → Update `tenants` features JSON + boolean columns → POST to seed APIs
7. **Invite Flow**: Server page → `createClient(SUPABASE_SERVICE_ROLE_KEY)` → Query `users` by `invite_token` → Client form → Server action `createAuthUserAction` → `createAdminClient().auth.admin.createUser()` → Sign in → Redirect

### Dependencies

- `@/lib/supabase/server` — Server-side Supabase client
- `@/lib/supabase/client` — Browser Supabase client (`createClient`, `createBrowserClient`)
- `@/lib/supabase/admin` — Admin client (service role key)
- `@/components/ui/*` — shadcn/ui primitives (sidebar, card, button, input, etc.)
- `@/components/invite-link-dialog` — Invite link display dialog
- `@/hooks/use-toast` — Toast notifications

## Findings

### CRITICAL

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| C1 | **Service role key used in server component** | `app/backoffice/invite/[token]/page.tsx` (lines 23-42) | The invite page creates a Supabase admin client directly using `process.env.SUPABASE_SERVICE_ROLE_KEY` in a server component. While server components are not exposed to the browser, this bypasses RLS entirely and uses a different pattern than the rest of the codebase. Should use `createAdminClient()` from `@/lib/supabase/admin` for consistency and centralized key management. |
| C2 | **No auth guard on edit tenant page** | `app/backoffice/dashboard/tenants/[id]/edit/page.tsx` | The edit page fetches tenant data but does NOT check authentication or super_admin role. It relies on the layout for auth, but the layout only wraps `dashboard/` — the edit page is at `dashboard/tenants/[id]/edit/` which IS under dashboard, so the layout DOES apply. However, the page itself has no independent auth check (unlike view/features pages). If the layout is ever changed, this page becomes unprotected. Add explicit auth check for defense-in-depth. |

### HIGH

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| H1 | **Email enumeration in login** | `app/backoffice/login/page.tsx` (lines 36-40) | Queries `users` table by email after auth. If email doesn't exist, the error reveals that. Already flagged in auth audit. Fix: query by auth user ID after successful auth, or use a generic error message. |
| H2 | **Client-side tenant deletion with no server-side authorization** | `app/backoffice/dashboard/tenants/[id]/edit/edit-tenant-form.tsx` (lines 167-210) | `handleDelete` runs entirely in the browser using the anon key client. While RLS should prevent non-super-admins from deleting, the deletion logic (checking for neighborhoods/residents) is client-side and can be bypassed. Move deletion to a server action with explicit super_admin verification. |
| H3 | **Client-side tenant creation with no server-side authorization** | `app/backoffice/dashboard/create-tenant/page.tsx` (lines 32-113) | Same pattern as H2. Tenant creation, admin user creation, and tenant_admin_id linking all happen client-side. A malicious user with a valid session could potentially manipulate this. Move to server action. |
| H4 | **Seed API routes lack CSRF protection** | `app/api/seed-event-categories/route.ts`, `app/api/seed-exchange-categories/route.ts` | These POST endpoints are called from the browser via `fetch()`. They check auth + role but have no CSRF token validation. An attacker could craft a malicious page that triggers these calls if the admin has an active session. Add CSRF validation or convert to server actions. |
| H5 | **Invite token never invalidated after use** | `app/backoffice/invite/[token]/create-auth-user-action.ts` | After the tenant admin completes signup, the `invite_token` remains in the database. The same token could theoretically be reused. Clear the token after successful account creation. |

### MEDIUM

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| M1 | **Excessive console.log statements** | Multiple files | `[v0]` prefixed console.log statements throughout create-tenant, edit-tenant, and invite pages. These leak internal state to server logs and browser console. Remove or replace with proper logging utility. |
| M2 | **Duplicate auth+role check pattern** | `dashboard/layout.tsx`, `dashboard/page.tsx`, `dashboard/tenants/[id]/page.tsx`, `dashboard/tenants/[id]/features/page.tsx` | Every server page repeats the same 10-line auth + role check. Extract to a shared `requireSuperAdmin()` server utility. |
| M3 | **`createClient()` called at module scope in form** | `edit-tenant-form.tsx` (line 55) | `const supabase = createClient()` is called at the top level of the component function, not inside event handlers. This creates a new client on every render. Move inside handlers or use `useMemo`. |
| M4 | **No Zod validation on any form inputs** | All client forms | Tenant name, email, maxNeighborhoods, etc. are validated only by HTML attributes (`required`, `type="email"`, `min="1"`). No server-side or client-side schema validation. Add Zod schemas for all mutation inputs. |
| M5 | **Slug collision not handled** | `create-tenant/page.tsx`, `edit-tenant-form.tsx` | `generateSlug()` is a simple client-side function. If two tenants have similar names, the slug could collide. The database likely has a unique constraint, but the error handling just throws the raw Supabase error to the user. Add explicit slug uniqueness check before insert. |
| M6 | **`alert()` used for user feedback** | `create-tenant/page.tsx` (line 102), `edit-tenant-form.tsx` (lines 178, 193, 207) | Uses browser `alert()` for success/error messages instead of the toast system used elsewhere in the app. Inconsistent UX. Replace with `useToast`. |
| M7 | **Feature toggle makes synchronous DB calls per toggle** | `tenant-features-form.tsx` (lines 302-399) | Each feature toggle triggers a `count` query to check for existing data before allowing disable. This is N+1 if a user rapidly toggles multiple features. Consider debouncing or batch validation. |
| M8 | **`window.location.origin` used for invite URL** | `create-tenant/page.tsx` (line 101), `edit-tenant-form.tsx` (line 134) | In SSR/SSG contexts or behind proxies, `window.location.origin` may not reflect the canonical URL. Use `NEXT_PUBLIC_APP_URL` env var if available. |

### LOW

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| L1 | **`edit-tenant-form.tsx` is 404 lines** | `edit-tenant-form.tsx` | Combines tenant editing, admin management, deletion, and invite logic. Split into smaller components: `TenantBasicInfoForm`, `TenantAdminForm`, `TenantDeleteDialog`. |
| L2 | **`tenant-features-form.tsx` is 712 lines** | `tenant-features-form.tsx` | Very large component with feature toggles, location types, Rio AI settings, and visibility scope. Split into sub-components per section. |
| L3 | **No loading skeleton on dashboard** | `dashboard/page.tsx` | Server component renders synchronously. No loading.tsx exists for the dashboard route. Add `loading.tsx` for better UX. |
| L4 | **Hardcoded gradient backgrounds** | Multiple pages | `bg-gradient-to-br from-primary/5 to-secondary/5` is repeated across pages. Extract to a shared layout wrapper or CSS variable. |
| L5 | **`AvatarImage` src is always undefined** | `dashboard/layout.tsx` (line 116) | `src={undefined || "/placeholder.svg"}` — the `undefined` is dead code. Simplify to `src="/placeholder.svg"` or remove the AvatarImage entirely. |

## Recommendations

### Immediate (Security)
- [ ] **C1**: Refactor invite page to use `createAdminClient()` instead of inline service role key usage
- [ ] **H1**: Fix email enumeration in backoffice login (query by auth user ID, not email)
- [ ] **H2**: Move tenant deletion to a server action with explicit super_admin verification
- [ ] **H3**: Move tenant creation to a server action with explicit super_admin verification
- [ ] **H4**: Add CSRF protection to seed API routes or convert to server actions
- [ ] **H5**: Clear invite_token after successful account creation

### Near-term (Quality)
- [ ] **M2**: Extract `requireSuperAdmin()` utility to eliminate duplicated auth checks
- [ ] **M4**: Add Zod validation to all form inputs and server actions
- [ ] **M1**: Remove or centralize console.log statements
- [ ] **M6**: Replace `alert()` calls with toast notifications
- [ ] **M5**: Add explicit slug uniqueness validation

### Future (Maintainability)
- [ ] **L1**: Split `edit-tenant-form.tsx` into smaller components
- [ ] **L2**: Split `tenant-features-form.tsx` into smaller components
- [ ] **L3**: Add loading.tsx for dashboard routes
- [ ] **M7**: Debounce feature toggle validation queries
