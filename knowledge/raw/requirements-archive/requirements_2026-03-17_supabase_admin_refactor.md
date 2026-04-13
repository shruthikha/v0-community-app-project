source: requirement
imported_date: 2026-04-08
---
# Requirement: Tenant Address Migration & Admin Refactor (Issue #223)

## Goal
1. **Database Migration**: Add `address` to the `tenants` table.
2. **Refactor**: Resolve "supabaseKey is required" errors by centralizing Supabase admin client initialization.

## Context
1. **Tenant Creation**: The backoffice dashboard needed to capture physical addresses for new tenants.
2. **Invite Flow**: The "supabaseKey is required" error occurs because some server actions were manually initializing the Supabase client without correctly referencing the Service Role Key.

## Proposed Changes

### 1. Refactor `app/backoffice/invite/[token]/create-auth-user-action.ts`
- Replace manual `createClient` with `createAdminClient()`.
- Remove unused `createClient` import.

### 2. Refactor `app/t/[slug]/invite/[token]/create-auth-user-action.ts`
- Replace manual `createClient` with `createAdminClient()`.
- Eliminate redundant environment variable checks.

### 3. Refactor `app/t/[slug]/invite/[token]/validate-invite-action.ts`
- Replace manual `createClient` with `createAdminClient()`.

### 4. Refactor `app/api/link-resident/route.ts`
- Replace manual `createClient` with `createAdminClient()`.

## Verification Plan
1. **Manual Test (Tenant Invite)**: Follow an invite link, set a password, and verify the user is created in Auth without the "supabaseKey is required" error.
2. **Manual Test (Tenant Creation)**: Verify tenant creation in the backoffice still works (as it might have been partially affected by environment variable inconsistencies).
3. **Internal Consistency**: Ensure all four identified files are using the same `createAdminClient` pattern.

## Acceptance Criteria
- [ ] Error "supabaseKey is required" no longer appears during admin password setup.
- [ ] All four identified files use `@/lib/supabase/admin` and its `createAdminClient` function.
- [ ] Tenant admin invitation flow completes successfully.
