# Audit: Testing Gaps (Cross-Cutting)

**Date**: 2026-04-11
**Type**: Cross-cutting
**Focus**: Security, Performance, Code Quality, Understanding
**Scope**: Entire codebase — all test files, test infrastructure, CI/CD, and untested production code

## Context

This audit examines the **testing posture** of the Ecovilla Community Platform. Testing is a cross-cutting concern: every layer (server actions, API routes, components, data access, middleware, cron jobs) requires appropriate test coverage. The goal is to identify what is tested, what is not, the quality of existing tests, CI/CD gaps, and provide a prioritized roadmap.

## Prior Work

- `knowledge/raw/audits/audit_2026-04-11_full_codebase.md` — Noted "no test coverage" as a recurring finding across multiple areas
- `knowledge/raw/audits/retro_2026-04-11_audit-coverage-gaps.md` — Explicitly flagged "Only 4 E2E tests exist" and "No automated test runs" as gaps
- `knowledge/raw/audits/audit_2026-04-11_upload-api.md` — M4: "No test coverage" for upload routes
- `knowledge/raw/audits/audit_2026-04-11_cron_module.md` — L4: "Add dry-run mode for testing"
- `knowledge/raw/audits/audit_2026-04-11_dashboard-api.md` — Noted "Low — no tests, tight coupling to Supabase client"
- `knowledge/raw/audits/audit_2026-04-11_components_module.md` — HIGH: "No component tests"
- `knowledge/wiki/patterns/type-safe-data-layer.md` — "Add tests before refactoring large query modules"
- `knowledge/wiki/domains/engineering/rio-blueprint.md` — Phase 14: "Hardening, load testing"

## Understanding Mapping — Test Architecture

### Test Infrastructure

| Tool | Config | Projects | Purpose |
|------|--------|----------|---------|
| **Vitest** | `vitest.config.ts` | 3 projects: `storybook`, `unit`, `components` | Unit + component + Storybook interaction tests |
| **Playwright** | `playwright.config.ts` | 1 project: `chromium` | E2E browser tests |
| **Storybook** | `.storybook/` | Integrated with Vitest | Visual + interaction tests for components |
| **rio-agent** | `packages/rio-agent/vitest.config.ts` | 1 project | Agent service unit tests |

### Test File Inventory (22 files total)

#### Unit Tests (12 files)
| Test File | Lines | What It Tests | Quality |
|-----------|-------|---------------|---------|
| `app/actions/events-availability.test.ts` | 144 | `checkLocationAvailability` only | ✅ Good mock pattern |
| `app/actions/events-series.test.ts` | 145 | `rsvpToEvent` with `scope='series'` only | ✅ Good, complex setup |
| `app/actions/exchange-transactions.test.ts` | 225 | `markItemPickedUp`, `cancelTransaction` | ✅ Best pattern (table-specific mock) |
| `lib/ai/injection-filter.test.ts` | ~50 | AI prompt injection filtering | ✅ Good |
| `lib/api/public-rate-limit.test.ts` | ~30 | `getClientIP` only | ⚠️ Only tests IP extraction, not rate limiting |
| `lib/geojson-parser.test.ts` | ~40 | GeoJSON parsing | ✅ Good |
| `lib/privacy-utils.test.ts` | ~50 | Self/family/admin view logic | ✅ Good |
| `lib/supabase/middleware.test.ts` | 127 | Auto-logout, grace period, remember-me | ✅ Good, missing edge cases |
| `lib/validation/access-request-schema.test.ts` | ~40 | Zod schema validation | ✅ Excellent |
| `packages/rio-agent/src/lib/hashing.test.ts` | ~30 | Hashing utilities | ✅ Good |
| `packages/rio-agent/src/lib/redaction.test.ts` | ~30 | PII redaction | ✅ Good |
| `packages/rio-agent/src/lib/tenant-isolation.test.ts` | ~30 | Tenant isolation logic | ✅ Good |

#### Component Tests (2 files)
| Test File | Lines | What It Tests | Quality |
|-----------|-------|---------------|---------|
| `components/ecovilla/dashboard/__tests__/RioWelcomeCard.test.tsx` | ~50 | RioWelcomeCard rendering | ✅ Basic |
| `components/ecovilla/chat/__tests__/RioChatSheet.test.tsx` | ~80 | RioChatSheet interaction | ✅ Good |

#### API Tests (1 file)
| Test File | Lines | What It Tests | Quality |
|-----------|-------|---------------|---------|
| `app/api/v1/ai/chat/__tests__/gate.test.ts` | 143 | Auth gate, tenant mismatch, feature flag | ✅ Good, but doesn't test stream/retry |

#### E2E Tests (4 files)
| Test File | Type | What It Tests |
|-----------|------|---------------|
| `e2e/chat_hydration.test.ts` | Playwright | Chat hydration |
| `e2e/product-tour.spec.ts` | Playwright | Product tour flow |
| `e2e/series-rsvp.spec.ts` | Playwright | Series RSVP flow |
| `e2e/geojson-upload.spec.ts` | Playwright | GeoJSON upload button |

#### rio-agent Tests (6 files)
| Test File | What It Tests |
|-----------|---------------|
| `packages/rio-agent/src/tests/chunk-isolation.test.ts` | Chunk isolation |
| `packages/rio-agent/src/tests/embeddings.test.ts` | Embedding logic |
| `packages/rio-agent/src/tests/ingestion.test.ts` | Document ingestion |
| `packages/rio-agent/src/tests/rag-tool.test.ts` | RAG tool |
| `packages/rio-agent/src/tests/resource-isolation.test.ts` | Resource isolation |
| `packages/rio-agent/src/lib/*.test.ts` | Hashing, redaction, tenant-isolation |

#### Smoke Tests (1 file)
| Test File | What It Tests |
|-----------|---------------|
| `tests/smoke/login_smoke.test.ts` | Login page smoke test |

### Coverage Summary

| Area | Source Files | Test Files | Coverage % | Source Lines |
|------|-------------|------------|------------|-------------|
| Server Actions (`app/actions/`) | 24 | 3 | **12.5%** | ~9,896 |
| API Routes (`app/api/`) | 41 | 1 | **2.4%** | ~3,865 |
| Data Access Layer (`lib/data/`) | 8 | 0 | **0%** | ~2,083 |
| Supabase Clients (`lib/supabase/`) | 4 | 1 | **25%** | 189 |
| API Infrastructure (`lib/api/`) | 3 | 0 | **0%** | 327 |
| Upload/Storage (`lib/`) | 2 | 0 | **0%** | 129 |
| **Backend Total** | **82** | **5** | **6.1%** | **~16,489** |
| Ecovilla Components | 19 | 2 | **10.5%** | — |
| Library Components | ~100 | 0 | **0%** | — |
| UI Components | 45 | 0 | **0%** | — |
| Custom Hooks | 10 | 0 | **0%** | — |
| **Frontend Total** | **~260** | **2** | **<1%** | — |
| rio-agent Package | ~15 | 9 | **~60%** | — |
| **OVERALL** | **~360** | **22** | **~6%** | **~20,000+** |

### CI/CD Status

| Item | Status |
|------|--------|
| GitHub Actions workflows | ❌ **None exist** |
| `npm run test` in CI | ❌ Not run anywhere |
| `npm run lint` in CI | ❌ Not run anywhere |
| `npm run type-check` in CI | ❌ Not run anywhere |
| `npm run build` in CI | ⚠️ Vercel auto-builds, but `next.config.mjs` ignores errors |
| Coverage thresholds | ❌ None configured |
| Pre-commit hooks | ❌ None configured |
| Playwright in CI | ❌ Not configured |

## Findings

### Critical

| # | Finding | File(s) | Recommendation |
|---|---------|---------|---------------|
| C1 | **No CI/CD pipeline for tests** | `.github/workflows/` (missing) | Create GitHub Actions workflow running `lint → type-check → test → build` on every PR. Vercel's auto-build ignores errors per config. |
| C2 | **Server actions using `createAdminClient()` have zero auth tests** | `app/actions/onboarding.ts`, `app/actions/resident-requests.ts` | These bypass RLS entirely. Test that unauthenticated users are rejected, tenant isolation is enforced, and users can only modify their own data. |
| C3 | **Upload/delete API routes have zero auth tests** | `app/api/upload/route.ts`, `app/api/upload/delete/route.ts` | No authentication check. Any anonymous user can upload/delete files. Add auth middleware + tests verifying 401 for unauthenticated requests. |
| C4 | **Cron jobs accept requests without secret when env var is missing** | `app/api/cron/*/route.ts` | `if (cronSecret && ...)` means if `CRON_SECRET` is undefined, the check is skipped entirely. Tests should verify fail-closed behavior. |

### High

| # | Finding | File(s) | Recommendation |
|---|---------|---------|---------------|
| H1 | **`lib/api/middleware.ts` — zero tests for security boundary** | `lib/api/middleware.ts` (166 lines) | `withAuth`, `withTenantIsolation`, `withRole` guard ALL V1 routes. Test: unauthenticated → 401, cross-tenant → 403, super_admin bypass, rate limiting. |
| H2 | **21 of 24 server action files have zero tests** | `app/actions/auth-actions.ts`, `check-ins.ts`, `announcements.ts`, `documents.ts`, `families.ts`, `notifications.ts`, `reservations.ts`, `locations.ts`, `neighbor-lists.ts`, `profile.ts`, `tenant-features.ts`, etc. | Prioritize: `auth-actions.ts` (password reset, anti-enumeration), `check-ins.ts` (visibility scoping), `announcements.ts` (admin-only CRUD). |
| H3 | **40 of 41 API route files have zero tests** | `app/api/v1/access-request/route.ts`, `app/api/v1/ai/ingest/route.ts`, `app/api/cron/*/route.ts`, `app/api/link-resident/route.ts`, all V1 REST routes | Prioritize: `access-request` (public endpoint with rate limiting), `ai/ingest` (admin-only, service_role), `link-resident` (atomic ID relink). |
| H4 | **Data access layer — zero tests** | `lib/data/locations.ts` (500 lines), `lib/data/events.ts` (394), `lib/data/exchange.ts` (316), `lib/data/resident-requests.ts` (279), `lib/data/check-ins.ts` (259), `lib/data/residents.ts` (188) | Test tenant_id filters, correct table queries, pagination, error handling. Start with `resident-requests.ts` (uses `createAdminClient`). |
| H5 | **Critical E2E flows missing** | `e2e/` (only 4 tests) | Missing E2E coverage for: login flow, password reset, onboarding, event creation, exchange transactions, admin operations, backoffice access. |
| H6 | **Zod schemas not tested with adversarial inputs** | `lib/validation/schemas.ts` | Only `access-request-schema` has tests. Test XSS payloads, SQL injection attempts, role escalation, boundary conditions across all schemas. |
| H7 | **SQL injection vector untested** | `app/actions/announcements.ts:19` | Raw SQL subquery with string interpolation: `(SELECT announcement_id FROM announcement_reads WHERE user_id = '${userId}')`. Test with malicious userId input. |

### Medium

| # | Finding | File(s) | Recommendation |
|---|---------|---------|---------------|
| M1 | **~260 frontend components have <1% test coverage** | `components/ecovilla/`, `components/library/`, `components/ui/` | Priority: `combobox.tsx`, `rich-text-editor.tsx`, `date-time-picker.tsx`, `multi-select.tsx`, navigation components, form components. |
| M2 | **10 custom hooks have zero tests** | `hooks/use-rio-chat.ts`, `hooks/useGeolocation.ts`, `hooks/use-toast.ts`, `hooks/useTenantFeatures.ts`, etc. | Test state transitions, browser API mocks, side effects. Priority: `use-rio-chat.ts` (Zustand store, heavily used). |
| M3 | **Middleware timeout edge cases untested** | `lib/supabase/middleware.ts` (3 of ~11 scenarios tested) | Missing: remember-me bypass, recovery path skip, `/auth/*` skip, cookie security flags, missing env vars graceful degradation, redirect loop prevention. |
| M4 | **No shared test utilities / mock factory** | All test files | Each test file reimplements Supabase mocking. Extract `lib/test/supabase-mock.ts` with reusable chainable builder. Would reduce boilerplate ~60%. |
| M5 | **No coverage thresholds configured** | `vitest.config.ts` | Add `coverage.thresholds` to vitest config. Start with low bar (20%) and increase. |
| M6 | **Storybook stories lack interaction tests** | `.stories.tsx` files (~80 stories) | Stories exist but most are visual-only. Add `@storybook/test` interaction tests for form components, navigation, modals. |
| M7 | **No pre-commit hooks** | `.husky/` (missing) | Add Husky + lint-staged to run lint + type-check on commit. Prevents broken code from entering the repo. |
| M8 | **AI chat route — stream/retry logic untested** | `app/api/v1/ai/chat/route.ts` | Gate is tested (5 tests) but SSE stream transformation, retry logic, and tiered timeouts (15s/30s) are not. |
| M9 | **Backoffice super-admin auth untested** | `app/backoffice/**` | No tests verify that non-super-admin users are redirected, or that unauthenticated users cannot access backoffice pages. |
| M10 | **Password reset anti-enumeration untested** | `app/actions/auth-actions.ts` | No tests verify that invalid emails return `{success: true}` (anti-enumeration), or that weak passwords are rejected. |

### Low

| # | Finding | File(s) | Recommendation |
|---|---------|---------|---------------|
| L1 | **Error response sanitization untested** | `lib/api/response.ts`, `lib/api/errors.ts` | No tests verify that 500 errors don't include stack traces, DB errors are sanitized, validation errors don't leak internal field names. |
| L2 | **CORS configuration untested** | All API routes | No tests for CORS headers, preflight handling, wildcard origin prevention. |
| L3 | **`components/_deprecated/` excluded from tsconfig** | `components/_deprecated/` | 78 components excluded from compilation and testing. Should be removed or migrated. |
| L4 | **No load/performance tests** | — | Blueprint mentions "load testing" in Phase 14. No performance test infrastructure exists. |
| L5 | **Stats test page in production** | `app/t/[slug]/dashboard/stats-test/page.tsx` | Development test page accessible in production. Should be gated behind dev-only flag or removed. |

## Recommendations

### Immediate (This Sprint)

- [ ] **C1: Create GitHub Actions CI workflow** — Run `lint → type-check → test → build` on every PR. This is the single highest-ROI infrastructure change.
- [ ] **C2: Add auth tests for `createAdminClient()` server actions** — Start with `onboarding.ts` and `resident-requests.ts`. Test unauthenticated rejection, tenant isolation, self-modification only.
- [ ] **C3: Add auth to upload routes + tests** — Wrap with `withAuth` middleware. Test 401 for anonymous, 403 for cross-tenant.
- [ ] **C4: Make cron secret mandatory + test fail-closed** — Change `if (cronSecret && ...)` to fail when secret is missing.
- [ ] **H1: Test `lib/api/middleware.ts`** — `withAuth`, `withTenantIsolation`, `withRole`. This validates the security boundary for ALL V1 routes.
- [ ] **M4: Extract shared test utilities** — Create `lib/test/supabase-mock.ts` with reusable chainable mock builder. Reduces test writing friction.

### Short Term (Next 2-3 Sprints)

- [ ] **H2: Test remaining server actions** — Priority: `auth-actions.ts`, `check-ins.ts`, `announcements.ts`, `documents.ts`.
- [ ] **H3: Test critical API routes** — `access-request`, `ai/ingest`, `link-resident`, cron jobs.
- [ ] **H4: Test data access layer** — Start with `resident-requests.ts`, `events.ts`, `locations.ts`.
- [ ] **H5: Add E2E tests for critical flows** — Login, password reset, event creation, RSVP, onboarding.
- [ ] **H6: Test Zod schemas with adversarial inputs** — XSS, SQLi, role escalation, boundary conditions.
- [ ] **M1: Add component tests for critical UI** — `combobox.tsx`, `rich-text-editor.tsx`, form components, navigation.
- [ ] **M5: Configure coverage thresholds** — Start at 20%, increase to 60% over time.
- [ ] **M7: Add pre-commit hooks** — Husky + lint-staged for lint + type-check.

### Future

- [ ] **L4: Add load/performance tests** — k6 or Artillery for API endpoints.
- [ ] **L1: Test error response sanitization** — Verify no stack traces or internal details leak.
- [ ] **M6: Add Storybook interaction tests** — Convert visual stories to interaction tests.
- [ ] **L3: Remove or migrate deprecated components** — Clean up `components/_deprecated/`.
- [ ] **M2: Test all custom hooks** — State transitions, browser API mocks.
- [ ] **M8: Test AI chat stream/retry logic** — SSE transformation, timeout tiers.
- [ ] **M9: Test backoffice auth** — Super-admin access control.
- [ ] **M10: Test password reset anti-enumeration** — Consistent responses for valid/invalid emails.

## Appendix: Test Quality Assessment

### Existing Test Patterns

| Pattern | Used In | Assessment |
|---------|---------|------------|
| Manual chainable Supabase mock | `events-availability.test.ts`, `events-series.test.ts` | ✅ Works but not reusable |
| Table-specific builder factory | `exchange-transactions.test.ts` | ✅ Best pattern — mock by table name |
| Full SSR mock | `middleware.test.ts` | ✅ Good, missing edge cases |
| Pure Zod validation | `access-request-schema.test.ts` | ✅ Excellent — no mocking needed |
| Pure function tests | `injection-filter.test.ts`, `privacy-utils.test.ts`, `geojson-parser.test.ts` | ✅ Good — deterministic, no mocks |
| Minimal auth gate mock | `gate.test.ts` | ✅ Good for gate, incomplete for full route |

### Recommended Shared Test Utility

```typescript
// lib/test/supabase-mock.ts (proposed)
export function createMockSupabase(config?: {
  user?: { id: string; email: string; app_metadata?: any };
  tables?: Record<string, MockTableConfig>;
}) {
  // Returns chainable mock: .from().select().eq().single()
}

export function createChainableBuilder(responses: any[]) {
  // Reusable query builder mock
}
```

This would reduce test boilerplate by ~60% and make it feasible to add tests for the 21 untested server actions.

## Appendix: Estimated Effort

| Phase | Scope | Est. Tests | Est. Effort |
|-------|-------|-----------|-------------|
| Phase 1 — Security Critical | middleware, auth-actions, access-request, upload-security, link-resident | ~44 | 1 week |
| Phase 2 — High-Risk Business Logic | cron jobs, ai/ingest, ai/chat stream, resident-requests, check-ins | ~51 | 1-2 weeks |
| Phase 3 — Data Layer & Remaining | data layer, remaining server actions, storage, response/errors | ~55+ | 2 weeks |
| Phase 4 — Frontend | Critical components, hooks, Storybook interaction tests | ~40+ | 2 weeks |
| Phase 5 — E2E | Login, onboarding, event creation, admin flows | ~15+ | 1 week |
| **Total** | | **~205+** | **~7-8 weeks** |

---

*Audit completed 2026-04-11. Next audit recommended: After Phase 1 fixes are applied.*
