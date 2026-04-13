---
title: "Audit 2026-04-11: Supabase Module Review"
date: 2026-04-11
type: module
focus: security, code quality, understanding
scope: supabase/migrations/, lib/supabase/
---

# Audit: Supabase Module Review

**Date**: 2026-04-11  
**Type**: Module (Supabase)  
**Focus**: Security, Code Quality, Understanding  
**Scope**: `supabase/migrations/`, `lib/supabase/`

---

## Context

This module-level audit covers the Supabase implementation for the Ecovilla Community Platform:
- **Database Schema**: 50+ tables in `supabase/migrations/`
- **Client Libraries**: 4 files in `lib/supabase/`
- **RLS Policies**: Tenant isolation across all tables

**Wiki Reference**: `knowledge/wiki/patterns/supabase-multi-tenancy.md` — tenant_id mandate, RLS defaults

---

## Prior Work

- **Full Codebase Audit** (2026-04-11): Found security, performance, and quality issues
- **Prior Audits**: 5 existing audits in `knowledge/raw/audits/`
- **Wiki Patterns**: 11 patterns available

---

## Findings Summary

### Critical (2)

| ID | Finding | Location |
|----|---------|-----------|
| C1 | Admin client used without authorization verification | `app/actions/onboarding.ts`, `app/actions/interests.ts`, API routes |
| C2 | Missing incoming request validation (IDOR vector) | Multiple server actions accepting userId |

### High (5)

| ID | Finding | Location |
|----|---------|-----------|
| H1 | Río tables rely on triggers for tenant_id population | `supabase/migrations/20260319000000_rio_foundation.sql` |
| H2 | Mastra tables use current_setting() without fallback | `supabase/migrations/20260329000000_harden_memory_storage_rls.sql` |
| H3 | Storage bucket allows authenticated SELECT (not least privilege) | `supabase/migrations/20260326090000_secure_documents_bucket.sql` |
| H4 | Interests/skills tables use USING(true) - violates tenant isolation | `supabase/migrations/clean_schema_final.sql` |
| H5 | users.tenant_id is NULLABLE | Schema gap |

### Medium (4)

| ID | Finding | Location |
|----|---------|-----------|
| M1 | Middleware 60-second grace period for session timeout | `lib/supabase/middleware.ts` |
| M2 | Cookie sameSite: "lax" instead of "strict" | `lib/supabase/middleware.ts` |
| M3 | Junction tables without explicit tenant_id | Multiple junction tables |
| M4 | Duplicate privacy tables (privacy_settings vs user_privacy_settings) | Schema |

### Low (3)

| ID | Finding | Location |
|----|---------|-----------|
| L1 | Old migration files left in place | `20260318000000_OUTDATED_*` |
| L2 | No request timeout on getUser() in middleware | `lib/supabase/middleware.ts` |
| L3 | Migration naming inconsistency | Some use sprint numbers |

---

## Understanding Mapping

### Schema Overview

| Category | Count | Notes |
|----------|-------|-------|
| Total Tables | ~50 | Core domain entities |
| Tables with tenant_id | ~40 | Strong multi-tenancy |
| Tables without tenant_id | ~10 | Junction tables (acceptable) |
| Tables with RLS | ~45 | Good coverage |
| Storage Buckets | 4 | avatars, documents, mastra, memory |

### Client Architecture

| File | Purpose | Auth Model |
|------|---------|------------|
| `client.ts` | Browser client | Public anon key + RLS |
| `server.ts` | Server client | Cookie-based sessions |
| `admin.ts` | Service role | Bypasses RLS (server-only) |
| `middleware.ts` | Session refresh | Auto-logout + tenant redirect |

### RLS Patterns Used

| Pattern | Tables | Security |
|---------|--------|----------|
| `auth.jwt() ->> 'tenant_id'` | Rio tables | ✅ Strong |
| `current_setting('app.current_tenant')` | Mastra tables | ⚠️ Requires SET |
| `auth.uid() = id` | users (self-access) | ✅ Strong |
| Path-prefixing | Storage buckets | ✅ Strong |

---

## Detailed Findings

### C1: Admin Client Without Authorization (CRITICAL)

**Files Affected**:
- `app/actions/onboarding.ts` — functions: `updateBasicInfo`, `updateContactInfo`, `updateJourney`
- `app/actions/interests.ts` — uses admin client directly at module level
- `app/api/link-resident/route.ts`
- `app/t/[slug]/invite/[token]/validate-invite-action.ts`
- `app/t/[slug]/invite/[token]/create-auth-user-action.ts`
- `app/backoffice/invite/[token]/create-auth-user-action.ts`

**Pattern - VULNERABLE**:
```typescript
export async function updateBasicInfo(userId: string, data: {...}) {
    const supabase = createAdminClient()  // ← NO auth verification
    await supabase.from("users").update({...}).eq("id", userId)
}
```

**Pattern - CORRECT** (from `app/actions/profile.ts`):
```typescript
const supabaseAuth = await createClient()
const { data: { user } } = await supabaseAuth.auth.getUser()
if (!user) throw new Error("Unauthorized")
if (user.id !== userId) throw new Error("Forbidden")
const supabase = createAdminClient()
```

**Recommendation**: Add authorization check BEFORE every admin client operation.

---

### H1: Río Tables RLS Depends on Triggers (HIGH)

**Location**: `supabase/migrations/20260319000000_rio_foundation.sql`

**Risk**: Río tables rely on triggers (`sync_rio_metadata_to_columns`) to populate tenant_id from metadata JSONB. If trigger fails or metadata is missing, tenant_id is NULL, bypassing isolation.

**Recommendation**: Add CHECK constraint ensuring tenant_id IS NOT NULL on inserts.

---

### H3: Storage Bucket Authenticated SELECT (HIGH)

**Location**: `supabase/migrations/20260326090000_secure_documents_bucket.sql`

**Finding**: Policy grants SELECT to ANY authenticated user:
```sql
CREATE POLICY "Authenticated Read Access For Documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documents');
```

**Recommendation**: Remove this policy. Access should only work through signed URLs.

---

### H4: Interests/Skills USING(true) (HIGH)

**Location**: `supabase/migrations/clean_schema_final.sql` (lines 3635, 3639)

**Finding**: RLS policies use `USING (true)` allowing ANY authenticated user to modify ANY row.

**Recommendation**: Add tenant-scoped policies checking user's tenant_id matches.

---

### H5: users.tenant_id NULLABLE (HIGH)

**Finding**: The core users table has nullable tenant_id, violating the multi-tenancy mandate.

**Recommendation**: Migration to make NOT NULL with default handling for existing data.

---

## Recommendations

### Immediate (This Sprint)

- [ ] Fix C1: Add auth verification to all admin client usage
- [ ] Fix H5: Make users.tenant_id NOT NULL
- [ ] Fix H3: Remove authenticated SELECT on documents bucket

### Short-term (Next Sprint)

- [ ] Fix H4: Add tenant-scoped policies to interests/skills
- [ ] Fix H1: Add CHECK constraint on Río tables
- [ ] Audit all server actions for IDOR vectors

### Medium-term (Backlog)

- [ ] Fix H2: Add explicit DENY to Mastra RLS policies
- [ ] Consolidate duplicate privacy tables
- [ ] Add request timeout to middleware auth calls
- [ ] Clean up OUTDATED migration files

---

## Files Analyzed

### Supabase Migrations
- `supabase/migrations/20260329000000_harden_memory_storage_rls.sql`
- `supabase/migrations/20260326090000_secure_documents_bucket.sql`
- `supabase/migrations/20260325000000_rio_tenant_indices.sql`
- `supabase/migrations/20260323000000_remediate_rio_config_sprint_11.sql`
- `supabase/migrations/20260322231001_remediate_rio_rpcs_final.sql`
- `supabase/migrations/20260322000004_fix_rio_rls_jwt_pattern.sql`
- `supabase/migrations/20260319000000_rio_foundation.sql`
- `supabase/migrations/clean_schema_final.sql`
- ... (50+ migration files)

### Client Libraries
- `lib/supabase/client.ts` (7 lines)
- `lib/supabase/server.ts` (33 lines)
- `lib/supabase/admin.ts` (30 lines)
- `lib/supabase/middleware.ts` (133 lines)
- `lib/supabase/middleware.test.ts` (93 lines)

---

## Conclusion

| Category | Assessment |
|----------|------------|
| **Security** | Needs immediate fixes (2 CRITICAL, 5 HIGH) |
| **Code Quality** | Good patterns, some gaps in enforcement |
| **Multi-tenancy** | Strong foundation with enforcement gaps |

**Overall**: The Supabase implementation has solid foundations but requires immediate security fixes, particularly around admin client usage and RLS policy gaps.