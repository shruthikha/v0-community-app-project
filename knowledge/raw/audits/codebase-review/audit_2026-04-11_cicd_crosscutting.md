# Audit: CI/CD Pipeline (Cross-Cutting)

**Date**: 2026-04-11
**Type**: Cross-cutting
**Focus**: Security, Performance, Code Quality, Understanding
**Scope**: All CI/CD-relevant configuration: `next.config.mjs`, `vercel.json`, `package.json`, `vitest.config.ts`, `vitest.unit.config.ts`, `playwright.config.ts`, `tsconfig.json`, `.gitignore`, `.env.local`, `.agents/config.yaml`, cron routes, GitHub Actions (absent)

## Context

This audit was requested as a full-depth, cross-cutting review of the CI/CD and deployment pipeline. The project deploys on Vercel (auto-deploy from `main`) with **zero CI/CD automation** — no `.github/workflows/` directory exists. The build configuration (`next.config.mjs`) explicitly ignores both ESLint and TypeScript errors during builds. Developer discipline, documented in `AGENTS.md`, is the only quality gate.

## Prior Work

- **`retro_2026-04-11_audit-coverage-gaps.md`** — Section 3 explicitly flagged CI/CD as a **CRITICAL GAP**: "There is no `.github/workflows/` directory. The project has zero CI/CD automation."
- **`knowledge/wiki/documentation-gaps.md`** — Lists missing `knowledge/wiki/lessons/ci-cd-requirements.md`
- **`knowledge/wiki/domains/engineering/tech-stack.md`** — Notes "Vercel auto-deploys on merge to `main`"
- **`audit_2026-04-11_cron_module.md`** — Found that cron jobs use anon-key client, silently returning zero results due to RLS
- **`audit_2026-04-11_full_codebase.md`** — Mentioned `ignoreDuringBuilds` but no CI/CD-specific analysis

## Understanding Mapping

### Current Deployment Architecture

```
Developer pushes to main
    ↓
Vercel auto-deploy (no gates)
    ↓
next build (ignores eslint + tsc errors)
    ↓
Production deployment
```

### Configuration Files

| File | Purpose | Lines |
|------|---------|-------|
| `next.config.mjs` | Next.js build config (ignores errors) | 30 |
| `vercel.json` | Vercel cron schedules (2 jobs at midnight) | 12 |
| `package.json` | Scripts, dependencies (11 on `latest`) | 144 |
| `vitest.config.ts` | 3 test projects (storybook, unit, components) | 71 |
| `vitest.unit.config.ts` | Stale single-file config (orphaned) | 11 |
| `playwright.config.ts` | E2E config (CI-aware but no CI exists) | 20 |
| `tsconfig.json` | TypeScript strict mode (negated by build config) | 43 |
| `.gitignore` | Ignores `.env*`, `.vercel`, etc. | 55 |
| `.env.local` | **Contains 15 real, active secrets** | 15 |
| `.agents/config.yaml` | Dev/prod Supabase URLs (no secrets) | 32 |

### Cron Job Flow

```
Vercel Cron (0 0 * * *)
    ↓
GET /api/cron/check-return-dates
    ↓
CRON_SECRET check (bypassed if not set — it's NOT set)
    ↓
createServerClient() → anon key → RLS blocks all reads
    ↓
Returns 0 transactions (silently broken)
```

```
Vercel Cron (0 0 * * *)
    ↓
GET /api/cron/archive-announcements
    ↓
CRON_SECRET check (bypassed if not set — it's NOT set)
    ↓
createClient() → no cookies → anonymous user
    ↓
May or may not have permission to update announcements
```

### Test Infrastructure

```
npm run test (vitest)
├── storybook project (browser, Playwright Chromium)
├── unit project (node, lib/** + app/** + packages/**)
└── components project (jsdom, components/**)

npx playwright test
└── e2e/ directory (4 tests only)

⚠️ vitest.unit.config.ts — orphaned, matches 1 file already in unit project
⚠️ tests/smoke/login_smoke.test.ts — outside Playwright testDir, never discovered
```

## Findings

### Critical

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| C1 | **Real secrets in `.env.local`** — 15 active secrets including 3× Supabase service_role keys (full DB admin), PostgreSQL connection string with password, Vercel Blob token, Río agent key, JWT signing key | `.env.local:1-15` | **Immediately rotate ALL secrets**. Move to Vercel env vars + secure vault. Create `.env.example`. Add pre-commit hook to block `.env*` files. |
| C2 | **Build ignores all lint + type errors** — `ignoreDuringBuilds: true` + `ignoreBuildErrors: true` means broken, vulnerable code deploys to production. Nullifies every other quality control. | `next.config.mjs:3-8` | Remove both flags. Fix underlying type/lint backlog first if needed, but do not deploy without gates. |
| C3 | **Zero CI/CD pipeline** — No `.github/workflows/` directory. Vercel auto-deploys from `main` with zero gates. No PR checks, no test runs, no security scanning. | *(missing)* | Create GitHub Actions workflow: lint → type-check → test → build on every PR. Enable branch protection on `main`. |
| C4 | **Cron endpoints unprotected** — `CRON_SECRET` is NOT defined in `.env.local` (absent from all 15 lines). The auth check `if (cronSecret && ...)` is always falsy. **Anyone on the internet can trigger these endpoints.** | `check-return-dates/route.ts:18-23`, `archive-announcements/route.ts:10-14` | Add `CRON_SECRET` to Vercel env vars. Make check mandatory (throw if not configured). Add `x-vercel-cron` header verification as defense-in-depth. |
| C5 | **Cron jobs silently broken by RLS** — `createServerClient()` uses anon key with no user session. RLS policies require authenticated user. `exchange_transactions` reads return zero results. **No reminders or overdue notifications are ever sent.** | `check-return-dates/route.ts:25`, prior audit `audit_2026-04-11_cron_module.md` | Switch to `createAdminClient()` (service_role) for cron operations. This was already identified in the cron module audit and remains unfixed. |

### High

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| H1 | **11 dependencies pinned to `latest`** — Including `@supabase/ssr`, `@supabase/supabase-js`, `@tiptap/core`, `@tiptap/pm`. Unpredictable builds, supply chain risk, no rollback path. | `package.json:48,53-55,63,72,84-85,93-94,102,109` | Pin all to specific semver versions. Run `npm audit`. Add Dependabot/Renovate for controlled updates. |
| H2 | **`strict: true` negated by `ignoreBuildErrors`** — Creates false sense of type safety. tsconfig says "be strict" but build says "ignore all that." | `tsconfig.json:11` + `next.config.mjs:7` | Remove `ignoreBuildErrors`. The strict config is meaningless without enforcement. |
| H3 | **No automated dependency scanning** — No `renovate.json`, no `.github/dependabot.yml`. Known CVEs go unpatched. | *(missing)* | Add `.github/dependabot.yml` for npm + GitHub Actions ecosystems. |
| H4 | **Cron error responses leak internal details** — `archive-announcements` returns `details: fetchError.message` and `details: String(error)` which can expose stack traces, file paths, internal logic. | `archive-announcements/route.ts:32,68,90` | Return generic error messages. Log details server-side only. |
| H5 | **`vitest.unit.config.ts` is stale/orphaned** — Matches only `app/actions/events-series.test.ts` which is already matched by the `unit` project in `vitest.config.ts`. Uses different path resolution (`vite-tsconfig-paths` vs `resolve.alias`) and `globals: true` vs not set. Risk of double execution and config drift. | `vitest.unit.config.ts:1-11` | Delete this file. If standalone runner needed, add proper npm script aligned with main config. |
| H6 | **Both crons fire simultaneously at midnight** — `0 0 * * *` for both. Compete for DB connections. Fine now, but at scale could cause connection pool exhaustion. | `vercel.json:5,9` | Stagger schedules (e.g., archive at 00:00, returns at 00:30). |

### Medium

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| M1 | **No root `.env.example`** — Only `packages/rio-agent/.env.example` exists. New developers and any future CI system have no template for required env vars. Leads to copying `.env.local` (with real secrets). | *(missing)* | Create `.env.example` at project root with placeholder values for all 15 variables. |
| M2 | **ESLint legacy mode** — `ESLINT_USE_FLAT_CONFIG=false` with ESLint 9.x. ESLint 10+ will remove legacy config support. `.eslintrc.json` is minimal — no custom rules, no import ordering, no `@typescript-eslint/no-explicit-any`. | `package.json:8` | Migrate to flat config (`eslint.config.mjs`). Add rules for `any` prohibition and import ordering. |
| M3 | **No pre-commit hooks** — No husky, no lint-staged, no commitlint. Nothing prevents committing lint errors, type errors, or secrets locally. | *(missing)* | Add `husky` + `lint-staged`. Pre-commit: lint + type-check staged files. |
| M4 | **`tests/smoke/login_smoke.test.ts` outside Playwright `testDir`** — Playwright config points to `./e2e/`. This test in `tests/smoke/` is never discovered by `npx playwright test`. Dead test file. | `playwright.config.ts:4`, `tests/smoke/login_smoke.test.ts` | Move to `e2e/` or delete. |
| M5 | **`package.json` name is `"my-v0-project"`** — v0.dev scaffold default. Appears in lockfiles, `npm pack`, internal tooling. Signals incomplete project initialization. | `package.json:2` | Rename to `"ecovilla-community-platform"` or similar. |
| M6 | **No PR template** — No `.github/PULL_REQUEST_TEMPLATE.md`. PRs lack structure for testing instructions, migration notes, security considerations. | *(missing)* | Add PR template with sections: description, testing, migrations, security. |
| M7 | **`@` alias duplicated 3 times in vitest.config.ts** — Each project independently defines `resolve.alias`. If alias changes, must update 3 places. | `vitest.config.ts:21,43,59` | Extract to shared variable at top of config. |
| M8 | **No Docker/container configuration** — No reproducible builds outside Vercel. Cannot run security scans in isolated environments. Vendor lock-in. | *(missing)* | Add `Dockerfile` for local testing and security scanning. |

### Low

| # | Finding | File | Recommendation |
|---|---------|------|---------------|
| L1 | **`.agents/config.yaml` exposes Supabase project references** — `ehovmoszgwchjtozsfjw` and `csatxwfaliwlwzrkvyju` are public but enable targeted attacks when combined with leaked keys. | `.agents/config.yaml:15-18` | Consider moving to env vars. At minimum, document these are public refs. |
| L2 | **`vitest.setup.ts` uses deprecated `addListener`/`removeListener`** — Modern `matchMedia` mocks should use `addEventListener`/`removeEventListener`. | `vitest.setup.ts` | Update mock to modern API. |
| L3 | **Missing strict TS options** — No `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`. | `tsconfig.json` | Add incrementally after fixing existing type errors. |
| L4 | **No lint caching** — `npm run lint` scans entire project every time. | `package.json:8` | Add `--cache` flag for local development. |

## Recommendations

### Immediate (This Week)

- [ ] **C1: Rotate ALL secrets in `.env.local`** — Treat as compromised. 15 keys including 3 service_role keys, PostgreSQL connection string, JWT signing key.
- [ ] **C2: Remove `ignoreDuringBuilds` and `ignoreBuildErrors`** from `next.config.mjs`. Fix type/lint backlog first if needed.
- [ ] **C3: Create GitHub Actions CI workflow** — lint → type-check → test → build on every PR. Enable branch protection on `main`.
- [ ] **C4: Add `CRON_SECRET` to Vercel env vars** and make the check mandatory in both cron routes.
- [ ] **C5: Switch cron jobs to `createAdminClient()`** — They're silently broken by RLS (already identified in cron module audit).

### Short-Term (Next Sprint)

- [ ] **H1: Pin all `latest` dependencies** to specific semver versions.
- [ ] **H3: Add Dependabot config** for npm + GitHub Actions.
- [ ] **H4: Sanitize cron error responses** — no `details` field in production.
- [ ] **H5: Delete `vitest.unit.config.ts`** — orphaned config.
- [ ] **H6: Stagger cron schedules** — 30 min apart.
- [ ] **M1: Create root `.env.example`** with all 15 placeholder variables.
- [ ] **M2: Migrate ESLint to flat config** before ESLint 10.
- [ ] **M3: Add husky + lint-staged** for pre-commit hooks.

### Future (Backlog)

- [ ] **M4: Fix Playwright test discovery** — move or delete `tests/smoke/`.
- [ ] **M5: Rename `package.json`** from `"my-v0-project"`.
- [ ] **M6: Add PR template**.
- [ ] **M7: Deduplicate `@` alias in vitest config**.
- [ ] **M8: Add Dockerfile** for local testing.
- [ ] **L1-L4**: Low-priority config hygiene items.
- [ ] **Expand E2E coverage** — login flow, tenant isolation, RLS enforcement, admin operations.
- [ ] **Compile wiki lesson** — `knowledge/wiki/lessons/ci-cd-requirements.md` (listed in documentation-gaps.md).

## Performance Notes

| Area | Current State | Impact | Optimization |
|------|--------------|--------|-------------|
| Build time | `next build` with error ignores | Fast but unsafe | Remove ignores, add incremental builds |
| Test execution | 3 Vitest projects + Playwright | Well-structured but low coverage | Add CI, expand E2E |
| Cron execution | N+1 queries per transaction (1000+ DB calls) | Severe — silently returns 0 anyway | Batch queries, use admin client |
| Dependency install | 11 `latest` tags = unpredictable | Non-reproducible builds | Pin versions, use `npm ci` |
| Bundle size | No bundle analysis | Unknown | Add `@next/bundle-analyzer` |

## Security Posture Summary

| Control | Status | Risk |
|---------|--------|------|
| Secret management | 🔴 Compromised (real keys in `.env.local`) | Critical |
| Build quality gates | 🔴 Disabled (`ignoreDuringBuilds`, `ignoreBuildErrors`) | Critical |
| CI/CD pipeline | 🔴 Absent (no `.github/workflows/`) | Critical |
| Cron authentication | 🔴 Bypassed (`CRON_SECRET` not set) | Critical |
| Dependency pinning | 🟡 11 packages on `latest` | High |
| Pre-commit hooks | 🟡 Absent | Medium |
| ESLint config | 🟡 Legacy mode, will break on v10 | Medium |
| PR template | 🟡 Absent | Medium |
| Docker config | 🟢 Absent (low risk) | Low |

---

*Audit completed: 2026-04-11*
*Agents invoked: @security-auditor (security findings), @backend-specialist (code quality + performance)*
*Prior audits referenced: `audit_2026-04-11_cron_module.md`, `retro_2026-04-11_audit-coverage-gaps.md`*
