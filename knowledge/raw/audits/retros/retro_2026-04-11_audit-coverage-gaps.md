---
title: "Retro 2026-04-11: Codebase Audit Review — Coverage & Gap Analysis"
date: 2026-04-11
type: retro
scope: Full audit corpus review, wiki compilation assessment, gap identification
---

# Retro: Codebase Audit Review — Coverage & Gap Analysis

**Date**: 2026-04-11
**Scope**: Review all existing audits, wiki compilation, and refactoring files to identify what was missed, what's duplicated, and what's still open.

---

## 1. Audit Corpus Inventory

### Audits Completed (2026-04-11)

| Audit | Type | Scope | Findings |
|-------|------|-------|----------|
| `audit_2026-04-11_full_codebase.md` | Top-level | Entire codebase | 5 security, 8 performance, type safety |
| `audit_2026-04-11_app_module.md` | Module | `app/` directory | 5 security, 6 performance, quality |
| `audit_2026-04-11_components_module.md` | Module | `components/` | 6 security, 7 performance, quality |
| `audit_2026-04-11_lib_module.md` | Module | `lib/` directory | 5 security, 5 performance, quality |
| `audit_2026-04-11_supabase_module.md` | Module | `supabase/` + `lib/supabase/` | 2 CRITICAL, 5 HIGH, 4 MEDIUM |
| `audit_2026-04-11_packages_module.md` | Module | `packages/rio-agent` | 2 MEDIUM security, performance notes |
| `audit_2026-04-11_api_crosscutting.md` | Cross-cutting | API routes, actions, data layer | 5 Critical, 5 High, 4 Medium |
| `audit_2026-04-11_auth_crosscutting.md` | Cross-cutting | Auth, sessions, authorization | 1 Critical, 2 High, 3 Medium |
| `audit_2026-04-11_data_flow_crosscutting.md` | Cross-cutting | Data flow end-to-end | 3 Critical, 6 High, 5 Medium |

### Supporting Material

| Category | Count | Location |
|----------|-------|----------|
| Refactoring opportunities | 30 | `knowledge/raw/refactoring/` |
| Framework reviews | 13 | `knowledge/raw/audits/framework-reviews/` |
| Agent template reviews | 14 | `knowledge/raw/audits/agent-templates/` |
| Wiki patterns | 22 | `knowledge/wiki/patterns/` |
| Wiki lessons | 40 | `knowledge/wiki/lessons/` |
| Wiki concepts | 10 | `knowledge/wiki/concepts/` |
| Wiki tools | 5 | `knowledge/wiki/tools/` |
| Wiki domains | 5 | `knowledge/wiki/domains/engineering/` |

---

## 2. Deduplication Analysis — Findings That Appear Across Multiple Audits

Several findings were independently discovered by multiple audits. This is expected (cross-cutting concerns surface in multiple scopes) but creates noise. Here's the deduplication map:

### 🔴 CRITICAL: Admin Client Without Authorization (IDOR)

**Found in**: full_codebase, supabase_module, data_flow_crosscutting, api_crosscutting (4 of 9 audits)

**Unified finding**: `app/actions/onboarding.ts` and `app/actions/interests.ts` use `createAdminClient()` without verifying the caller's identity. Any authenticated user can modify any other user's data.

**Status**: 🔴 OPEN — No evidence of fix

### 🔴 CRITICAL: Missing Rate Limiting on Password Reset

**Found in**: full_codebase, app_module, auth_crosscutting (3 of 9 audits)

**Unified finding**: `app/actions/auth-actions.ts:63-145` has no application-level rate limiting.

**Status**: 🔴 OPEN — No evidence of fix

### 🟡 HIGH: N+1 Flag Count Queries

**Found in**: full_codebase, app_module, lib_module, data_flow_crosscutting, components_module (5 of 9 audits)

**Unified finding**: `lib/data/events.ts:265-276` makes one RPC call per event for flag counts. Same pattern in exchange listings.

**Status**: 🟡 OPEN — Wiki pattern `batch-rpc-counts.md` exists but no code fix

### 🟡 HIGH: Debug Console.log with PII

**Found in**: lib_module, data_flow_crosscutting, components_module (3 of 9 audits)

**Unified finding**: 56+ `console.log`/`console.error` statements across `lib/`, including PII (user IDs, names) in `lib/data/residents.ts:158-184`.

**Status**: 🟡 OPEN — Refactoring files exist but no evidence of cleanup

### 🟡 HIGH: Rate Limiting Fails Open

**Found in**: lib_module, data_flow_crosscutting (2 of 9 audits)

**Unified finding**: `lib/rate-limit.ts:31-36` returns `{ success: true }` when Redis is unavailable, bypassing all rate limiting in production.

**Status**: 🟡 OPEN — Wiki lesson `rate-limiting.md` exists but no code fix

### 🟡 MEDIUM: Double-Query Pattern

**Found in**: full_codebase, lib_module, data_flow_crosscutting (3 of 9 audits)

**Unified finding**: `getEventById` and `getResidentById` make two DB calls when one suffices.

**Status**: 🟡 OPEN — Wiki lesson `double-query-pattern.md` exists but no code fix

### 🟡 MEDIUM: `any` Type Proliferation

**Found in**: full_codebase, app_module, lib_module, components_module, data_flow_crosscutting (5 of 9 audits)

**Unified finding**: 185+ `any` types in data layer, 40+ in components. `resident: any`, `family: any`, `event: any`.

**Status**: 🟡 OPEN — Wiki pattern `type-safe-data-layer.md` exists but no code fix

---

## 3. What Was MISSED — Unaudited Codebase Areas

### 🔴 CRITICAL GAP: No CI/CD Pipeline Audit

**Finding**: There is **no `.github/workflows/` directory**. The project has zero CI/CD automation.

**Impact**:
- No automated lint/type-check on PRs
- No automated test runs
- `next.config.mjs` sets `ignoreDuringBuilds: true` and `ignoreBuildErrors: true` — builds succeed even with type errors and lint violations
- No deployment gates — Vercel auto-deploys from `main` without quality checks
- The AGENTS.md explicitly warns: "always run `lint` and `type-check` manually before pushing" — but there's nothing enforcing this

**Recommendation**: Create GitHub Actions workflows for lint, type-check, test, and build verification on every PR.

### 🔴 CRITICAL GAP: No E2E Test Coverage Audit

**Finding**: Only 4 E2E tests exist (`e2e/` directory):
- `chat_hydration.test.ts`
- `geojson-upload.spec.ts`
- `product-tour.spec.ts`
- `series-rsvp.spec.ts`

**Impact**: No E2E coverage for critical user flows: login, onboarding, event creation, exchange, admin operations, password reset.

**Recommendation**: Prioritize E2E tests for auth flows and critical business paths.

### 🟡 HIGH GAP: Backoffice Module Not Deeply Audited

**Finding**: The backoffice (`app/backoffice/`) was mentioned in the auth cross-cutting audit (backoffice login email enumeration) but the full backoffice module was never audited as a unit.

**Unaudited files**:
- `app/backoffice/dashboard/page.tsx` — Super admin dashboard
- `app/backoffice/dashboard/tenants/[id]/features/tenant-features-form.tsx` — Feature flag management
- `app/backoffice/dashboard/tenants/[id]/edit/edit-tenant-form.tsx` — Tenant editing
- `app/backoffice/invite/[token]/create-auth-user-action.ts` — Auth user creation (flagged in supabase audit but not deeply reviewed)

**Impact**: Super admin interface has elevated privileges — any vulnerability here is high-severity.

**Recommendation**: Dedicated backoffice security audit.

### 🟡 HIGH GAP: Cron Jobs Not Audited

**Finding**: Two cron jobs exist but were never audited:
- `app/api/cron/archive-announcements/route.ts`
- `app/api/cron/check-return-dates/route.ts`

**Impact**: Cron jobs run with elevated privileges (Vercel cron). No audit of:
- Authentication/authorization on cron endpoints (are they publicly accessible?)
- Error handling and idempotency
- Data integrity of batch operations

**Recommendation**: Audit cron job security and reliability.

### 🟡 HIGH GAP: i18n System Not Audited

**Finding**: The i18n system (`lib/i18n/`) with English and Spanish translations was never audited.

**Impact**:
- No audit of translation completeness (are `en.json` and `es.json` in sync?)
- No audit of i18n context provider for security
- Hardcoded strings in components may bypass i18n

**Recommendation**: i18n completeness and consistency audit.

### 🟡 MEDIUM GAP: Upload/Storage Security Not Deeply Audited

**Finding**: The components audit flagged "No server-side file type validation" but the actual upload endpoint (`/api/upload`) was not deeply reviewed.

**Impact**: File upload is a common attack vector (malicious files, path traversal, oversized uploads).

**Recommendation**: Dedicated upload security audit covering MIME validation, size limits, path traversal, and storage bucket policies.

### 🟡 MEDIUM GAP: Middleware.ts Not Deeply Audited

**Finding**: `middleware.ts` is only 10 lines (delegates to `lib/supabase/middleware.ts`). The actual middleware logic was reviewed in the auth audit but the thin wrapper's routing logic (which paths are skipped) was not verified against all route additions since the audit.

**Recommendation**: Verify middleware skip paths cover all necessary routes (especially new API endpoints).

### 💭 LOW GAP: Environment/Config Management Not Audited

**Finding**: No audit of:
- `.env.example` completeness
- Secret management practices
- Environment variable validation at startup
- `.agents/config.yaml` (contains project IDs)

**Recommendation**: Config hygiene audit.

### 💭 LOW GAP: Accessibility (a11y) Not Audited

**Finding**: No accessibility audit was performed. Components use shadcn/ui (which has a11y built in) but custom components may have gaps.

**Recommendation**: a11y audit of custom components, especially forms and interactive widgets.

---

## 4. Wiki Compilation Assessment — What's Compiled vs What's Missing

### Well-Compiled (Audit → Wiki)

| Audit Finding | Wiki Entry | Status |
|---------------|-----------|--------|
| Admin client auth | `patterns/admin-client-authorization.md` | ✅ Compiled |
| N+1 flag counts | `patterns/batch-rpc-counts.md` | ✅ Compiled |
| Double query | `lessons/double-query-pattern.md` | ✅ Compiled |
| PII in logs | `lessons/pii-log-redaction.md` | ✅ Compiled |
| Rate limiting fail-open | `lessons/rate-limiting.md` | ✅ Compiled |
| Zod validation | `patterns/zod-validation.md` | ✅ Compiled |
| Server actions | `patterns/server-actions.md` | ✅ Compiled |
| RLS triggers insufficient | `lessons/rls-triggers-are-not-enough.md` | ✅ Compiled |
| Password reset rate limiting | `lessons/password-reset-rate-limiting.md` | ✅ Compiled |
| Server-side filtering | `lessons/server-side-filtering.md` | ✅ Compiled |
| Type-safe data layer | `patterns/type-safe-data-layer.md` | ✅ Compiled |
| Default query limits | `patterns/default-query-limits.md` | ✅ Compiled |

### NOT Compiled — Audit Findings Missing from Wiki

| Audit Finding | Source Audit | Wiki Gap |
|---------------|-------------|----------|
| Backoffice login email enumeration | auth_crosscutting | No wiki lesson on auth enumeration patterns |
| Storage bucket authenticated SELECT | supabase_module | No wiki lesson on storage bucket least-privilege |
| Interests/skills USING(true) RLS | supabase_module | No wiki pattern for RLS policy review checklist |
| users.tenant_id NULLABLE | supabase_module | No wiki lesson on schema NOT NULL enforcement |
| Río tables trigger-dependent tenant_id | supabase_module | No wiki lesson on trigger vs constraint tradeoffs |
| Client-side filtering without pagination | components_module | `lessons/server-side-filtering.md` exists but doesn't cover the component-level pattern |
| Unmemoized derived state in render | components_module | No wiki pattern on React memoization checklist |
| Unvalidated image URLs (XSS vector) | components_module | `patterns/xss-prevention.md` exists but doesn't cover image URL validation |
| Error handling inconsistency (3 patterns) | multiple | No wiki pattern on standardized error handling |
| No CI/CD pipeline | THIS RETRO | No wiki lesson on CI/CD requirements |
| Cron job security | THIS RETRO | No wiki pattern on cron endpoint security |
| Upload endpoint security | THIS RETRO | No wiki pattern on file upload security |

### Wiki Entries Without Audit Backing

Some wiki entries were compiled from build logs and prior work, not from the formal audit:

| Wiki Entry | Source |
|-----------|--------|
| `patterns/cmdk-patterns.md` | Build log |
| `patterns/mobile-ui.md` | Build log |
| `patterns/offline-map.md` | Build log |
| `patterns/more-filters.md` | Build log |
| `patterns/exchange-constraints.md` | Build log |
| `lessons/navigation-debt.md` | Build log |
| `lessons/design-tokens.md` | Build log |

These are fine — they capture implementation patterns. But they haven't been validated against the current codebase state.

---

## 5. Refactoring File Assessment

30 refactoring opportunity files exist in `knowledge/raw/refactoring/`. Analysis:

### Duplicated Refactoring Files (Same Finding, Multiple Files)

| Finding | Duplicate Files | Should Consolidate |
|---------|-----------------|-------------------|
| N+1 flag counts | `n_plus_1_event_flag_counts.md`, `n1_flag_counts.md`, `n1_flag_counts_events.md`, `n1_flag_counts_exchange.md`, `n_plus_1_flag_queries.md` | → Single `n1_flag_counts.md` |
| Debug logging | `debug_console_removal.md`, `debug_logging_pii.md`, `debug-logging-production.md`, `pii_logs.md`, `remove-debug-logs.md` | → Single `debug-logging-cleanup.md` |
| Type safety | `any_types_data_layer.md`, `data_layer_types.md`, `onboarding-any-types.md`, `type_safety.md` | → Single `type-safety-data-layer.md` |
| Zod validation | `zod_events_action.md`, `zod_profile_action.md`, `zod-validation-request-form.md` | → Single `zod-validation-gaps.md` |
| Double query | `double_query_event_by_id.md`, `double_query_resident_by_id.md` | → Single `double-query-pattern.md` |

**Recommendation**: Consolidate 30 files → ~15 unique refactoring items.

### Refactoring Files With No Status Tracking

None of the 30 refactoring files have a `status` field (open/in-progress/done). It's impossible to tell which have been addressed.

**Recommendation**: Add `status: open|in-progress|done` frontmatter to all refactoring files.

---

## 6. Open Critical Findings — Action Required

### 🔴 Still Open (Must Fix)

| # | Finding | First Identified | Audits That Found It | Fix Effort |
|---|---------|-----------------|---------------------|------------|
| 1 | Admin client without authorization (IDOR) | 2026-04-11 | 4 of 9 | Medium |
| 2 | No rate limiting on password reset | 2026-04-11 | 3 of 9 | Low |
| 3 | No CI/CD pipeline | 2026-04-11 | THIS RETRO | Medium |
| 4 | Storage bucket authenticated SELECT | 2026-04-11 | 1 of 9 | Low |
| 5 | Interests/skills USING(true) RLS | 2026-04-11 | 1 of 9 | Low |
| 6 | users.tenant_id NULLABLE | 2026-04-11 | 1 of 9 | Medium |

### 🟡 Still Open (Should Fix)

| # | Finding | Audits | Fix Effort |
|---|---------|--------|------------|
| 7 | N+1 flag count queries | 5 of 9 | Medium |
| 8 | Debug console.log with PII (56+ instances) | 3 of 9 | Low |
| 9 | Rate limiting fails open | 2 of 9 | Low |
| 10 | `any` type proliferation (185+ instances) | 5 of 9 | High |
| 11 | Double-query patterns | 3 of 9 | Low |
| 12 | Backoffice login email enumeration | 1 of 9 | Low |
| 13 | Missing Zod on events/profile actions | 2 of 9 | Low |
| 14 | Client-side filtering without pagination | 1 of 9 | High |
| 15 | Unmemoized derived state in components | 1 of 9 | Medium |
| 16 | Error handling inconsistency (3 patterns) | 3 of 9 | Medium |
| 17 | Cron job security unaudited | THIS RETRO | Low |
| 18 | Upload endpoint security unaudited | THIS RETRO | Medium |

---

## 7. Recommendations — Priority Order

### Phase 1: Critical Security (This Week)

1. **Fix IDOR in onboarding/interests actions** — Add auth verification before admin client usage (reference: `app/actions/profile.ts`)
2. **Add rate limiting to password reset** — 3 requests per minute per tenant
3. **Remove authenticated SELECT on documents bucket** — Switch to signed URLs only
4. **Fix USING(true) on interests/skills tables** — Add tenant-scoped RLS policies
5. **Create CI/CD pipeline** — GitHub Actions for lint + type-check + test on every PR

### Phase 2: High Priority (Next Sprint)

6. **Fix N+1 flag count queries** — Create batch RPC
7. **Remove all debug console.log statements** — 56+ instances across lib/
8. **Make rate limiting fail-closed** — Deny requests when Redis unavailable
9. **Fix backoffice login email enumeration** — Query by auth user ID
10. **Add Zod validation to events/profile actions**
11. **Audit cron job endpoints** — Verify auth and idempotency
12. **Audit backoffice module** — Super admin interface security review

### Phase 3: Quality Improvements (Backlog)

13. **Replace `any` types** — Start with `lib/data/` (highest impact)
14. **Fix double-query patterns** — Accept tenantId param in getEventById
15. **Standardize error handling** — Pick one pattern, enforce everywhere
16. **Add server-side filtering** — Requests list pagination
17. **Add React memoization** — useMemo/useCallback in data-heavy components
18. **Consolidate refactoring files** — 30 → 15 with status tracking
19. **Compile missing wiki entries** — 12 gaps identified in Section 4
20. **i18n completeness audit** — Verify en.json/es.json parity
21. **Upload security audit** — MIME validation, size limits, path traversal
22. **Accessibility audit** — Custom components a11y review

---

## 8. Meta-Lessons — Audit Process Itself

### What Went Well

- **Comprehensive scope**: 9 audits covering modules + cross-cutting concerns
- **Good deduplication in wiki**: 22 patterns, 40 lessons compiled from raw findings
- **Refactoring capture**: 30 opportunity files created (even if they need consolidation)
- **Cross-referencing**: Audits cited prior work and wiki references

### What Could Improve

1. **No fix tracking**: Audits identified problems but there's no system tracking which fixes were applied. Need a "findings → fixes" ledger.
2. **Refactoring file sprawl**: 30 files with duplicates and no status tracking. Need consolidation and status fields.
3. **No CI/CD means no enforcement**: Even if all fixes are made, nothing prevents regressions without automated checks.
4. **Missing areas**: Backoffice, cron, i18n, upload, and a11y were not covered. Future audits should have a pre-flight checklist of ALL codebase areas.
5. **Wiki gaps not surfaced during audits**: Audits found issues but didn't always file wiki gaps. The `documentation-gaps.md` file only has 5 entries despite 12+ gaps identified.

---

## 9. Audit Coverage Scorecard

| Area | Audited? | Depth | Gaps |
|------|----------|-------|------|
| `app/actions/` | ✅ Yes | Deep | IDOR still open |
| `app/api/v1/` | ✅ Yes | Deep | Some routes unaudited |
| `app/api/cron/` | ❌ No | — | **CRITICAL GAP** |
| `app/api/dashboard/` | ⚠️ Partial | Performance only | No security audit |
| `app/api/upload/` | ❌ No | — | **HIGH GAP** |
| `app/t/[slug]/` pages | ⚠️ Partial | Via components audit | No page-level audit |
| `app/backoffice/` | ⚠️ Partial | Auth only | **HIGH GAP** |
| `app/auth/` | ✅ Yes | Deep | — |
| `components/` | ✅ Yes | Deep | — |
| `lib/data/` | ✅ Yes | Deep | — |
| `lib/supabase/` | ✅ Yes | Deep | — |
| `lib/api/` | ✅ Yes | Deep | — |
| `lib/i18n/` | ❌ No | — | MEDIUM GAP |
| `lib/validation/` | ⚠️ Partial | Via other audits | — |
| `lib/ai/` | ⚠️ Partial | Via packages audit | — |
| `packages/rio-agent/` | ✅ Yes | Deep | — |
| `supabase/migrations/` | ✅ Yes | Deep | — |
| CI/CD | ❌ No | — | **CRITICAL GAP** |
| E2E tests | ❌ No | — | **HIGH GAP** |
| Accessibility | ❌ No | — | LOW GAP |
| Environment/config | ❌ No | — | LOW GAP |

**Coverage**: 14 of 20 areas audited (70%). 6 areas have no or partial coverage.

---

*Retrospective completed: 2026-04-11*
*Next retro recommended: After Phase 1 fixes applied*
