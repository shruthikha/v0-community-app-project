---
source: build-log
imported_date: 2026-04-08
---
# Build Log: Request Access on Login Page
**Issue:** #99 | **PR:** #138 | **Branch:** `feat/99-request-access` | **Status:** In Review
**Started:** 2026-02-25 | **Last Updated:** 2026-03-01

## Context
- **PRD Link**: `docs/07-product/03_prds/prd_2026-02-14_sprint_4_directory_and_access.md` (Section 5)
- **Req Link**: `docs/07-product/02_requirements/requirements_2026-02-09_request_access_login.md`
- **Board Status**: Issue #99 Open, PR #138 in review
- **Patterns Applied**: Backend-First service_role, IP-based rate limiting, fail-closed feature flags, PII-free URL params

## Decisions
- Dedicated `access_requests` table (per requirement doc Section 9)
- Email automation deferred to separate issue
- Feature flag `access_requests_enabled` on `tenants` table, defaults to `true`
- Service_role bypasses RLS for public insert — no anon INSERT policy needed
- PII never passed in URL query params — fetch by request ID instead

## Build Phases

### Phase A: Backend Foundation — `@backend-specialist`
- DB Migration: `access_requests` table + RLS + feature flag
- Admin client: `lib/supabase/admin.ts`
- Public rate limit: `lib/api/public-rate-limit.ts` (3 req/60s/IP)
- Zod schema: `lib/validation/access-request-schema.ts`
- API routes: `POST /api/v1/access-request`, `GET /api/v1/lots`
- **Commit:** `8cd1d7d`

### Phase B: Public Form — `@frontend-specialist`
- Server page: `app/t/[slug]/request-access/page.tsx` (tenant resolution + feature flag)
- Client form: `request-access-form.tsx` (searchable lot Combobox, CR checkbox, occupancy badges)
- **Commit:** `bc87edd`

### Phase C: Admin UI — `@frontend-specialist`
- Tabs on residents page (Residents + Access Requests)
- Access requests table with CR/Non-CR sub-tabs
- Approve → pre-populate create-resident wizard
- Reject with confirmation dialog
- **Commit:** `831ea40`

### Phase D: Integration & Verification
- Migration applied to dev DB (`ehovmoszgwchjtozsfjw`)
- Manual verification: form, search, tabs, approve/reject workflows
- Draft PR #138 created
- **Commit:** `67815f6`

### Phase E: Code Review Fixes (12 CodeRabbit findings)
- **Commit 1** `d8bb666`: Backend hardening — rate-limit double-exec fix, dynamic Retry-After, deterministic insert errors (409/503), PII log sanitization, occupancy error handling, Zod trim order
- **Commit 2** `f010759`: Frontend safety — reject error visibility, PII-free URL params, scoped approval, explicit query error handling
- **Commit 3** `1397b17`: Feature flag fail-closed, migration comment fix

## Files Changed (13 total)

| File | Action |
|------|--------|
| `supabase/migrations/20260301000001_access_requests.sql` | NEW |
| `app/api/v1/access-request/route.ts` | NEW |
| `app/api/v1/lots/route.ts` | NEW |
| `lib/api/public-rate-limit.ts` | NEW |
| `lib/validation/access-request-schema.ts` | NEW |
| `lib/supabase/admin.ts` | NEW |
| `app/t/[slug]/request-access/page.tsx` | NEW |
| `app/t/[slug]/request-access/request-access-form.tsx` | NEW |
| `app/t/[slug]/admin/residents/access-requests-table.tsx` | NEW |
| `app/t/[slug]/admin/residents/page.tsx` | MODIFIED |
| `app/t/[slug]/admin/residents/create/create-resident-form.tsx` | MODIFIED |
| `components/ui/combobox.tsx` | NEW |
| `lib/api/public-rate-limit.test.ts` | NEW |

## Remaining
- [ ] Production migration (post-merge)
- [ ] Final CR re-review on PR #138
- [ ] Merge and close issue

## QA Audit (2026-03-01)

### Phase 0: Activation & Code Analysis
- **PR Status**: All green — CodeRabbit review skipped (post-fix), both Vercel deploys succeeded
- **CodeRabbit**: 12 actionable findings addressed across 3 commits. 4 nitpicks remain.

### Phase 1: Test Readiness Audit
- **E2E Tests**: No
- **Unit Tests**: Yes — 2 files, 20 tests (rate-limit: 6, schema: 14)
- **Migrations Required**: Yes (1 file, applied to dev)
- **Data Alignment**: Pass
- **Coverage Gaps**: 4 nitpicks (whitespace tests, getClientIP import, URL encoding, JSX dedup)

### Phase 2: Security & Vibe Code Check — ✅ PASS
| Check | Result |
|-------|--------|
| Frontend DB Access | ✅ No Supabase in `use client` components |
| Zero Policy | ✅ Admin-only SELECT/UPDATE policies |
| Public Buckets | ✅ None |
| Hardcoded Secrets | ✅ None |
| Service Role Abuse | ⚠️ Mitigated (rate limit + validation) |
| Input Validation | ✅ Zod on all inputs |

### Phase 3: Release Note Draft
```
🚀 Request Access on Login Page
🤝 Self-Service Request Form — searchable lots, CR checkbox, occupancy badges
🛡️ Admin Approval Workflow — approve → wizard, reject → confirm
📱 Feature Flag Control — per-tenant toggle
```

### Nitpicks — ✅ Resolved (`623cf4c`)
1. ~~Test: whitespace regression cases~~ → Added 3 tests (17 total schema tests)
2. ~~Test: import getClientIP from module~~ → Imports real export, mocks rate-limit
3. ~~Code: URLSearchParams for tenant_slug~~ → Proper encoding
4. ~~Code: JSX dedup in residents page~~ → Ternary chain, no Fragment wrapper

### Additional Fix: Feature Flag Toggle (`623cf4c`)
- Wired `access_requests_enabled` into backoffice `tenant-features-form.tsx`
- Superadmins can now toggle the feature on/off per tenant

### 🟢 QA Verdict: **PASS** — Ready for merge

## Lessons Learned
- **Rate-limit try/catch scope**: Separate infra from handler to prevent double execution
- **PII in URLs**: Never pass PII in query params — use opaque IDs
- **Zod `.trim()` ordering**: Normalize before validate
- **Feature flags fail-closed**: Deny on error, only pass on confirmed `true`

