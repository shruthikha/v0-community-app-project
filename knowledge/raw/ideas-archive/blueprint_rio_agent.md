source: idea
imported_date: 2026-04-08
---
# Architectural Blueprint: Río AI Community Assistant

**Status**: Phase 9 Completed (Ingestion Pipeline) | Phase 10 In Progress
**Ready for Brainstorming**: Yes
**Last Updated**: 2026-03-20 (Sprint 9 QA Sign-off)
**Lead Reviewer**: Antigravity (Senior Architect)

---

## 📋 Executive Summary

**Río** is an AI Community Assistant for the Nido multi-tenant SaaS platform. It answers resident questions using community-specific knowledge (RAG), personalizes over time (memory), and will eventually execute in-app tasks (write tools + HITL).

**Business case**: At $3/lot/month for 300 residents → $900/month revenue vs. ~$51/month infrastructure = **94%+ gross margin**.

**Key scope decisions**:
- Telegram integration is **explicitly deferred** — scoped after the Memory sprint, as a separate Phase 2 Epic
- Content is **single-language** (e.g. all Spanish); Río responds bilingually based on query language

---

## 🔍 Phase 1: Research & Feasibility (Approved)

### 1.1 — Framework: Mastra on Railway [ADR-001]

**Decision**: Mastra agent on Railway (standalone Node.js). Vercel is BFF auth proxy only — no agent logic there (serverless timeout risk).

**Day-0 Spike required**: Streaming Mastra → Railway → Vercel → Browser before Sprint 1 starts. Mastra v1 is 4 months old.

---

### 1.2 — Infrastructure [ADR-002]

Start on Railway ($5–15/month). Migrate to Fly.io (São Paulo, ~55ms) only if TTFT > 1.5s in beta.

---

### 1.3 — LLM Model Strategy [ADR-003]

**DeepSeek excluded** — Chinese data sovereignty law + documented breach. Non-negotiable.

| Role | Model | Cost/MTok |
|------|-------|----------|
| Fast Chat | Gemini 2.0 Flash | $0.10/$0.40 |
| Complex RAG / Tool Use | Claude Sonnet 3.7 | $3/$15 |

Routing: rule-based switch — tool intent detected → Claude, otherwise → Gemini Flash.

---

### 1.4 — Embedding Model Selection [ADR-004]

> **Context**: Community content will be in a single language (e.g. Spanish). Residents query in either English or Spanish. The agent must retrieve from single-language docs and respond in the user's language. This means we need **cross-lingual retrieval** capability — the embedding model must map Spanish docs and English queries into the same semantic space.

**Candidates evaluated**:

| Model | MTEB Multi. | Cross-Lingual | Cost/MTok | Dims (MRL) | Context |
|-------|------------|--------------|-----------|------------|---------|
| **`gemini-embedding-001`** | 🥇 #1 | ✅ 100+ langs | ~$0.001 | 3072→768 | 2,048 tok |
| **Gemini Embedding 2** (Mar 2026) | 🥇 (multimodal) | ✅ 100+ langs | ❓ unpublished | 3072→768 | 8,192 tok |
| **`text-embedding-3-small`** (OpenAI) | Strong MIRACL | ✅ (44% vs 31% prior gen) | $0.02 | 1536→256 | 8,191 tok |
| **`text-embedding-004`** (Google legacy) | Superseded by 001 | ✅ | ~$0.001 | 768 (fixed) | 2,048 tok |
| **Jina v2-es** | Spanish-tuned | ❌ ES/EN only | Free tier | 768 (fixed) | 8,192 tok |

**Key findings**:
- `gemini-embedding-001` is #1 on MTEB Multilingual — the definitive benchmark for cross-lingual RAG
- Gemini Embedding 2 (March 2026) is more capable but pricing is TBD and it's too new for production
- `text-embedding-3-small` outperforms the legacy `text-embedding-004` (ELO 1503 vs 1447) but was not benchmarked against `gemini-embedding-001`
- Jina v2-es is narrower (ES/EN only), lower dimensional, less maintained — disqualified
- **Cost is negligible** at this scale regardless of choice (~$0.50–2.00/month). This is a quality decision, not a cost decision.

**Decision [ADR-004]**: **`text-embedding-3-small`** (OpenAI) as primary to align with the 1536-dim `pgvector` schema. `gemini-embedding-001` as validated fallback (requires re-indexing if swapped).

**Single-language content simplification**: Because all documents are in one language, retrieval similarity thresholds are more predictable. The cross-lingual requirement comes from resident queries (English or Spanish) matching against single-language source docs — `gemini-embedding-001` excels at exactly this case per MTEB Zero-Shot Multi-query benchmarks.

---

### 1.5 — Supabase Tier: Pro Required [ADR-005]

> [!IMPORTANT]
> **Free tier is not sufficient for production**. pgvector extension itself is available on the free tier, but the **500MB database cap** will be exceeded with embeddings:
>
> - 100 documents × 50 chunks × 1536-dim float32 = **~30MB** (just vector data)
> - With all other Nido tables already on the free tier, the **margin is extremely thin**
> - At 500+ documents (realistic for an established community), the 500MB limit is breached
>
> **Decision**: Upgrade to **Supabase Pro ($25/month)** before Sprint 1. This provides:
> - 8GB database (headroom for years of growth)
> - No pause on inactivity
> - Point-in-time recovery
> - Performance advisor (important for tuning HNSW index)
>
> Pro cost is already baked into the $51/month infrastructure estimate. **Do not start embedding ingestion on the free tier.**

---

### 1.6 — Chunking Strategy: Semantic Chunking Recommended [ADR-006]

> **Initial recommendation** (junior blueprint): Recursive character split at 400–512 tokens.
> **Revised recommendation** (senior review): Hybrid semantic chunking.

**Why it matters for Río specifically**:
- Community content is structured: bylaws have articles, HOA rules have numbered sections, event schedules have rows. Splitting mid-article produces orphan chunks that retrieve poorly.
- NAACL 2025 finding cited ("recursive split matches semantic chunking up to 5K tokens") applies to general text. Structured governance documents are a different retrieval pattern.
- A resident asking "what is the quiet hours policy?" should retrieve the **entire quiet hours rule**, not half of it.

**Recommended approach (not naive, not over-engineered)**:

| Step | Method | When |
|------|--------|------|
| 1 | LlamaParse → structured blocks (preserves headers, bullets, tables) | Always |
| 2 | Section-level split first: respect `h1`/`h2`/numbered headers | For bylaws, policies |
| 3 | Recursive character split *within* sections (400–512 tok, 50-tok overlap) | For long narratives |
| 4 | Table rows kept as atomic chunks (never split a table row) | For schedules, fees |

This is not full semantic embedding-based chunking (expensive, slow) — it's **structure-aware splitting** using LlamaParse's output. Mastra's document processing pipeline supports this with minimal extra code.

**Sprint assignment**: Implement structure-aware chunking in Sprint 2 (Ingestion Pipeline). The extra complexity is ~1 day of engineering, worth it for retrieval quality at scale.

---

### 1.7 — Memory Architecture [ADR-007]

| Layer | Storage | Sprint |
|-------|---------|--------|
| Working Memory (active session) | Redis on Railway | Sprint 3 |
| Episodic Memory (past sessions) | `rio_messages` Supabase + vector | Sprint 5 |
| Structural Memory (permanent facts) | `user_memories` JSONB + vector | Sprint 5 |

GDPR: Residents must be able to view and delete their structural memories. Scoped into Sprint 5.

---

### 1.8 — Telegram: Deferred [ADR-008]

Telegram deferred to **Sprint 8+**, after Memory sprint completes. Scoped as a separate Phase 2 Epic.

---

### 1.9 — Observability, Security, Risk (Unchanged)

**Langfuse Cloud** (free tier). PII obfuscation mandatory. 100% errors + 10% routine sampling.

**RLS (Row Level Security)**: All `mastra_*` tables are strictly secured. Access is isolated by `tenant_id` and `user_id`. The Rio Agent captures identity (`tenantId`, `userId`, `threadId`) from BFF headers and syncs them to Mastra metadata. A database trigger (`sync_mastra_metadata_to_columns`) extracts this into indexed columns. For messages where metadata isn't explicitly passed by the framework, an inheritance trigger ensures they adopt the parent thread's `tenant_id` and `user_id`.

**Top risks**: Mastra v1 maturity (Day-0 spike), RAG retrieval quality on real docs (Sprint 1 acceptance gate), cross-tenant Redis isolation (unit tested before Sprint 3).

---

## 🏗️ Phase 2: Architectural & UI Mapping (In Review)

### 2.1 — Database Schema

> All tables use explicit `tenant_id`. Agent uses `service_role` + manual tenant enforcement (no RLS on agent queries — see §1.9).

#### `rio_configurations` — Tenant AI config + prompt content
```sql
CREATE TABLE rio_configurations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- Prompt Tier 2: tenant admin configures persona, policies, contacts
  prompt_community_name   TEXT,
  prompt_persona          TEXT,        -- Fixed: maps to 'persona' in UI
  tone                    TEXT DEFAULT 'friendly',
  community_policies      TEXT,        -- max 2,000 chars, sanitized server-side
  sign_off_message        TEXT,
  metadata                JSONB,       -- contains emergency_contacts: [{ label, phone }]
  -- Model preference (BYOK: Phase 3+)
  preferred_model         TEXT DEFAULT 'gemini-flash',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id)
);
```
> Tier 1 (immutable base prompt) lives in Railway env var — never stored in DB. Feature on/off toggles live in `tenants.features` JSONB (existing `useTenantFeatures` hook).

#### `rio_documents` — Knowledge base file metadata
```sql
CREATE TABLE rio_documents (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  file_type       TEXT NOT NULL,           -- 'pdf' | 'docx' | 'csv' | 'txt'
  storage_path    TEXT NOT NULL,           -- Private Supabase Storage path
  status          TEXT DEFAULT 'pending',  -- 'pending' | 'processing' | 'processed' | 'error'
  embedding_model TEXT,                    -- PR 236 Fix: track model for future-proofing
  chunk_count     INT DEFAULT 0,
  error_message   TEXT,
  source_document_id UUID,                -- Link to public.documents
  uploaded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

#### `rio_document_chunks` — Vector embeddings (primary RAG table)
```sql
CREATE TABLE rio_document_chunks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID NOT NULL,           -- Denormalized: pre-filters ANN search
  document_id     UUID NOT NULL REFERENCES rio_documents(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  embedding       vector(1536),            -- openai/text-embedding-3-small via OpenRouter
  token_count     INT,
  chunk_index     INT,
  section_title   TEXT,                    -- Captured from LlamaParse header hierarchy
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX rio_chunks_embedding_idx
  ON rio_document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX rio_chunks_tenant_idx ON rio_document_chunks (tenant_id);
```
> [!NOTE]
> `tenant_id` is denormalized here on purpose. The WHERE clause filters by tenant before ANN distance computation, dramatically reducing candidate set and preventing cross-tenant leakage without relying on RLS.

#### `rio_threads` + `rio_messages` — Conversation history
```sql
CREATE TABLE rio_threads (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mastra_thread_id TEXT UNIQUE,
  created_at       TIMESTAMPTZ DEFAULT now(),
  last_active_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rio_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id   UUID NOT NULL REFERENCES rio_threads(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL,   -- Denormalized
  user_id     UUID NOT NULL,   -- Denormalized for GDPR delete
  role        TEXT NOT NULL,   -- 'user' | 'assistant' | 'tool'
  content     TEXT NOT NULL,
  tool_calls  JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

#### `user_memories` — Structural long-term memory (Sprint 5)
```sql
CREATE TABLE user_memories (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fact          TEXT NOT NULL,
  confidence    FLOAT DEFAULT 0.9,
  embedding     vector(1536),
  source_thread UUID REFERENCES rio_threads(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  superseded_at TIMESTAMPTZ    -- Soft-delete for GDPR audit trail
);
```

**Feature flag convention**: Add `rio: { enabled: boolean, rag: boolean, memory: boolean, actions: boolean }` to `tenants.features` JSONB (picked up automatically by `useTenantFeatures` hook, no schema migration needed).

---

### 2.2 — API Surface (Vercel BFF → Railway)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/ai/chat` | Resident JWT | SSE streaming chat |
| POST | `/api/v1/ai/ingest` | Tenant Admin JWT | Trigger ingestion workflow |
| GET | `/api/v1/ai/documents` | Tenant Admin JWT | List knowledge base |
| DELETE | `/api/v1/ai/documents/:id` | Tenant Admin JWT | Remove doc + chunks |
| GET | `/api/v1/ai/memories` | Resident JWT | View own memories |
| DELETE | `/api/v1/ai/memories/:id` | Resident JWT | GDPR: delete fact |
| GET | `/api/v1/ai/config` | Tenant Admin JWT | Get tenant AI config |
| PATCH | `/api/v1/ai/config` | Tenant Admin JWT | Update prompt tier 2 + toggles |

---

### 2.3 — Mastra Agent Architecture (Railway)

```
RioAgent
├── Tools
│   ├── ragSearch(query, tenantId)       → pgvector + openai/text-embedding-3-small
│   ├── searchNeighbors(skill, tenantId) → existing residents/skills data
│   ├── getCommunityEvents(tenantId)     → existing events data layer
│   └── [Phase 3] bookFacility / rsvp   → Nido Server Actions (HITL)
├── Prompt Compositor
│   ├── Tier 1: immutable safety rails  (Railway env var)
│   ├── Tier 2: tenant persona/policies (rio_configurations)
│   └── Tier 3: RAG hits + memory + conversation
└── Model Router
    ├── tool_intent detected → Claude Sonnet 3.7
    └── default             → Gemini 2.0 Flash
```

**Ingestion Workflow** (Mastra Workflow primitive):
```
ingestDocument:
1. Fetch from Supabase Storage (signed URL)
2. LlamaParse → structured text blocks (preserves headers/tables)
3. Structure-aware chunking: section split → recursive split within sections
4. Batch embed: openai/text-embedding-3-small → 1536-dim
5. Upsert: delete old chunks for doc_id, insert new (atomic swap)
6. Update rio_documents: status = 'ready', chunk_count = N
```

---

### 2.4 — Frontend / UI

#### A. Chat via the Existing `+` Create Button

The `+` button in `MobileDock` opens `CreatePopover`. The same popover is used on desktop (`desktop-nav`). Add "Chat with Río" as a new action in the `actions` array in **`create-popover.tsx`**:

```tsx
// Add to CreatePopover.actions array (top of list — primary action):
{
  icon: MessageCircle,     // from lucide-react
  title: "Chat with Río",
  description: "Ask anything",
  onClick: () => {
    onOpenChange(false)
    openRioChat()          // opens the chat sheet/modal
  },
  color: "text-forest-canopy",
  bgColor: "bg-sage-soft",
  borderColor: "border-sage-100",
}
```

No new navigation item, no floating bubble overlaid on top of the existing dock — **"Chat with Río" slots naturally into the existing Create menu**. This is the access point on both mobile and desktop.

#### B. Dashboard Rio Section Redesign (`RioWelcomeCard`)

Current: Orange welcome card with "Start Tour" + "Complete Profile" buttons.
New: Keep Rio's visual presence + add a **quick-start chat CTA** while retaining the tour button for new residents.

```
┌────────────────────────────────────────────────────────────┐
│  [Rio parrot illustration — left]                           │
│                          ┌──────────────────────────────┐  │
│                          │  Hi! I'm Río, your community  │  │
│                          │  guide. Ask me anything.      │  │
│                          └──────────────────────────────┘  │
│                                                             │
│                     [Message input (compact)]               │
│                     [  Ask Río something...  ] [→]          │
│                                                             │
│               [Start tour]  [Complete profile]              │
└────────────────────────────────────────────────────────────┘
```

**Implementation in `RioWelcomeCard.tsx`**:
- Replace the two-button layout with a compact chat input + send button at the bottom of the right column
- Submitting the input opens the full chat sheet pre-populated with the query (does NOT navigate away from dashboard)
- "Start tour" and "Complete profile" buttons move below the input (smaller, secondary styling) — retained for new residents
- No new full-page route needed; chat is a sheet/drawer component

#### C. No Separate Floating Bubble

~~Previous recommendation: floating `fixed bottom-[88px] right-4` bubble~~ — **removed**. All chat entry points go through:
1. The `+` Create menu (primary, available everywhere)
2. The Rio card on the dashboard (secondary, inline in home screen)

The full chat experience is a **bottom sheet / full-screen drawer** (mobile), or a **side panel** (desktop ≥ md breakpoint). No new nav icon.

#### D. Backoffice Admin Pages (`app/[tenant]/backoffice/rio/`)

| Route | Page | Content |
|-------|------|---------|
| `/backoffice/rio/knowledge` | Knowledge Base | Upload, list, delete docs; ingestion status |
| `/backoffice/rio/settings` | Agent Settings | Prompt Tier 2 structured form + feature toggles |

> **Analytics route removed** — token usage and conversation volume are Super Admin concerns, not Tenant Admin. No analytics page scoped for tenant admins at launch. Volume reporting can be added as a Super Admin backoffice feature in a later sprint.

#### E. Prompt Tier 2 Admin UI (Structured Fields)

```
Agent Persona
  Community Name: [________________]
  Tone:          [Friendly     ▾]   Language: [Spanish ▾]
  Sign-off:      [________________]

Community Policies (free-form, 2,000 char max)
  ┌─────────────────────────────────────────────────────┐
  │ Quiet hours: 10 PM–6 AM. Pets on leash. ...        │
  └─────────────────────────────────────────────────────┘

Emergency Contacts
  + Add contact   [Security: +506 8888-0000 ×]

[Test in Sandbox]                        [Save & Publish]
```

Policies field is sanitized server-side (prompt injection filter) before storage. Tier 1 prompt is not visible or editable in this UI.

---

### 2.5 — Cross-Cutting Concerns

| Concern | Decision |
|---------|---------|
| **Performance** | HNSW pre-filters by `tenant_id` before ANN → <5ms search; chat widget lazy-loaded (`dynamic()`, `ssr: false`) |
| **Security** | Prompt injection filter on Tier 2 writes; private Storage bucket; LLM keys in Railway env only |
| **Observability** | Langfuse: hash `user_id` before tracing; 100% errors + 10% sample routine; tag `{ tenant_id_hash, model, sprint }` |
| **GDPR** | Memory deletion UI in Sprint 5; `superseded_at` soft-delete for audit trail |
| **Mobile** | Chat sheet uses `pb-safe` + respect existing dock; widget does not add a second `z-50` fixed layer |

---

### 2.6 — Mini-ADRs

| ADR | Decision | Rationale |
|-----|---------|-----------|
| ADR-009 | No RLS on agent queries; explicit `WHERE tenant_id` | Avoids known RLS recursion in this codebase; clearer audit trail |
| ADR-010 | Denormalize `tenant_id` on chunk/message tables | Pre-filters ANN candidate set; consistent with Nido convention |
| ADR-011 | `text-embedding-3-small` at 1536-dim | Balanced performance/cost; native 1536d alignment with schema |
| ADR-012 | Feature toggles in `tenants.features`; content in `rio_configurations` | Separate concerns; zero schema migration for on/off toggles |
| ADR-013 | Chat via `+` Create menu + Dashboard card; no floating bubble | Re-uses existing UX pattern; avoids z-index conflicts with dock |
| ADR-014 | Supabase Pro required before ingestion start | 500MB free tier insufficient for vector data at production scale |
| ADR-015 | Structure-aware chunking (LlamaParse headers → then recursive split) | Prevents mid-section orphan chunks; ~1 day engineering; high retrieval quality payoff |

---

## 🗺️ Phase 3: Implementation Roadmap

> **Methodology**: Each sprint is 2 weeks. Sprints are sequential with explicit go/no-go gates. No sprint begins until the prior gate passes.

---

### Sprint 7 — Technical Spike (2 weeks)

**Goal**: Validate core infrastructure assumptions before any product features are built.

| # | Task | Notes |
|---|------|-------|
| 0.1 | Upgrade Supabase to Pro | Required before any vector storage |
| 0.2 | Scaffold Mastra agent on Railway | Streaming Node.js; confirm env var management |
| 0.3 | [x] Validate SSE: Railway → Vercel BFF → Browser | Test with mock agent + `useChat` hook |
| 0.4 | [x] Validate multi-tenant thread isolation | Verified RLS with `tenant_id` inheritance |
| 0.5 | [x] Validate `gemini-embedding-001` + pgvector | Verified via standalone persistence test |
| 0.6 | [x] Langfuse Cloud + PII hash middleware | Configured in `index.ts` |

**⛔ Go/No-Go Gate**:
- Mastra SSE streaming works end-to-end in browser
- Cross-tenant thread isolation confirmed (no shared context between tenants)
- `gemini-embedding-001` returns correct cosine similarity rankings
- Langfuse: zero PII verified in trace payloads

> If gate fails: do NOT proceed to Sprint 1. Re-evaluate the framework before re-spiking.

---

### Sprint 8 — Foundation (2 weeks)

**Goal**: All DB infrastructure in place. Nothing visible to residents yet.

| # | Task | Notes |
|---|------|-------|
| 1.1 | Write + apply all DB migrations | All `rio_*` tables + `user_memories` |
| 1.2 | HNSW index on `rio_document_chunks.embedding` | `m=16, ef_construction=64`; verify <10ms |
| 1.3 | Private Storage bucket `rio-documents` | Only `tenant_admin` role can upload |
| 1.4 | Add `rio` feature flags to `tenants.features` | `{ enabled: false, rag: false, memory: false, actions: false }` — fail-closed |
| 1.5 | Seed `rio_configurations` for pilot tenant | Default values; admin customizes in Sprint 4 |
| 1.6 | Cross-tenant chunk isolation integration test | Automated + in CI |
| 1.7 | Railway staging + production environments | Separate services; staging on dev Supabase |

**⛔ Go/No-Go Gate**:
- All migrations applied cleanly on staging
- HNSW index verified
- Cross-tenant isolation test passes in CI
- `rio.enabled = false` enforced in middleware (no UI leak)

---

### Sprint 9 — Ingestion Pipeline (2 weeks)

**Goal**: Tenant documents can be uploaded, chunked, embedded, and retrieved. RAG quality validated on real data.

| # | Task | Notes |
|---|------|-------|
| 2.1 | Mastra ingestion workflow: fetch from Storage | Signed URL download from `rio-documents` bucket |
| 2.2 | LlamaParse: structured text extraction | Headers + table rows preserved in output |
| 2.3 | Structure-aware chunker | `h1/h2` boundary split first → recursive within sections (400–512 tok, 50-tok overlap); tables kept atomic |
| 2.4 | Batch embed: `gemini-embedding-001` → 1536-dim | Google AI SDK; batch ≤ 100 chunks/request |
| 2.5 | Atomic upsert to `rio_document_chunks` | Delete old chunks for `document_id`, insert new in tx |
| 2.6 | `rio_documents.status` lifecycle | `pending → processing → ready / error` with `chunk_count` |
| 2.7 | `POST /api/v1/ai/ingest` BFF endpoint | Tenant Admin JWT validation required |

**Sprint 2 Acceptance Test** (must pass before Sprint 3 starts):
- Ingest **20 real pilot tenant documents**
- Run **50 representative queries** (English + Spanish mix, routine + edge cases)
- **≥ 80%** retrieve the relevant chunk as a top-3 result
- **0** cross-tenant chunk leaks in 50 targeted cross-tenant queries

**⛔ Go/No-Go Gate**: All 4 acceptance criteria above must pass.

> This is the **highest-risk gate in the project**. If retrieval < 80%, pause Sprint 3. Investigate: chunking boundaries, embedding model, similarity threshold, or document quality before continuing.

---

### Sprint 10 — Chat Interface (2 weeks)

**Goal**: Residents can chat with Río. MVP = RAG only. No memory, no tool calls.

| # | Task | Notes |
|---|------|-------|
| 3.1 | `RioAgent` on Railway: RAG tool + prompt compositor | Tier 1 (env) + Tier 2 (db config) + Tier 3 (RAG hits + context) |
| 3.2 | Model router | Rule-based: tool intent detected → Claude 3.7; default → Gemini Flash |
| 3.3 | Vercel BFF: `POST /api/v1/ai/chat` | JWT validate → extract `user_id` + `tenant_id` → forward + stream |
| 3.4 | Persist `rio_threads` + `rio_messages` | All turns stored for episodic memory (Sprint 5) |
| 3.5 | Redesign `RioWelcomeCard.tsx` | Compact message input; submit opens `RioChatSheet` pre-populated; tour + profile buttons below |
| 3.6 | Add "Chat with Río" to `CreatePopover.tsx` | First item in actions list; `MessageCircle` icon; forest-canopy color |
| 3.7 | Build `RioChatSheet` component | Bottom sheet (mobile) / side panel (desktop ≥ md); `useChat` + lazy-loaded via `dynamic()` |
| 3.8 | Source citation UI | Document name + chunk excerpt below each assistant response |
| 3.9 | Feature flag gate | Silent fallback when `rio.enabled = false` or `rio.rag = false` |
| 3.10 | Prompt injection filter on Tier 2 writes | Server-side sanitization before `PATCH /api/v1/ai/config` persists |

**⛔ Go/No-Go Gate**:
- End-to-end chat: query → streamed response → citations rendered
- Chat does not appear when `rio.enabled = false` (flag test)
- Zero cross-tenant data in responses (manual QA with two tenant accounts)
- TTFT p50 < 1.5s on 10 consecutive queries (measured via Langfuse)
- Zero PII in Langfuse trace payloads

---

### Sprint 11 — Admin Experience (2 weeks)

**Goal**: Tenant admins can manage knowledge base and customize Río without developer involvement.

| # | Task | Notes |
|---|------|-------|
| 4.1 | Knowledge Base page: `/backoffice/rio/knowledge` | Doc list with status badges, upload, delete |
| 4.2 | Document upload flow | File picker → Storage → trigger ingestion → status polling |
| 4.3 | Real-time ingestion status | Poll `rio_documents.status` every 5s; spinner → ready badge |
| 4.4 | Document delete | Chunks → Storage → metadata; atomic (DELETE `/api/v1/ai/documents/:id`) |
| 4.5 | Agent Settings: `/backoffice/rio/settings` | Prompt Tier 2 structured form (§2.4.E of Phase 2) |
| 4.6 | Feature toggle UI | `rag_enabled` + `memory_enabled` toggles; actions toggle in Sprint 6 |
| 4.7 | "Test in Sandbox" | Current prompt config tested in isolated thread; response shown in modal |
| 4.8 | Pilot onboarding | Admin uploads real documents alongside engineering team |

**⛔ Go/No-Go Gate**:
- Admin uploads a PDF unaided and sees `pending → ready`
- Deleted document no longer appears in chat responses (manual QA)
- Prompt Tier 2 change reflects in sandbox within 1 request
- Injection filter blocks `"ignore previous instructions"` in sandbox test

---

### Sprint 12 — Memory & Privacy (2 weeks)

**Goal**: Río remembers context across sessions. Residents control their data.

| # | Task | Notes |
|---|------|-------|
| 5.1 | Redis on Railway: working memory | Mastra native; 10–20 turn window; `EXPIRE` at 2h idle |
| 5.2 | Cross-tenant Redis key isolation test | Key namespace `rio:{tenant_id}:{thread_id}:*`; automated |
| 5.3 | Post-session summary job | LLM summarizes session → embed → store in `rio_messages` |
| 5.4 | Episodic recall | New query: cosine search on past summaries → inject top-3 into Tier 3 prompt |
| 5.5 | Structural memory extraction | Background: LLM extracts facts → `user_memories` with confidence score |
| 5.6 | Structural memory recall | Fetch `user_memories WHERE user_id` on query start → inject into Tier 3 |
| 5.7 | Privacy Settings: `/dashboard/settings/privacy` | List `user_memories`; delete individual facts |
| 5.8 | GDPR bulk delete | `DELETE /api/v1/ai/memories` → sets `superseded_at` (audit trail preserved) |
| 5.9 | Memory consent disclosure | One-time modal on first chat when `memory_enabled = true` |

**⛔ Go/No-Go Gate**:
- Río recalls a fact from a prior session ("You mentioned you have a dog")
- Deleted memory does NOT reappear in subsequent responses
- Cross-tenant Redis isolation: automated test passes
- GDPR bulk delete removes all user memories (manual QA)
- Consent modal fires exactly once per resident per tenant (localStorage flag)

---

### Sprint 13 — In-App Actions (2 weeks)

**Goal**: Río performs write operations on behalf of residents with explicit HITL confirmation.

| # | Task | Notes |
|---|------|-------|
| 6.1 | Tool: `rsvpEvent(eventId, userId, tenantId)` | Wraps existing RSVP Server Action |
| 6.2 | Tool: `createExchangeListing(...)` | Wraps existing listing Server Action |
| 6.3 | Tool: `submitRequest(...)` | Wraps existing resident request Server Action |
| 6.4 | HITL confirmation card UI | Generative UI card: "Río wants to RSVP you to [Event]. Confirm?" — Yes / No |
| 6.5 | Action permission config | `actions_enabled` toggle + per-action JSON allowlist (admin-controlled) |
| 6.6 | Opaque action IDs in logs | Internal IDs only; no user-facing names in traces |
| 6.7 | Rate limit: write tools | Max 10 tool calls/user/hour |

**⛔ Go/No-Go Gate**:
- RSVP works end-to-end: resident confirms → event shows RSVP'd
- Declining confirmation = zero action taken (verified)
- Actions blocked when `actions_enabled = false`
- Rate limit fires on the 11th call in 1 hour (automated test)

---

### Sprint 14 — Observability & Hardening (2 weeks)

**Goal**: Production readiness. No known vulnerabilities. Performance SLAs validated.

| # | Task | Notes |
|---|------|-------|
| 7.1 | Langfuse final config | 100% errors + 10% routine sample; tag `{ tenant_id_hash, model, tool }` |
| 7.2 | Railway health checks + PagerDuty | `/health` endpoint; alert on >5% error rate |
| 7.3 | Load test with k6 | 50 concurrent users, 10-min soak; p95 TTFT < 2s; 0% 5xx |
| 7.4 | Prompt injection red team | 50 attack vectors against Tier 2 config + chat input; 0 successful bypasses |
| 7.5 | Cross-tenant penetration test | Auth as Tenant A; attempt Tenant B data via API; 0 leaks |
| 7.6 | Token budget cap | Max 4,000 tokens/request; log + alert on exceed |
| 7.7 | Super Admin cost dashboard | Monthly AI cost by tenant (Langfuse data); not visible to tenant admins |
| 7.8 | Resident error state UI | Graceful "I'm having trouble right now" on agent error/timeout |
| 7.9 | Ops runbook | Railway restart, Supabase migration rollback, Redis flush procedures |

**⛔ Launch Go/No-Go Gate**:
- k6: p95 TTFT < 2s at 50 concurrent users
- Prompt injection red team: 0 bypasses
- Penetration test: 0 cross-tenant leaks
- PagerDuty wired and test alert verified
- Runbook reviewed by a second engineer

---

### Sprint 8+ — Telegram Integration (Future Epic)

Scoped as a **separate Epic** after Sprint 7 completes. Not part of Phase 1 launch.

High-level scope when ready: `grammY` webhook on Railway, message archiving pipeline, 90-day TTL purge via `pg_cron`, PII scrubbing middleware, resident opt-out, "What's new from your community?" summary surface in Rio chat sheet.

---

## 📐 Effort Summary

| Sprint | Name | Issue | Duration | Risk |
|--------|------|-------|----------|------|
| 7 | Spike | [#158](https://github.com/mjcr88/v0-community-app-project/issues/158) | 2 weeks | 🔴 HIGH |
| 8 | Foundation | [#159](https://github.com/mjcr88/v0-community-app-project/issues/159) | 2 weeks | 🟢 LOW |
| 9 | Ingestion Pipeline | [#160](https://github.com/mjcr88/v0-community-app-project/issues/160) | 2 weeks | 🔴 HIGH |
| 10 | Chat Interface | [#161](https://github.com/mjcr88/v0-community-app-project/issues/161) | 2 weeks | 🟡 MEDIUM |
| 11 | Admin Experience | [#162](https://github.com/mjcr88/v0-community-app-project/issues/162) | 2 weeks | 🟢 LOW |
| 12 | Memory & Privacy | [#163](https://github.com/mjcr88/v0-community-app-project/issues/163) | 2 weeks | 🟡 MEDIUM |
| 13 | In-App Actions | [#164](https://github.com/mjcr88/v0-community-app-project/issues/164) | 2 weeks | 🟡 MEDIUM |
| 14 | Observability & Hardening | [#165](https://github.com/mjcr88/v0-community-app-project/issues/165) | 2 weeks | 🟢 LOW |
| **Total** | | | **~30 weeks** | |

**Critical path**: Sprint 7 → Sprint 9. These two gates have the highest failure probability. All subsequent sprints are lower-risk once the RAG quality gate is cleared.

---

## 🤝 Phase 4: SDLC Handoff

All open decisions resolved (2026-03-11):
1. ✅ **Pilot community**: Confirmed. 5 real documents sufficient for Sprint 2 acceptance test.
2. ✅ **Document ingestion**: Tenant admin file-drop UI only. No Google Drive integration.
3. ✅ **BYOK**: Deferred — not in Phase 1 scope.
4. ✅ **Legal disclosure**: Sprint 5 memory consent modal sufficient for current jurisdictions.

---

*Source: `rio_agent_research.md`, `epic-rio-agent.md`, `rio_requirements_draft.md`*
*Patterns: `nido_patterns.md`, `lessons_learned.md`*

