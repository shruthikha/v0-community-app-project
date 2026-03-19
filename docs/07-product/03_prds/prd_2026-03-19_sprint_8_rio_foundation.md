# PRD: Río AI — Sprint 8 / Sprint 1: Foundation

> **Pilot Tenants (confirmed via DB)**:
> - **Alegria** — `9dfddd33-5a7c-4e5f-a1b8-fe05343b3934` (`slug: alegria`)
> - **Ecovilla San Mateo** — `0cfc777f-5798-470d-a2ad-c8573eceba7e` (`slug: ecovilla-san-mateo`)
>
> Both tenants are used for #185 seeding and #176 cross-tenant isolation testing.

**Date**: 2026-03-19
**Sprint**: 8 (Roadmap) / Sprint 1 (Río Naming Convention)
**Status**: Scoped — Awaiting User Confirmation
**Epic**: [#159 — [Epic] Río AI — Sprint 1: Foundation](https://github.com/mjcr88/v0-community-app-project/issues/159)
**Blueprint**: [`blueprint_rio_agent.md`](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md) — Phase 3, Sprint 1
**Lead Agents**: `backend-specialist`, `security-auditor`, `devops-engineer`, `frontend-specialist`

---

## Overview

This sprint establishes the **complete database and infrastructure foundation** for the Río AI agent. No resident-facing features are shipped. The goal is to apply all formal `rio_*` schema migrations, lock down the storage bucket, implement fail-closed feature flags, seed the pilot tenant, create cross-tenant isolation CI tests, and stand up proper Railway staging/production environments.

> **Blueprint anchor**: [§ Phase 3 — Sprint 1: Foundation](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md)

### ⛔ Sprint 1 Go/No-Go Gate (Exit Criteria)

All of the following MUST pass before Sprint 2 work begins:

- [ ] All `rio_*` migrations applied cleanly on **staging AND production** Supabase
- [ ] HNSW index verified on `rio_document_chunks.embedding` (`EXPLAIN ANALYZE` shows index scan)
- [ ] Private `rio-documents` Storage bucket created — resident 403, tenant_admin signed URL works
- [ ] `rio.enabled = false` enforced in middleware (no Río UI rendered for non-pilot tenants)
- [ ] `rio_configurations` row seeded for pilot tenant; agent responds without crashing
- [ ] Cross-tenant chunk isolation integration test passing in CI on every push
- [ ] Railway staging + production services responding on `/health`

> ⚠️ **If any gate item fails: Sprint 2 does NOT start. Root cause must be resolved first.**

---

## Selected Issues

| Priority | Issue | Title | Size | Risk | Points |
|----------|-------|-------|------|------|--------|
| 1 | [#172](https://github.com/mjcr88/v0-community-app-project/issues/172) | S1.1: DB migrations — all `rio_*` tables + `user_memories` | M | 🟡 MED | 3 |
| 2 | [#173](https://github.com/mjcr88/v0-community-app-project/issues/173) | S1.2: HNSW index on `rio_document_chunks.embedding` | XS | 🟢 LOW | 1 |
| 3 | [#174](https://github.com/mjcr88/v0-community-app-project/issues/174) | S1.3: Private Supabase Storage bucket `rio-documents` | S | 🔴 HIGH | 2 |
| 4 | [#175](https://github.com/mjcr88/v0-community-app-project/issues/175) | S1.4: Río feature flags in `tenants.features` JSONB | S | 🟡 MED | 2 |
| 5 | [#185](https://github.com/mjcr88/v0-community-app-project/issues/185) | S1.5: Seed `rio_configurations` for pilot tenant | XS | 🟢 LOW | 1 |
| 6 | [#176](https://github.com/mjcr88/v0-community-app-project/issues/176) | S1.6: Cross-tenant chunk isolation integration test (CI) | S | 🔴 HIGH | 2 |
| 7 | [#186](https://github.com/mjcr88/v0-community-app-project/issues/186) | S1.7: Railway staging + production environments | M | 🟡 MED | 3 |

**Total Story Points**: 14 | **Est. Hours**: ~28–52h | **Duration**: ~1.5–2 weeks

### Sizing Estimates (T-shirt → Hours)

| Size | Hours | Points |
|------|-------|--------|
| XS | 2–4h | 1 |
| S | 4–8h | 2 |
| M | 1–2d (8–16h) | 3–5 |

### Why All 7 Issues Are Selected

1. **Hard sequential dependencies**: The DB tables (#172) must exist before the HNSW index (#173), bucket policies (#174), feature flag seed (#185), CI test (#176), or any Sprint 2 work can function.
2. **The temp spike migration** (`20260318000000_rio_spike_chunks_temp.sql`) created in Sprint 7 for validation is intentionally temporary — #172 replaces it with the full formal schema.
3. **No good grouping split**: Issues #172 → #173 → #185 are so tightly coupled (≤ 4h each) that splitting them into separate sprints would create artificial gates. They are best shipped as a single migration branch.
4. **#186 (Railway envs)** can run in parallel with DB work since it's purely environment configuration with zero code changes.
5. **Sizing is within 1.5–2 week capacity** for solo developer. No need to split.

### ⚠️ Complexity Risk Flags

| Issue | Risk Level | Reason |
|-------|------------|--------|
| #174 | 🔴 HIGH | Storage security — wrong bucket policy = public data exposure |
| #176 | 🔴 HIGH | Security CI gate — must prove pgvector WHERE clause isolation |
| #172 | 🟡 MED | Multiple interdependent tables; FK constraints need careful ordering |

---

## Architecture & Git Strategy

### Supabase Migration Context

The **temporary spike migration** `20260318000000_rio_spike_chunks_temp.sql` (from Sprint 7 #170) creates only `rio_document_chunks`. **Sprint 8 replaces this** with the full formal schema for all `rio_*` tables. The temp migration must be **superseded** (not deleted — Supabase tracks migration history), so #172 will use a later timestamp.

### Monorepo Dependencies

```
v0-community-app-project/
├── supabase/migrations/      ← #172 (tables), #173 (index), #174 (bucket SQL)
├── packages/rio-agent/
│   └── src/tests/            ← #176 (cross-tenant CI test)
└── app/                      ← #175 (feature flags hook/middleware)
```

### Git Branching Model

**Key decision: 2 branches instead of 7.**

Given the tight dependency chain and that 5 of the 7 issues touch the same migration directory:

| Branch | Issues Grouped | Base | Rationale |
|--------|---------------|------|-----------|
| `feat/sprint-8-rio-foundation` | #172, #173, #185, #174, #175, #176 | `main` | All Supabase + code changes belong together — migrations must deploy atomically |
| `feat/186-railway-environments` | #186 | `main` | Purely Railway config, no code — independent, can be done in parallel |

**Reasoning against 7 individual branches:**
- Supabase migrations must be applied in order — shipping them across 5 separate PRs risks merge-order conflicts and partial-state deployments.
- Issues #173 and #185 are each < 4h (XS). Creating PRs for each creates review overhead that costs more than the isolation benefit.
- #174 (storage bucket) requires the #172 tables to exist — they must ship together or be applied in a single deploy.
- **Exception for #186**: Railway env setup has zero shared state with migration files — fully safe to separate and proceed in parallel.

### Branch Dependencies

```
main
├── feat/sprint-8-rio-foundation   (issues: #172, #173, #174, #175, #185, #176)
└── feat/186-railway-environments  (issue: #186) — PARALLEL, merge anytime
```

### ⚠️ DevOps / CI Pipeline Notes

1. **Migration sequencing**: The Sprint 7 temp migration used timestamp `20260318000000`. Sprint 8 migrations MUST use a timestamp ≥ `20260319000000` to ensure proper ordering.
2. **pgvector extension**: Already enabled in Supabase Pro (Sprint 7). No re-enable needed.
3. **Staging-first deploy**: All migrations must be verified on **staging** (dev Supabase project) before applying to **production**. Use `supabase db push` CLI or Supabase MCP tool.
4. **CI integration (#176)**: The cross-tenant test requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as CI secrets. Add to GitHub Actions environment if not already present.
5. **Railway (#186)**: Two separate Railway services. Staging must point to dev Supabase; production to prod Supabase. **Verify no credential cross-contamination**.
6. **Env vars for #175**: Feature flag check is purely DB-driven via `tenants.features` JSONB — no new env vars needed.

---

## Implementation Order

```
[GATE]  Sprint 7 Go/No-Go: All checks passed ✅ → Sprint 8 begins
   ↓
   #172 → Formal DB migrations (all rio_* tables + user_memories)
   ↓
   #173 → HNSW index (depends on rio_document_chunks from #172)
   ↓
   #185 → Seed rio_configurations pilot row (depends on table from #172)
   ↓
   #174 → Private storage bucket + access policy (depends on tenant schema context from #172)
   ↓
   #175 → Feature flags middleware (depends on feature flag structure in tenants table)
   ↓
   #176 → Cross-tenant chunk isolation CI test (depends on rio_document_chunks schema from #172)
   ↓
[GATE]  Sprint 8 Go/No-Go evaluation → Sprint 2 (S2) begins

PARALLEL (start anytime):
   #186 → Railway staging + production environments
```

> **Implementation rationale**: Security-critical items (#174 bucket, #176 CI) run after their DB prerequisites but before the sprint gate. Quick wins (#173 XS, #185 XS) are batched early for momentum. #186 is fully independent.

---

## Issue Implementation Plans

---

### Issue #172 — S1.1: DB Migrations — All `rio_*` Tables + `user_memories`

**Agent**: `backend-specialist`
**Branch**: `feat/sprint-8-rio-foundation`
**Requirement ref**: [Epic #159](https://github.com/mjcr88/v0-community-app-project/issues/159) — Sub-Issues table
**Blueprint Ref**: [§2.1 — Database Schema](../01_idea/blueprint_rio_agent.md)
**Size**: M (8–16h) | **Risk**: 🟡 MED

#### Context

The Sprint 7 spike migration (`20260318000000_rio_spike_chunks_temp.sql`) created a **temporary** `rio_document_chunks` table for validation only. Sprint 8 replaces this with the full formal schema for all Río tables. The temp migration **is not deleted** — a new migration supersedes it.

#### Code Changes

**New migration file**: `supabase/migrations/20260319000000_rio_foundation.sql`

Tables to create (in this order, respecting FK constraints):

| Table | Purpose | FK Constraint |
|-------|---------|--------------|
| `rio_configurations` | Per-tenant AI config + system prompt | `tenant_id → tenants(id)` |
| `rio_documents` | Knowledge base file metadata | `tenant_id → tenants(id)` |
| `rio_document_chunks` | Vector embeddings — primary RAG table | `tenant_id → tenants(id)`, `document_id → rio_documents(id)` |
| `rio_threads` | Conversation thread metadata | `tenant_id → tenants(id)`, `user_id → auth.users(id)` |
| `rio_messages` | Per-message conversation history | `thread_id → rio_threads(id)` |
| `user_memories` | Long-term structural memory (Sprint 5) | `tenant_id → tenants(id)`, `user_id → auth.users(id)` |

**Schema rules** (from blueprint):
- All tables include `tenant_id UUID NOT NULL REFERENCES tenants(id)`
- No RLS on agent-side tables — manual `WHERE tenant_id = $1` enforcement
- Exception: `rio_document_chunks` keeps RLS policy from spike (retain pattern)

#### Acceptance Criteria

- [x] **AC1**: When `supabase db push` runs on staging, then the migration applies without errors and `\dt rio_*` shows all 6 new tables plus `user_memories`.
- [x] **AC2**: Given each table, when `\d+ <tablename>` is run, then all expected columns match the blueprint schema (verified manually).
- [x] **AC3**: Given the FK constraint `rio_document_chunks.tenant_id → tenants.id`, when an insert is attempted with a non-existent `tenant_id`, then a FK violation error is thrown (not a silent failure).
- [x] **AC4**: When the temp spike migration (`20260318000000`) is already applied and the new `20260319000000` migration runs, then Supabase reports success (no duplicate table conflict — use `CREATE TABLE IF NOT EXISTS` guards).

#### Handover → #173, #174, #185, #176

`backend-specialist` confirms:
- All 6 tables visible in Supabase dashboard on staging
- No migration errors in `supabase db push` output

---

### Issue #173 — S1.2: HNSW Index on `rio_document_chunks.embedding`

**Agent**: `backend-specialist`
**Branch**: `feat/sprint-8-rio-foundation`
**Blueprint Ref**: [§1.4 — Embedding Model Selection [ADR-004]](../01_idea/blueprint_rio_agent.md)
**Size**: XS (2–4h) | **Risk**: 🟢 LOW

#### Context

The temp spike migration already created an HNSW index on the **temporary** table. The formal Sprint 8 migration (#172) replaces that table — so the index must be (re)created as part of `20260319000000_rio_foundation.sql`.

#### Code Changes

**Included in** `supabase/migrations/20260319000000_rio_foundation.sql`:

```sql
CREATE INDEX rio_chunks_embedding_idx
  ON rio_document_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 128);

CREATE INDEX rio_chunks_tenant_idx
  ON rio_document_chunks (tenant_id);
```

> **Note**: This is a 2-line addition to the #172 migration file — no separate file needed.

#### Acceptance Criteria

- [x] **AC1**: When `EXPLAIN ANALYZE SELECT ... FROM rio_document_chunks ORDER BY embedding <=> $1 LIMIT 5` is run, then the query plan shows `Index Scan using rio_chunks_embedding_idx`.
- [x] **AC2**: Given an empty table, when 10 consecutive similarity queries run, then average latency is < 10ms (noise floor baseline, logged to console).
- [x] **AC3**: When `\d rio_document_chunks` is run, then `rio_chunks_embedding_idx` and `rio_chunks_tenant_idx` both appear in the index list.

---

### Issue #174 — S1.3: Private Supabase Storage Bucket `rio-documents`

**Agent**: `security-auditor` + `backend-specialist`
**Branch**: `feat/sprint-8-rio-foundation`
**Risk**: 🔴 HIGH — Storage security. **Requires review before merge.**
**Blueprint Ref**: [§1.9 — Security](../01_idea/blueprint_rio_agent.md)

#### Code Changes

**New migration file**: `supabase/migrations/20260319010000_rio_storage.sql`

```sql
-- Create private rio-documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('rio-documents', 'rio-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Only tenant_admin role can read/write in their tenant folder
CREATE POLICY "Tenant admin can upload to their tenant folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rio-documents'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  AND (auth.jwt() ->> 'role') = 'tenant_admin'
);

CREATE POLICY "Tenant admin can read their tenant folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'rio-documents'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  AND (auth.jwt() ->> 'role') = 'tenant_admin'
);
```

All resident uploads must go through a server-side signed URL endpoint (to be built in a future sprint).

#### Acceptance Criteria

- [x] **AC1**: Given the `rio-documents` bucket in Supabase dashboard, when "Public bucket" is checked, then it shows `false` (private).
- [x] **AC2**: Given a user with `role = 'resident'`, when they attempt a direct upload to `rio-documents`, then they receive HTTP 403.
- [x] **AC3**: Given a user with `role = 'tenant_admin'` for `tenant_id = X`, when they upload a file to `rio-documents/X/document.pdf`, then the upload succeeds and a signed URL can be generated.
- [x] **AC4**: Given a `tenant_admin` for Tenant A, when they attempt to read a file in `rio-documents/[Tenant-B-id]/...`, then they receive HTTP 403.

#### 🔴 Rollback Strategy

If incorrect access policies are detected: Remove all `CREATE POLICY` statements, delete the bucket via Supabase dashboard, and re-audit JWT claims structure before re-applying. **Do NOT leave a misconfigured bucket in place.**

---

### Issue #175 — S1.4: Río Feature Flags in `tenants.features` JSONB

**Agent**: `frontend-specialist` + `backend-specialist`
**Branch**: `feat/sprint-8-rio-foundation`
**Blueprint Ref**: [§1.8 — Feature Flags](../01_idea/blueprint_rio_agent.md)
**Size**: S (4–8h) | **Risk**: 🟡 MED

#### Context

The `tenants` table already has a `features` JSONB column. The issue adds Río-specific flags to that column and ensures the app respects them fail-closed. The `useTenantFeatures` hook referenced in the issue does not currently exist — it needs to be created.

#### Code Changes

**New migration** `supabase/migrations/20260319020000_rio_feature_flags.sql`:

```sql
-- Backfill: Add rio flags to all existing tenants (fail-closed)
UPDATE tenants
SET features = features || '{"rio": {"enabled": false, "rag": false, "memory": false, "actions": false}}'::jsonb
WHERE features->>'rio' IS NULL;

-- Ensure default for future tenants
ALTER TABLE tenants
ALTER COLUMN features SET DEFAULT '{"rio": {"enabled": false, "rag": false, "memory": false, "actions": false}}'::jsonb;
```

**New hook** `app/hooks/useTenantFeatures.ts`:
```typescript
// Returns parsed tenant feature flags with fail-closed defaults
// rio.enabled = false if flag is missing or false
```

**New middleware guard** in `app/[tenant]/layout.tsx` (or equivalent layout):
- Check `useTenantFeatures().rio.enabled`
- If false, do not render any Río chat UI components

#### Acceptance Criteria

- [x] **AC1**: Given a tenant without `rio` in their `features` JSONB, when `useTenantFeatures().rio.enabled` is called, then it returns `false` (fail-closed default).
- [x] **AC2**: Given `rio.enabled = false` in the tenant's features, when a resident navigates to the tenant's app, then no Río UI component renders (confirmed via DOM inspection).
- [x] **AC3**: Given `rio.enabled = true` (manually set for pilot tenant), when `useTenantFeatures().rio.enabled` is called, then it returns `true`.
- [x] **AC4**: When the migration runs, then all existing tenants have `features.rio.enabled = false` without crashing.

---

### Issue #185 — S1.5: Seed `rio_configurations` Default Row for Pilot Tenant

**Agent**: `backend-specialist`
**Branch**: `feat/sprint-8-rio-foundation`
**Blueprint Ref**: [§2.1 — `rio_configurations` table](../01_idea/blueprint_rio_agent.md)
**Size**: XS (2–4h) | **Risk**: 🟢 LOW

#### Context

The `rio_configurations` table is created in #172. This issue seeds a default row for the pilot tenant so that Sprint 2 chat testing works without requiring an admin to configure anything first.

#### Code Changes

**New seed/migration** `supabase/migrations/20260319030000_rio_pilot_seed.sql`:

```sql
-- Seed default rio_configurations for both pilot tenants
-- Alegria:            9dfddd33-5a7c-4e5f-a1b8-fe05343b3934
-- Ecovilla San Mateo: 0cfc777f-5798-470d-a2ad-c8573eceba7e

INSERT INTO rio_configurations (
  tenant_id,
  prompt_community_name,
  prompt_tone,
  prompt_language,
  preferred_model
)
VALUES
  (
    '9dfddd33-5a7c-4e5f-a1b8-fe05343b3934',  -- Alegria
    'Alegria',
    'friendly',
    'es',
    'gemini-flash'
  ),
  (
    '0cfc777f-5798-470d-a2ad-c8573eceba7e',  -- Ecovilla San Mateo
    'Ecovilla San Mateo',
    'friendly',
    'es',
    'gemini-flash'
  )
ON CONFLICT (tenant_id) DO NOTHING;
```

#### Acceptance Criteria

- [x] **AC1**: When `SELECT * FROM rio_configurations WHERE tenant_id IN ('9dfddd33-5a7c-4e5f-a1b8-fe05343b3934', '0cfc777f-5798-470d-a2ad-c8573eceba7e')` is run, then **exactly 2 rows** are returned, each with `preferred_model = 'gemini-flash'`.
- [x] **AC2**: Given the agent is started and queried by either pilot tenant, when a chat message is sent, then the agent returns a valid response without crashing on any missing optional `rio_configurations` fields.

---

### Issue #176 —### S1.6: Cross-tenant chunk isolation integration test (CI) [DONE]
- **Owner**: Antigravity
- **Status**: ✅ Complete
- **Description**: Technical verification that similarity searches respect `tenant_id`.
- **AC**: [x] 100 parallel runs, zero leaks.
**Agent**: `security-auditor`
**Branch**: `feat/sprint-8-rio-foundation`
**Risk**: 🔴 HIGH — Security CI gate. **Requires senior review before merge.**
**Blueprint Ref**: [§1.9 — Security, ADR-009](../01_idea/blueprint_rio_agent.md)
**Size**: S (4–8h)

#### Context

Sprint 7 #169 validated **thread isolation** at the Mastra memory layer. This issue validates **vector chunk isolation** at the pgvector/Supabase layer — a separate and equally critical security property.

The **two real pilot tenants** are used as the isolation pair — this proves isolation on production-representative data rather than synthetic UUIDs:
- **Tenant A (Alegria)**: `9dfddd33-5a7c-4e5f-a1b8-fe05343b3934`
- **Tenant B (Ecovilla San Mateo)**: `0cfc777f-5798-470d-a2ad-c8573eceba7e`

#### Test Scenario

1.  Insert 5 test chunks for Alegria (`tenant_id = 9dfddd33-...`) and 5 for Ecovilla (`tenant_id = 0cfc777f-...`)
2.  Execute `SELECT ... FROM rio_document_chunks WHERE tenant_id = $alegraId ORDER BY embedding <=> $query LIMIT 10`
3.  Assert: ALL returned chunks have `tenant_id = alegraId` — zero Ecovilla chunks
4.  Repeat for Ecovilla: assert ZERO Alegria chunks appear
5.  Run 100 iterations with random query vectors — assert 0 cross-tenant results across all iterations
6.  Clean up all inserted test chunks (delete by a test-run UUID marker in metadata)

#### Code Changes

**New file**: `packages/rio-agent/src/tests/chunk-isolation.test.ts`

Uses the Supabase **service role client** (bypasses RLS) to insert test chunks, and the **anon/authenticated client** (with tenant context) to query — confirming isolation holds at both layers. Test chunks use dummy embeddings (random float arrays, 1536-dim) — no real AI calls needed.

**Run command**: `npm run test -- chunk-isolation` (inside `packages/rio-agent/`)

> **CI integration**: Add test to GitHub Actions workflow to run on every push to `main` and the foundation branch.

#### Acceptance Criteria

- [ ] **AC1**: Given chunks for Tenant A and Tenant B are inserted, when Tenant A executes a similarity search with `WHERE tenant_id = tenantAId`, then 0 chunks with `tenant_id = tenantBId` appear in results.
- [ ] **AC2**: Given 100 random similarity queries for Tenant A, then 0 cross-tenant (Tenant B) chunks appear across all 100 queries.
- [ ] **AC3**: When `chunk-isolation.test.ts` runs in CI, then it exits code 0 on pass, code 1 on fail.
- [ ] **AC4**: The test cleans up all inserted test data after each run (no persistent test pollution in the DB).

#### 🔴 Rollback Strategy

If isolation fails (cross-tenant chunks appear): **immediately block Sprint 2**. Audit the `WHERE tenant_id = $1` clause in the RAG search query. Do not proceed until the test passes 100/100.

#### Handover Notes

After this test passes, `security-auditor` provides:
- Test output showing `PASS` for all 100 iterations
- Confirmation that CI workflow is configured to run on every push

---

### Issue #186 — S1.7: Railway Staging + Production Environments

**Agent**: `devops-engineer`
**Branch**: `feat/186-railway-environments`
**Blueprint Ref**: [§ DevOps — Railway Deployment](../01_idea/blueprint_rio_agent.md)
**Size**: M (8–16h) | **Risk**: 🟡 MED

#### Context

Sprint 7 deployed the Mastra agent as a single Railway service for the spike. Sprint 8 formalizes this into **two separate environments**: staging and production, with isolated Supabase projects and proper CI/CD.

#### Scope

Two separate Railway services:
- `rio-agent-staging` → dev Supabase project
- `rio-agent-production` → prod Supabase project

**Deploy triggers**:
- `main` branch push → `rio-agent-production` (Railway auto-deploy)
- `develop` branch push → `rio-agent-staging`

#### Environment Variables Per Service

| Variable | Staging | Production |
|----------|---------|-----------|
| `SUPABASE_URL` | Dev project URL | Prod project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev service role key | Prod service role key |
| `GOOGLE_AI_API_KEY` | Shared (same key) | Shared (same key) |
| `POSTHOG_API_KEY` | Staging PostHog project | Prod PostHog project |
| `POSTHOG_HOST` | `https://app.posthog.com` | `https://app.posthog.com` |
| `PORT` | Assigned by Railway | Assigned by Railway |

> **Note**: `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` referenced in the original issue are **outdated** — PostHog replaced Langfuse in Sprint 7 #171. Remove from issue description.

#### Acceptance Criteria

- [ ] **AC1**: When `GET https://rio-agent-staging.up.railway.app/health` is called, then HTTP 200 `{ status: "ok" }` is returned.
- [ ] **AC2**: When `GET https://rio-agent-production.up.railway.app/health` is called, then HTTP 200 `{ status: "ok" }` is returned.
- [ ] **AC3**: Given the staging service config, when all env vars are inspected in Railway dashboard, then zero production credentials (`SUPABASE_SERVICE_ROLE_KEY` for prod project) appear in the staging service.
- [ ] **AC4**: When a push is made to `main`, then Railway automatically deploys to `rio-agent-production` (verified via Railway deployment log).

---

## Definition of Done

Applies to **every issue** in this sprint:

- [ ] Code passes `npm run lint` (in `packages/rio-agent/` for agent code, root for app code)
- [ ] Code passes `npx tsc --noEmit`
- [ ] PR created (Draft → Ready) with description linking to this PRD and the relevant issues
- [ ] All Acceptance Criteria for the issue marked `[x]` in this PRD
- [ ] Manual QA verification completed per ACs
- [ ] No new P0 bugs introduced
- [ ] Worklog created at `docs/07-product/04_logs/log_YYYY-MM-DD_{issue-slug}.md`
- [ ] Any documentation gaps logged in `docs/documentation_gaps.md`
- [ ] Supabase migrations verified on **staging before production**

---

## Sprint Schedule

> Assumes **solo developer**, **sequential execution**, starting **2026-03-20** (next business day). Dates below are targets.

| Issue | Group | Size | Est. Hours | Start | Target |
|-------|-------|------|------------|-------|--------|
| #172 (DB migrations) | foundation | M | 8–16h | 2026-03-20 | 2026-03-21 |
| #173 (HNSW index) | foundation | XS | 2–4h | 2026-03-21 | 2026-03-21 |
| #185 (Seed config) | foundation | XS | 2–4h | 2026-03-21 | 2026-03-21 |
| #174 (Storage bucket) | foundation | S | 4–8h | 2026-03-24 | 2026-03-24 |
| #175 (Feature flags) | foundation | S | 4–8h | 2026-03-25 | 2026-03-25 |
| #176 (CI test) | foundation | S | 4–8h | 2026-03-26 | 2026-03-26 |
| **Go/No-Go Gate** | — | — | — | 2026-03-27 | 2026-03-27 |
| #186 (Railway envs) | railway | M | 8–16h | 2026-03-20 | 2026-03-21 |

> *#173 and #185 are batched same-day as they are XS. #186 runs in parallel from day 1. Buffer days added between risk items.*

---

## Worklog Links

| Issue | Worklog | Status |
|-------|---------|--------|
| #172 | *(created during /04_build)* | — |
| #173 | *(created during /04_build)* | — |
| #174 | *(created during /04_build)* | — |
| #175 | *(created during /04_build)* | — |
| #185 | *(created during /04_build)* | — |
| #176 | *(created during /04_build)* | — |
| #186 | *(created during /04_build)* | — |

---

## Upcoming Sprints Context

- The `rio_document_chunks` table created formally here **replaces** the temp spike table from Sprint 7
- The `/test-rio` page created in Sprint 7 #168 will be **deleted** at the start of Sprint 2's chat UI work
- `RAILWAY_AGENT_URL` set in Sprint 7 becomes a permanent Vercel env var for all future sprints
- Sprint 2 (S2) will implement the Vercel BFF `/api/v1/ai/chat` production route and the `RioChatSheet` component

---

*Source: [`blueprint_rio_agent.md`](../01_idea/blueprint_rio_agent.md), [#159](https://github.com/mjcr88/v0-community-app-project/issues/159)*
*Patterns: [`nido_patterns.md`](/Users/mj/Developer/v0-community-app-project/docs/07-product/06_patterns/nido_patterns.md)*
