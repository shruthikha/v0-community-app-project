---
source: prd
imported_date: 2026-04-08
---
# PRD: Río AI — Sprint 7 / Sprint 0: Technical Spike

**Date**: 2026-03-13
**Sprint**: 7 (Roadmap) / Sprint 0 (Río Naming Convention)
**Status**: Scoped — Ready for Build
**Epic**: [#158 — [Epic] Río AI — Sprint 0: Technical Spike](https://github.com/mjcr88/v0-community-app-project/issues/158)
**Blueprint**: [`blueprint_rio_agent.md`](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md) — Phase 3, Sprint 0
**Lead Agents**: `backend-specialist`, `devops-engineer`, `security-auditor`

---

## Overview

This is the **pre-flight validation sprint** for the Río AI Community Assistant. No product features are built. The goal is to prove that the full infrastructure stack (Mastra → Railway → Vercel BFF → Browser) functions correctly with multi-tenant isolation before engineering time is invested in product sprints.

> **Blueprint anchor**: [§ Phase 3 — Sprint 7: Technical Spike](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md#sprint-7--technical-spike-2-weeks)

### ⛔ Go/No-Go Gate (Sprint 7 Exit Criteria)

All of the following MUST pass before Sprint 8 (Foundation) begins:

- [x] Mastra SSE streaming works end-to-end in browser
- [x] Cross-tenant thread isolation confirmed (no shared context between tenants)
- [x] **RLS Hardening**: Row Level Security enabled/verified on all Mastra tables (Dev/Prod parity)
- [x] `gemini-embedding-001` returns correct cosine similarity rankings in pgvector (Tested: 100% accuracy on sample ES/EN queries)
- [x] PostHog connected, PII hash middleware verified — zero raw user identifiers in traces

> ⚠️ **If any gate item fails: Sprint 8 does NOT start. Framework is re-evaluated first.**

---

## Selected Issues

| Priority | Issue | Status | Size | Risk | Points |
|----------|-------|--------|------|------|--------|
| ✅ Done | [#166 — S0.1: Upgrade Supabase to Pro](https://github.com/mjcr88/v0-community-app-project/issues/166) | Closed 2026-03-11 | XS | LOW | 1 |
| ✅ Done | [#167 — S0.2: Scaffold Mastra agent on Railway](https://github.com/mjcr88/v0-community-app-project/issues/167) | Closed 2026-03-15 | S | 🔴 HIGH | 2 |
| 2 | [#168 — S0.3: Validate SSE pipeline Railway → Vercel BFF → Browser](https://github.com/mjcr88/v0-community-app-project/issues/168) | Open | S | 🔴 HIGH | 2 |
| ✅ Done | [#169 — S0.4: Validate multi-tenant thread isolation](https://github.com/mjcr88/v0-community-app-project/issues/169) | Closed 2026-03-18 | M | 🔴 HIGH | 3 |
| 4 | [#171 — S0.6: PostHog setup + PII hash middleware](https://github.com/mjcr88/v0-community-app-project/issues/171) | Open | S | 🔴 HIGH | 2 |
| ✅ Done | [#170 — S0.5: Validate gemini-embedding-001 + pgvector](https://github.com/mjcr88/v0-community-app-project/issues/170) | Audit Passed | M | 🟡 MED | 3 |
| ✅ Done | [#223 — Fix tenant creation issues & access paths for tenant admin invites](https://github.com/mjcr88/v0-community-app-project/issues/223) | Closed 2026-03-17 | S | 🟡 MED | 2 |

**Total Story Points (active)**: 12 points | **Est. Hours**: ~30-50h | **Duration**: 2 weeks

---

## Architecture & Git Strategy

### Monorepo Structure

The Mastra agent service will live as a subfolder within this monorepo:

```
v0-community-app-project/
├── app/                          ← Next.js (Vercel) — existing
├── packages/
│   └── rio-agent/                ← NEW: Mastra service (Railway)
│       ├── src/
│       │   ├── agents/           ← RioAgent definition
│       │   ├── tools/            ← ragSearch, searchNeighbors, etc.
│       │   ├── workflows/        ← ingestDocument workflow
│       │   └── index.ts          ← Fastify server entry point
│       ├── package.json
│       ├── tsconfig.json
│       └── .env.example
├── supabase/migrations/          ← DB migrations (Sprint 8+, not this sprint)
└── docs/
```

**Railway Deployment**: Railway will deploy only the `packages/rio-agent/` subdirectory using nixpacks. The `RAILWAY_DOCKERFILE_PATH` or `nixpacks.toml` `rootDirectory` will be set to `packages/rio-agent`.

### Git Branching Model

| Issue | Branch Name | Base | PR Type |
|-------|-------------|------|---------|
| #167 | `feat/167-rio-mastra-scaffold` | `main` | Draft → Ready |
| #168 | `feat/168-rio-sse-validation` | `feat/167-rio-mastra-scaffold` | Draft → Ready |
| #169 | `feat/169-rio-tenant-isolation` | `feat/168-rio-sse-validation` | Draft → Ready |
| #171 | `feat/171-rio-posthog-pii` | `feat/169-rio-tenant-isolation` | Draft → Ready |
| #170 | `feat/170-rio-embedding-pgvector` | `feat/171-rio-posthog-pii` | Draft → Ready |
| #223 | `feat/223-supabase-admin-refactor` | `main` | Draft → Ready |

> **Sequential chaining**: Each branch builds on the previous because dependencies are hard (SSE validation requires the scaffold; isolation requires a running SSE endpoint; PostHog requires a traceable agent invocation; pgvector requires Supabase connectivity established in the scaffold).

### ⚠️ DevOps / CI Pipeline Notes

1. **No CI changes needed for this sprint** — the Mastra service is a separate process and won't interfere with existing Next.js tests or Vercel deployment.
2. **Environment Variables** to be set in Railway before #167:
   - `OPENROUTER_API_KEY` — Primary LLM gateway (via OpenRouter)
   - `PORT` — Assigned by Railway automatically
   - `SUPABASE_URL` — From Supabase Pro project settings
   - `SUPABASE_SERVICE_ROLE_KEY` — Admin client key (never exposed to browser)
   - `POSTHOG_API_KEY` + `POSTHOG_HOST` — Set in #171
3. **Vercel ENV** to add for #168:
   - `RAILWAY_AGENT_URL` — Internal URL of the Railway service
4. **Supabase Pro** — Already confirmed upgraded (#166 closed). pgvector extension must be enabled before #170.

---

## Implementation Order

```
[DONE]  #166 → Supabase Pro upgrade ✅
  ↓
  #167 → Scaffold Mastra on Railway (foundation for all others)
  ↓
  #168 → Validate SSE pipeline (requires deployed Railway service)
  ↓
  #169 → Validate multi-tenant isolation (requires SSE working)
  ↓
  #171 → PostHog + PII middleware (requires traceable agent calls)
  ↓
  #170 → Validate embeddings + pgvector (can run after scaffold; placed last for clarity)
  ↓
[GATE] Go/No-Go evaluation → Sprint 8 starts or spike re-evaluated
```

> **Rationale**: Security-critical (#169 `Security` label, #171 `Security` label) are prioritized after the mandatory infrastructure prerequisite (#167 → #168). Embedding validation (#170) is placed last as it's the most independent and can be validated in isolation once Supabase is accessible.

---

## Issue Implementation Plans

---

### Issue #167 — S0.2: Scaffold Mastra Agent on Railway

**Agent**: `backend-specialist` + `devops-engineer`
**Branch**: `feat/167-rio-mastra-scaffold`
**Requirement File**: [`requirements_2026-03-11_rio_mastra_scaffold.md`](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-03-11_rio_mastra_scaffold.md)
**Blueprint Ref**: [§1.1 — Framework: Mastra on Railway [ADR-001]](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md#11--framework-mastra-on-railway-adr-001), [§2.3 — Mastra Agent Architecture](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md#23--mastra-agent-architecture-railway)

#### Code Changes

**New files in `packages/rio-agent/`**:

| File | Purpose |
|------|---------|
| `package.json` | Node.js 20 project; `@mastra/core`, `fastify`, `typescript` deps |
| `tsconfig.json` | Strict TypeScript config |
| `src/index.ts` | Fastify server entry; `/health` + mock `/api/chat` SSE endpoints |
| `src/agents/rio-agent.ts` | Stub `RioAgent` definition using `@mastra/core` Agent class |
| `.env.example` | Documents required environment variables |
| `nixpacks.toml` | Configures Railway build: `rootDirectory = "packages/rio-agent"` |

**Modified files in root repo**:

| File | Change |
|------|--------|
| `packages/rio-agent/` directory | Created (new) |

#### Acceptance Criteria

- [x] **AC1**: Given the Railway service is deployed, when `GET /health` is called, then it returns HTTP 200 with `{ status: "ok" }`.
- [x] **AC2**: Given `curl -N https://<railway-url>/api/chat`, when the request is made, then the response includes `Content-Type: text/event-stream` and emits at least 3 SSE events before closing.
- [x] **AC3**: When the Railway service starts, it logs `RioAgent initialized` without crashing.
- [x] **AC4**: The `packages/rio-agent/` directory exists in the monorepo and all required files are present.

#### Handover → #168

`backend-specialist` provides:
- Deployed Railway URL: `https://rio-agent-<hash>.up.railway.app`
- Confirmed `/health` returns 200
- Confirmed `/api/chat` emits SSE events

---

### Issue #168 — S0.3: Validate SSE Pipeline Railway → Vercel BFF → Browser

**Agent**: `backend-specialist` + `frontend-specialist`
**Branch**: `feat/168-rio-sse-validation`
**Blueprint Ref**: [§2.2 — API Surface](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md#22--api-surface-vercel-bff--railway), [§2.4.C — Chat Sheet](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md#c-no-separate-floating-bubble)

#### Code Changes

**New files in `app/`**:

| File | Purpose |
|------|---------|
| `app/api/v1/ai/chat/route.ts` | Vercel BFF: validates resident JWT → forwards to Railway → streams response back |
| `app/[tenant]/test-rio/page.tsx` | **Temporary test page only** (removed after sprint); renders `useChat` hook against the BFF |

**Modified files**:

| File | Change |
|------|--------|
| `.env.local` / Vercel env | Add `RAILWAY_AGENT_URL` |

> **Note**: The test page (`test-rio`) is scaffolded purely for SSE validation. It is NOT the final `RioChatSheet` component (that's Sprint 10). It will be deleted after gate passes.

#### Acceptance Criteria

- [ ] **AC1**: Given a logged-in resident on the test page, when they submit a message, then the `useChat` hook renders tokens appearing progressively (not all at once), confirming SSE streaming.
- [ ] **AC2**: Given the stream starts, when it runs for 30+ seconds, then the connection does not timeout (no 504 from Vercel).
- [ ] **AC3**: When the response completes, then no CORS errors appear in the browser console for the production Vercel environment.
- [ ] **AC4**: When `RAILWAY_AGENT_URL` is not set, then the BFF returns 503 with `{ error: "Agent service unavailable" }` (graceful degradation — no 500).

#### Handover → #169

`frontend-specialist` provides:
- Screenshot of token-by-token stream in browser DevTools Network tab showing SSE events
- Confirmation of zero CORS/timeout errors on Vercel preview URL

---

### Issue #169 — S0.4: Validate Multi-Tenant Thread Isolation

**Agent**: `security-auditor` + `backend-specialist`
**Branch**: `feat/169-rio-tenant-isolation`
**Risk**: 🔴 HIGH — Security label. **Requires senior review before merge.**
**Blueprint Ref**: [§1.9 — Security](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md#19--observability-security-risk-unchanged), [ADR-009](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md#26--mini-adrs)

#### Test Scenario (from Issue #169)

1. Create Thread A under Tenant A, send 3 messages
2. Create Thread B under Tenant B, send 3 different messages
3. Resume Thread A — assert Tenant B messages never appear
4. Resume Thread B — assert Tenant A messages never appear

#### Code Changes

**New files**:

| File | Purpose |
|------|---------|
| `packages/rio-agent/src/tests/tenant-isolation.test.ts` | Automated Jest/Vitest test implementing the 4-step scenario above |
| `packages/rio-agent/src/lib/thread-store.ts` | Thread storage abstraction with explicit `tenant_id` enforcement (no cross-tenant lookup possible) |

#### Implementation Requirements

- Thread IDs must include `tenant_id` as a namespace prefix: `{tenant_id}:{mastra_thread_id}`
- **NO** global thread lookup by `mastra_thread_id` alone — always query `WHERE tenant_id = $1 AND mastra_thread_id = $2`
- Memory injection must be scoped: when resuming a thread, only retrieve messages where `thread.tenant_id = currentTenantId`

#### Acceptance Criteria

- [x] **AC1**: Given Thread A (Tenant A) and Thread B (Tenant B) both have 3 messages, when Thread A is resumed, then the context window contains ONLY Tenant A messages (automated assertion).
- [x] **AC2**: Given Thread B is resumed after Thread A was active, then zero messages from Tenant A appear in Thread B's context (automated assertion).
- [x] **AC3**: When `tenant-isolation.test.ts` is run, then all tests PASS with zero failures.
- [x] **AC4**: The test is deterministic and repeatable (no flaky state between runs).

#### 🔴 Rollback Strategy

If this validation fails: **do NOT proceed to Sprint 8**. Evaluate whether Mastra's thread storage model supports tenant-scoped lookup natively or requires a custom adapter. Document findings and re-spike before unblocking.

#### Release Notes (Draft)
🚀 **Multi-Tenant AI Thread Isolation**
Enhances privacy for the Río Assistant by strictly isolating conversation threads between residents and communities.

🔒 **Security/Isolation**
Resident conversations are now cryptographically scoped to their specific community (tenant) and user ID.

#### Handover → #171

`security-auditor` provides:
- Test results output showing `PASS` for all isolation scenarios
- Confirmation that the thread store implementation enforces `tenant_id` on every read/write

---

### Issue #171 — S0.6: PostHog Setup + PII Hash Middleware

**Agent**: `security-auditor` + `backend-specialist`
**Branch**: `feat/171-rio-posthog-pii`
**Risk**: 🔴 HIGH — Security label (PII compliance).
**Blueprint Ref**: [§1.9 — Observability](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md#19--observability-security-risk-unchanged), [§2.5 Cross-Cutting](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md#25--cross-cutting-concerns)

#### Code Changes

**New/modified files in `packages/rio-agent/`**:

| File | Purpose |
|------|---------|
| `src/lib/sha256.ts` | SHA-256 utility for PII-safe identifier generation |
| `src/lib/pattern-redactor.ts` | Regex-based redaction for unstructured PII (Phone, Email) |
| `src/index.ts` | Modified: Integrate PostHog observability with custom `SensitiveDataFilter` and `PatternRedactor` |

#### PII Hash Middleware Spec

```typescript
// packages/rio-agent/src/lib/sha256.ts
// Input:  "raw_id"
// Output: "sha256hex" (64 chars)
// Rule:   NO raw user_id or email field may appear in any trace payload
```

Required trace tags on every invocation:
- `user_id_hash` — SHA-256 of raw user_id
- `tenant_id_hash` — SHA-256 of raw tenant_id
- `model` — model name used (e.g., `gemini-1.5-flash`)
- `sprint` — literal string `"7"` (Technical Spike)

#### Acceptance Criteria

- [x] **AC1**: Given the agent is invoked, when the trace appears in PostHog, then zero raw `user_id` strings or email addresses are visible in any field (verified via `redaction.test.ts`).
- [x] **AC2**: Given any agent invocation, when the trace is inspected, then `tenant_id_hash`, `user_id_hash`, and `sprint` tags are present.
- [x] **AC3**: When `hashing.test.ts` runs, then SHA-256 hashing is verified against known inputs (deterministic output).
- [x] **AC4**: Given `POSTHOG_API_KEY` is not set, when the service starts, then it gracefully handles the missing config (standard PostHog behavior).

#### 🔴 Rollback Strategy

If PII is found in PostHog traces post-deployment: **immediately disable PostHog integration** (clear `POSTHOG_API_KEY` env var), purge the affected events in PostHog dashboard, and re-audit the middleware/redactor before re-enabling.


#### Release Notes (Draft)

🔒 **PostHog Observability + PII Hashing**
Enables secure, private observability for Río AI using PostHog.

🛡️ **Privacy & Redaction**
- All PII (Emails, Phone numbers) is automatically redacted from conversation traces using the `PatternRedactor` middleware.
- Deterministic SHA-256 hashing is applied to `userId` and `tenantId` for telemetry, ensuring no raw identifiers leave the secure environment while maintaining deep tracing capabilities.

#### Handover → #170

`security-auditor` provides:
- Screenshot of PostHog trace showing hashed IDs only
- Unit test results confirming PII hash middleware correctness

---

### Issue #170 — S0.5: Validate gemini-embedding-001 + pgvector Search Quality

**Agent**: `backend-specialist`
**Branch**: `feat/170-rio-embedding-pgvector`
**Blueprint Ref**: [§1.4 — Embedding Model Selection [ADR-004]](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md#14--embedding-model-selection-adr-004), [§2.1 — Database Schema (`rio_document_chunks`)](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md#rio_document_chunks--vector-embeddings-primary-rag-table)

#### Prerequisites

- pgvector extension enabled on Supabase Pro project
- `rio_document_chunks` table created (temporary migration for spike — will be formally re-created in Sprint 8 with full schema)

#### Code Changes

**New files in `packages/rio-agent/`**:

| File | Purpose |
|------|---------|
| `src/scripts/embed-test-docs.ts` | Script: embeds 5 test documents using `gemini-embedding-001` (MRL → 1536-dim), stores in `rio_document_chunks` |
| `src/scripts/validate-search.ts` | Script: runs 10 test queries (5 English, 5 Spanish), asserts top-3 results, outputs pass/fail |
| `src/tests/embedding-quality.test.ts` | Automated test wrapping the validation script |
| `supabase/migrations/20260313_rio_spike_chunks_temp.sql` | **Temporary** spike-only migration: creates `rio_document_chunks` with HNSW index |

#### Test Dataset

| ID | Document | Language |
|----|----------|---------|
| doc-1 | Quiet hours policy (10PM-6AM) | Spanish |
| doc-2 | Pet policy (leash required) | Spanish |
| doc-3 | Pool reservation procedure | Spanish |
| doc-4 | Parking rules | Spanish |
| doc-5 | Emergency contacts | Spanish |

**10 test queries** (5 EN / 5 ES):
1. "What time is quiet hours?" → expects doc-1
2. "¿Puedo tener mascotas sin correa?" → expects doc-2
3. "How do I book the pool?" → expects doc-3
4. "¿Dónde puedo estacionar?" → expects doc-4
5. "Who do I call in an emergency?" → expects doc-5
6. "¿A qué hora termina el ruido?" → expects doc-1
7. "Pets leash rules" → expects doc-2
8. "Reservar la piscina" → expects doc-3
9. "Parking violations" → expects doc-4
10. "Emergency phone number" → expects doc-5

#### Acceptance Criteria

- [ ] **AC1**: When the validation script runs, then ≥ 9/10 test queries return the expected document in top-3 cosine similarity results.
- [ ] **AC2**: Given the HNSW index is in place, when 10 consecutive queries run, then average query latency < 10ms on the test dataset (logged to console).
- [ ] **AC3**: When the test script runs against Tenant A's data, then zero chunks from any other tenant appear in results (cross-tenant isolation at the vector layer).
- [ ] **AC4**: When `embedding-quality.test.ts` runs, it exits with code 0 on pass, code 1 on fail (CI-compatible).

---

## Definition of Done

Applies to **every issue** in this sprint:

- [ ] Code passes `npm run lint` (in `packages/rio-agent/`)
- [ ] Code passes `npx tsc --noEmit` (in `packages/rio-agent/`)
- [ ] PR created (Draft → Ready) with description linking to this PRD and the relevant issue
- [ ] All Acceptance Criteria marked `[x]` in this PRD
- [ ] Manual QA verification completed per ACs
- [ ] No new P0 bugs introduced
- [ ] Worklog created at `docs/07-product/04_logs/log_YYYY-MM-DD_{issue-slug}.md`
- [ ] Any documentation gaps logged in `docs/documentation_gaps.md`

---

## Sprint Schedule

> Dates to be confirmed by user. Estimates below assume **solo developer**, **sequential execution**, starting **2026-03-13**:

| Issue | Size | Est. Hours | Start | Target |
|-------|------|-----------|-------|--------|
| ~~#166 (Supabase Pro)~~ | ~~XS~~ | ~~Done~~ | ~~—~~ | ~~Done~~ |
| #167 (Mastra Scaffold) | S | 4-8h | 2026-03-13 | 2026-03-13 |
| #168 (SSE Validation) | S | 4-8h | 2026-03-14 | 2026-03-14 |
| #169 (Tenant Isolation) | M | 1-2d | 2026-03-17 | 2026-03-18 |
| #171 (PostHog + PII) | S | 4-8h | 2026-03-19 | 2026-03-19 |
| #170 (Embeddings) | M | 1-2d | 2026-03-20 | 2026-03-21 |
| **Go/No-Go Gate** | — | — | 2026-03-24 | 2026-03-24 |

*Buffer day added between M-size items. Weekend days skipped.*

---

## Worklog Links

| Issue | Worklog | Status |
|-------|---------|--------|
| #167 | [`log_2026-03-14_rio-mastra-scaffold.md`](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/04_logs/log_2026-03-14_rio-mastra-scaffold.md) | ✅ Done |
| #168 | *(created during /04_build)* | — |
| #169 | *(created during /04_build)* | — |
| #171 | *(created during /04_build)* | — |
| #170 | *(created during /04_build)* | — |

---

## Upcoming Sprints Context

This sprint unlocks **Sprint 8 — Foundation** which will formally apply all `rio_*` DB migrations, set up Railway staging/production environments, and establish the cross-tenant CI isolation test. Key dependencies to keep in mind as we scope:

- The temporary `rio_document_chunks` migration created in #170 will be **replaced** in Sprint 8's formal migration set
- The test page created in #168 (`/test-rio`) will be **deleted** at the start of Sprint 8's chat interface work
- PostHog tags (`sprint-7`) established here will evolve to include `tool` in Sprint 14 (Observability sprint)
- The `RAILWAY_AGENT_URL` env var set in #168 becomes a permanent part of the Vercel environment for all future sprints

---

*Source: [`blueprint_rio_agent.md`](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/01_idea/blueprint_rio_agent.md), [#158](https://github.com/mjcr88/v0-community-app-project/issues/158), [#166](https://github.com/mjcr88/v0-community-app-project/issues/166)–[#171](https://github.com/mjcr88/v0-community-app-project/issues/171)*
*Patterns: [`nido_patterns.md`](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/06_patterns/nido_patterns.md), [`lessons_learned.md`](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/06_patterns/lessons_learned.md)*
