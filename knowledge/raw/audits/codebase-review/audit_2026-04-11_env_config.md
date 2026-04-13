---
title: "Audit 2026-04-11: Environment & Configuration Cross-Cutting"
date: 2026-04-11
type: cross-cutting
focus: security, performance, quality, understanding
scope: env vars, config files, .env management, runtime configuration
---

# Audit: Environment & Configuration

**Date**: 2026-04-11  
**Type**: Cross-cutting  
**Focus**: Security, Performance, Code Quality, Understanding  
**Scope**: All `process.env.*` usage, `.env*` files, config files, `.gitignore`, `.agents/config.yaml`, `vercel.json`

---

## Context

This audit examines how the Ecovilla Community Platform manages environment variables, configuration files, and runtime configuration across the entire codebase. It was identified as a coverage gap in the retro `retro_2026-04-11_audit-coverage-gaps.md` (Section 3, "LOW GAP: Environment/Config Management Not Audited").

**Why this matters**: Environment variables are the root of the security boundary. Misconfigured env vars lead to leaked secrets, broken deployments, and insecure defaults. Configuration inconsistency is a leading cause of "works on my machine" bugs and production incidents.

---

## Prior Work

- **Wiki**: `knowledge/wiki/domains/engineering/tech-stack.md` — documents `.env.local` → dev, `.env.production` → prod mapping
- **Wiki**: `knowledge/wiki/tools/middleware-auth-flow.md` — cookie configuration as auth boundary
- **Wiki**: `knowledge/wiki/concepts/3-tier-prompt.md` — Tier 1 (env var) vs Tier 2 (DB config) for Río
- **Wiki**: `knowledge/wiki/lessons/session-timeout.md` — `NODE_ENV === 'production'` for secure cookies
- **Wiki**: `knowledge/wiki/patterns/security-patterns.md` — server-side config enforcement
- **Raw**: `knowledge/raw/ideas-archive/environment_configuration_guide.md` — Río env var documentation (outdated, incomplete)
- **Raw**: `knowledge/raw/audits/retros/retro_2026-04-11_audit-coverage-gaps.md` — flagged env/config as unaudited
- **Raw**: Multiple audit files reference env var issues (CRON_SECRET fail-open, service role key exposure, etc.)

---

## Understanding Mapping

### Environment Variable Inventory

**Total unique env vars found**: 28

| Variable | Type | Used In | Purpose |
|----------|------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | 12 files | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | 8 files | Supabase anon key |
| `SUPABASE_URL` | Private | 4 files | Supabase URL (server-side alias) |
| `SUPABASE_ANON_KEY` | Private | 1 file | Supabase anon key (server-side alias) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | 8 files | Supabase service role key |
| `SUPABASE_SERVICE_ROLE_KEY_DEV` | **Secret** | 4 files | Dev service role key |
| `SUPABASE_SERVICE_ROLE_KEY_PROD` | **Secret** | 1 file | Prod service role key |
| `DEV_SUPABASE_SERVICE_ROLE_KEY` | **Secret** | 2 files | Dev service role key (alt name) |
| `SUPABASE_JWT` | **Secret** | 1 file | JWT secret |
| `NEXT_PUBLIC_APP_URL` | Public | 3 files | App base URL |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Public | 5 files | Mapbox access token |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Public | 1 file | Mapbox token (alt name) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public | 2 files | Google Maps API key |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Public | 2 files | Google Map ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | 2 files | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public | 2 files | PostHog host URL |
| `RIO_AGENT_KEY` | **Secret** | 6 files | BFF↔Agent shared secret |
| `RIO_RAILWAY_URL` | Private | 4 files | Río agent production URL |
| `RIO_AGENT_URL` | Private | 4 files | Río agent URL (alt) |
| `RIO_DATABASE_URL` | **Secret** | 4 files | Río direct DB connection |
| `RIO_DATABASE_CA` | **Secret** | 1 file | Río DB CA cert |
| `RIO_DATABASE_CA_CERT` | **Secret** | 2 files | Río DB CA cert (alt name) |
| `RIO_MODEL_ID` | Private | 1 file | LLM model identifier |
| `OPENROUTER_API_KEY` | **Secret** | 2 files | OpenRouter LLM API key |
| `LLAMA_CLOUD_API_KEY` | **Secret** | 2 files | LlamaParse API key |
| `CRON_SECRET` | **Secret** | 2 files | Cron endpoint auth |
| `UPSTASH_REDIS_REST_URL` | **Secret** | 1 file | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | **Secret** | 1 file | Upstash Redis token |
| `BLOB_READ_WRITE_TOKEN` | **Secret** | 1 file | Vercel Blob token |
| `NODE_ENV` | Runtime | 15+ files | Environment mode |
| `CI` | Runtime | 1 file | CI detection |
| `DEBUG` | Runtime | 1 file | Debug mode (Río) |
| `DEBUG_LOGGING` | Runtime | 1 file | Debug logging (Río) |
| `PORT` | Runtime | 1 file | Server port |
| `LOG_LEVEL` | Runtime | 0 files | Referenced in refactoring only |

### Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `next.config.mjs` | Next.js build config | ⚠️ `ignoreBuildErrors: true`, `ignoreDuringBuilds: true` |
| `tailwind.config.ts` | Tailwind CSS config | ✅ Normal |
| `vitest.config.ts` | Vitest test config | ✅ Normal |
| `vitest.unit.config.ts` | Vitest unit test config | ✅ Normal |
| `playwright.config.ts` | Playwright E2E config | ✅ Normal |
| `postcss.config.mjs` | PostCSS config | ✅ Normal |
| `vercel.json` | Vercel cron config | ✅ Normal |
| `.agents/config.yaml` | Agent config (project IDs) | ⚠️ Contains Supabase project URLs |
| `lib/ai/config.ts` | Río AI config module | ✅ Good — fail-closed pattern |
| `lib/supabase/admin.ts` | Admin client factory | ⚠️ Multiple fallback key names |
| `lib/supabase/server.ts` | Server Supabase client | ✅ Normal |
| `lib/supabase/client.ts` | Browser Supabase client | ✅ Normal |
| `lib/supabase/middleware.ts` | Middleware auth config | ⚠️ Cookie config inline |
| `lib/rate-limit.ts` | Rate limiting config | 🔴 Fails open in production |

### Env Var Access Patterns

```
Centralized factories (✅ GOOD):
  lib/supabase/server.ts    → createClient()
  lib/supabase/client.ts    → createClient()
  lib/supabase/admin.ts     → createAdminClient()
  lib/ai/config.ts          → getAgentBaseUrl(), RIO_AGENT_KEY

Inline env access (⚠️ RISKY):
  app/actions/families.ts   → inline service role client
  app/actions/events.ts     → inline service role client
  app/backoffice/invite/    → inline service role client
  scripts/*.ts              → inline Supabase clients

Direct process.env in components (⚠️ RISKY):
  components/map/*.tsx      → NEXT_PUBLIC_MAPBOX_TOKEN (4 files)
  components/event-forms/   → NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

---

## Findings

### Critical

| # | Finding | File(s) | Recommendation |
|---|---------|---------|---------------|
| C1 | **No `.env.example` at project root** | Root directory | Create `.env.example` with all 28+ required vars documented |
| C2 | **`.env.local` committed to git (not ignored properly)** | `.env.local` is in `.gitignore` but EXISTS on disk with real secrets | Verify `.gitignore` pattern `.env*` catches all variants; confirm no `.env.local` was ever committed |
| C3 | **`packages/rio-agent/.env` contains real secrets** | `packages/rio-agent/.env` | This file is in `.gitignore` but contains live OpenRouter API key, Supabase service role key, Llama Cloud key, and DB connection string. Verify it was never committed to git history |
| C4 | **CRON_SECRET authentication fails open** | `app/api/cron/check-return-dates/route.ts:18-23`, `app/api/cron/archive-announcements/route.ts:10-14` | If `CRON_SECRET` is not set, anyone can call these endpoints. Make it mandatory — fail closed |

### High

| # | Finding | File(s) | Recommendation |
|---|---------|---------|---------------|
| H1 | **Rate limiting fails open in production** | `lib/rate-limit.ts:31-36` | When Redis is unavailable, returns `{ success: true }` — bypasses all rate limiting. Should fail closed |
| H2 | **Multiple naming conventions for same secret** | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY_DEV`, `SUPABASE_SERVICE_ROLE_KEY_PROD`, `DEV_SUPABASE_SERVICE_ROLE_KEY` | Standardize on one naming convention. The fallback chain in `lib/supabase/admin.ts` has 4 variants |
| H3 | **Inline service role client creation bypasses centralized factory** | `app/actions/families.ts:8-19`, `app/actions/events.ts:2191-2209`, `app/backoffice/invite/[token]/page.tsx:23-42` | Use `createAdminClient()` from `lib/supabase/admin.ts` instead of inline `createClient()` with env vars |
| H4 | **`NEXT_PUBLIC_` prefix used for server-side-only values** | `lib/supabase/admin.ts:9` uses `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_` prefix means the value is bundled into client-side JS. While the URL itself is not secret, this pattern is confusing and inconsistent |
| H5 | **`RIO_AGENT_KEY` sent as empty string when missing** | `app/api/v1/ai/memories/route.ts:48,114,176` — `'x-agent-key': process.env.RIO_AGENT_KEY \|\| ''` | Sends empty string instead of failing. Should throw or return 500 |
| H6 | **Google Maps API key exposed as `NEXT_PUBLIC_`** | `components/_deprecated/event-forms/location-map-preview.tsx:22-23` | Google Maps API keys should be restricted by HTTP referrer. As `NEXT_PUBLIC_`, it's exposed to all clients |
| H7 | **`SUPABASE_JWT` secret stored in `.env.local`** | `.env.local:9` | JWT secret should never be in env files — it's used for signing tokens and should be managed by Supabase |

### Medium

| # | Finding | File(s) | Recommendation |
|---|---------|---------|---------------|
| M1 | **No env var validation at startup** | Entire codebase | Add a startup validation step that checks all required env vars are present before the app boots |
| M2 | **Inconsistent fallback behavior** | Multiple files | Some vars fail closed (`lib/ai/config.ts`), some fail open (`lib/rate-limit.ts`), some silently use defaults (`app/api/v1/ai/ingest/route.ts:157`) |
| M3 | **`NODE_ENV` checked 15+ times across codebase** | 15+ files | Centralize environment detection into a single `lib/env.ts` module |
| M4 | **Magic numbers not extracted to config** | `lib/supabase/middleware.ts:59` (TWO_HOURS_MS), `app/api/cron/check-return-dates/route.ts:59` (2 days) | Extract to named constants or env vars |
| M5 | **`RIO_DATABASE_CA` vs `RIO_DATABASE_CA_CERT` naming inconsistency** | `packages/rio-agent/src/lib/db.ts:29` vs `packages/rio-agent/src/tests/*.ts` | Two different env var names for the same concept |
| M6 | **`RIO_RAILWAY_URL` vs `RIO_AGENT_URL` naming inconsistency** | `lib/ai/config.ts:7-8`, `app/api/v1/ai/*/route.ts` | Two different env var names for the same concept |
| M7 | **`NEXT_PUBLIC_MAPBOX_TOKEN` vs `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`** | `components/map/*.tsx` vs `lib/mapbox-geocoding.ts:9` | Two different env var names for the same concept |
| M8 | **Scripts use `dotenv` to load `.env.local` directly** | `scripts/seed-household-items.ts`, `scripts/verify_stats_data.ts`, `check_types.ts` | These scripts bypass Next.js env handling and may behave differently in CI/CD |
| M9 | **`.agents/config.yaml` contains Supabase project URLs** | `.agents/config.yaml:16-18` | While not secrets, these are environment-specific values that should be in env vars, not config files |
| M10 | **No environment-specific config for feature flags** | Codebase-wide | Feature flags should be configurable per environment (dev/staging/prod) |

### Low

| # | Finding | File(s) | Recommendation |
|---|---------|---------|---------------|
| L1 | **`components/_deprecated/` still references env vars** | `components/_deprecated/map/MapboxEditorMap.tsx`, `components/_deprecated/event-forms/location-map-preview.tsx` | Deprecated code should not be maintained; consider removal |
| L2 | **`check_types.ts` is a stray file in project root** | `check_types.ts` | Move to `scripts/` or remove |
| L3 | **`packages/rio-agent/.env.example` is incomplete** | `packages/rio-agent/.env.example` | Missing `RIO_DATABASE_URL`, `RIO_DATABASE_CA`, `RIO_MODEL_ID`, `PORT`, `DEBUG`, `DEBUG_LOGGING` |
| L4 | **Console.log in middleware for missing env vars** | `lib/supabase/middleware.ts:13` | Should use structured logging, not console.log |
| L5 | **`BLOB_READ_WRITE_TOKEN` in `.env.local` but never used in code** | `.env.local:10` | Either remove or document where it's used |

---

## Security Analysis

### Secret Exposure Risk Assessment

| Secret | Exposure Vector | Risk | Mitigation |
|--------|----------------|------|------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Inline in 3 files, fallback chain in admin.ts | HIGH | Centralize in `createAdminClient()` |
| `SUPABASE_SERVICE_ROLE_KEY_PROD` | In `.env.local` | MEDIUM | Ensure never committed |
| `SUPABASE_JWT` | In `.env.local` | HIGH | Remove — not needed by app |
| `RIO_AGENT_KEY` | Sent as empty string in 3 routes | HIGH | Fail closed |
| `OPENROUTER_API_KEY` | In `packages/rio-agent/.env` | MEDIUM | Ensure never committed |
| `LLAMA_CLOUD_API_KEY` | In `packages/rio-agent/.env` | MEDIUM | Ensure never committed |
| `RIO_DATABASE_URL` | In `packages/rio-agent/.env` | HIGH | Contains DB password |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Exposed to browser | LOW | Restrict by referrer |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Exposed to browser | LOW | Mapbox tokens are designed for client use |
| `NEXT_PUBLIC_POSTHOG_KEY` | Exposed to browser | LOW | PostHog keys are designed for client use |

### `.gitignore` Adequacy

The root `.gitignore` has:
```
.env*
.env.local
```

This pattern `.env*` should catch `.env`, `.env.local`, `.env.production`, `.env.example` — **but `.env.example` should NOT be ignored** as it's a template file. The current pattern is too broad.

**Recommendation**: Change to:
```
.env
.env.local
.env.*.local
.env.production
```

### Dev/Prod Key Separation

The codebase uses multiple naming patterns for dev vs prod keys:
- `SUPABASE_SERVICE_ROLE_KEY` (generic)
- `SUPABASE_SERVICE_ROLE_KEY_DEV` (dev suffix)
- `SUPABASE_SERVICE_ROLE_KEY_PROD` (prod suffix)
- `DEV_SUPABASE_SERVICE_ROLE_KEY` (dev prefix)

The fallback chain in `lib/supabase/admin.ts` tries all four, which means:
1. In production, if `SUPABASE_SERVICE_ROLE_KEY` is set, it works
2. In development, if only `DEV_SUPABASE_SERVICE_ROLE_KEY` is set, it works
3. **But**: If `SUPABASE_SERVICE_ROLE_KEY` is set in dev, it could accidentally use the prod key

---

## Performance Analysis

| Finding | Impact | Effort |
|---------|--------|--------|
| No env var caching | `process.env` is read on every call in some files | Low |
| `dotenv` loaded in scripts | Scripts load `.env.local` synchronously | Low |
| No startup validation | App boots without checking required vars, fails later | Medium |

**Note**: Environment variable access in Node.js is fast (in-memory lookup). The performance impact is negligible. The real concern is reliability — failing fast at startup vs. failing mid-request.

---

## Code Quality Analysis

### Inconsistencies Summary

| Category | Count | Examples |
|----------|-------|----------|
| Duplicate env var names | 4 pairs | `RIO_RAILWAY_URL`/`RIO_AGENT_URL`, `RIO_DATABASE_CA`/`RIO_DATABASE_CA_CERT`, `NEXT_PUBLIC_MAPBOX_TOKEN`/`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY` variants |
| Inline env access (should use factory) | 5 locations | `families.ts`, `events.ts`, `backoffice/invite/`, `scripts/*.ts` |
| Missing from `.env.example` | 15+ vars | Root `.env.example` doesn't exist; Río `.env.example` is incomplete |
| `NODE_ENV` checks scattered | 15+ files | Should be centralized |
| Magic numbers | 3+ | `TWO_HOURS_MS`, `2 days`, `60 seconds grace` |

### Pattern Compliance

| Pattern | Compliant? | Notes |
|---------|-----------|-------|
| Centralized Supabase client creation | ⚠️ Partial | `createAdminClient()` exists but not used everywhere |
| Fail-closed configuration | ⚠️ Partial | `lib/ai/config.ts` ✅, `lib/rate-limit.ts` ❌, cron routes ❌ |
| Environment-specific config | ❌ No | No staging environment config |
| Startup validation | ❌ No | No env var validation at boot |
| Secret management | ❌ No | No vault, no rotation strategy |

---

## Recommendations

### Immediate (This Week)

- [ ] **C1: Create `.env.example` at project root** — Document all 28+ required env vars with descriptions, example values, and which are secrets vs public
- [ ] **C4: Make `CRON_SECRET` mandatory** — Fail closed in both cron routes. If not configured, return 500
- [ ] **H1: Make rate limiting fail-closed** — When Redis is unavailable, deny requests instead of allowing them
- [ ] **H5: Fail closed on missing `RIO_AGENT_KEY`** — Don't send empty string; throw or return 500
- [ ] **H3: Replace inline service role clients** — Use `createAdminClient()` in `families.ts`, `events.ts`, `backoffice/invite/`

### Short-term (Next Sprint)

- [ ] **H2: Standardize secret naming** — Pick one convention (`SUPABASE_SERVICE_ROLE_KEY` for current env, no `_DEV`/`_PROD` suffixes)
- [ ] **M1: Add startup env validation** — Create `lib/env.ts` that validates all required vars at boot
- [ ] **M3: Centralize `NODE_ENV` checks** — Single `isProduction()`, `isDevelopment()` module
- [ ] **M6-M7: Deduplicate env var names** — Pick one name per concept, deprecate others
- [ ] **M8: Move scripts to use centralized config** — Don't load `.env.local` directly in scripts
- [ ] **L3: Complete `packages/rio-agent/.env.example`** — Add missing vars

### Future (Backlog)

- [ ] **Add staging environment** — Dev → Staging → Prod pipeline
- [ ] **Implement secret rotation strategy** — Document how to rotate Supabase keys, API keys
- [ ] **Add environment-specific feature flags** — Configurable per environment
- [ ] **Remove `SUPABASE_JWT` from `.env.local`** — Not used by the application
- [ ] **Remove `BLOB_READ_WRITE_TOKEN` if unused** — Or document where it's used
- [ ] **L1: Remove `components/_deprecated/`** — Or at least stop maintaining it
- [ ] **L2: Move `check_types.ts` to `scripts/`**

---

## Appendix: Complete Env Var Map

### Public (NEXT_PUBLIC_*) — Safe for browser

| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | All Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | — | All Supabase clients |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Auth redirects, internal API calls |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | — | Map components (4 files) |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | No | — | Geocoding (1 file) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | — | Deprecated map component |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | No | — | Deprecated map component |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | — | PostHog analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | `https://us.i.posthog.com` | PostHog analytics |

### Private (Server-only) — Must not be exposed

| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `SUPABASE_URL` | No | Falls back from `NEXT_PUBLIC_SUPABASE_URL` | Middleware |
| `SUPABASE_ANON_KEY` | No | Falls back from `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Middleware |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Admin client, scripts |
| `SUPABASE_SERVICE_ROLE_KEY_DEV` | No | — | Dev fallback |
| `SUPABASE_SERVICE_ROLE_KEY_PROD` | No | — | Prod fallback |
| `DEV_SUPABASE_SERVICE_ROLE_KEY` | No | — | Dev fallback (alt name) |
| `RIO_RAILWAY_URL` | No | — | Río agent URL |
| `RIO_AGENT_URL` | No | — | Río agent URL (alt) |
| `RIO_DATABASE_URL` | Yes (prod) | — | Río DB connection |
| `RIO_DATABASE_CA` | No | — | Río DB SSL cert |
| `RIO_DATABASE_CA_CERT` | No | — | Río DB SSL cert (alt) |
| `RIO_MODEL_ID` | No | `google/gemini-2.5-flash` | Río model selection |
| `RIO_AGENT_KEY` | Yes | — | BFF↔Agent auth |
| `OPENROUTER_API_KEY` | Yes (prod) | — | Río LLM access |
| `LLAMA_CLOUD_API_KEY` | No | — | Río document parsing |
| `CRON_SECRET` | No | — | Cron endpoint auth |
| `UPSTASH_REDIS_REST_URL` | No | — | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | — | Rate limiting |
| `BLOB_READ_WRITE_TOKEN` | No | — | Vercel Blob (unused?) |
| `SUPABASE_JWT` | No | — | Not used by app |

### Runtime

| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `NODE_ENV` | Auto | `development` | 15+ files |
| `CI` | Auto | — | Playwright config |
| `DEBUG` | No | — | Río debug mode |
| `DEBUG_LOGGING` | No | — | Río debug logging |
| `PORT` | No | `3001` | Río agent port |

---

*Audit completed: 2026-04-11*
