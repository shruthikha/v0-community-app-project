source: requirement
imported_date: 2026-04-08
---
# [Brainstorm] Issue 193: RioAgent on Railway — RAG tool + 3-tier prompt compositor

## Problem Statement
The Río agent running on Railway needs the correct context to answer tenant-specific questions accurately. It must be able to perform semantic searches over ingested documents.

## User Persona
- **System/Agent**: Needs tools and clean prompts to perform accurate retrieval.
- **Residents**: Expect accurate, community-specific answers hallucination-free.

## Context
The agent model should switch to `google/gemini-2.5-flash` for speed and reasoning. We need to import and register the `PgVector` search tool in the `rio-agent` structure. The system prompt must also appropriately incorporate context from the BFF to scope answers directly to the user's community.

## Dependencies
- Epic #161: Río AI — Sprint 3: Chat Interface
- Ingestion pipeline (already completed in Sprint 9).

## Technical Options
### Option A: Direct Postgres Query in Agent
- **Pros**: Complete control over exactly what matching vector is doing.
- **Cons**: Misses out on Mastra's advanced tool tracking and observability.
- **Effort**: Low
### Option B: Custom Mastra Tool Wrapper (`createTool`)
- **Pros**: Clean schema definition via Zod, seamless integration with `agent.generate()`, tracked in Mastra console.
- **Cons**: Slight boilerplate overhead.
- **Effort**: Medium
### Option C: Offload RAG to Vercel
- **Pros**: Less logic in Railway.
- **Cons**: Vercel timeouts; slower ping-ponging across network.
- **Effort**: High

## Recommendation
**Option B (Custom Mastra Tool Wrapper)**. Defines a `search_documents` tool using `pgvector` connected to the `rio_document_chunks` table, filtered by `tenant_id`. Handled cleanly via Mastra tools.
- **Priority**: P0
- **Size**: M
- **Horizon**: Q2 26

---

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue Details**: Configure Gemini 1.5 Flash and implement RAG tool in `rio-agent`.
- **Impact Map**:
    - `packages/rio-agent/src/agents/rio-agent.ts`: Core logic update.
    - `packages/rio-agent/src/index.ts`: Vector store configuration (verified).
- **Historical Context**: Built on Sprint 8 (Foundation) and Sprint 9 (Ingestion).
- **Handoff**: 🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...

### Phase 1: Vibe & Security Audit
- **Vibe Check**: Follows "Backend-First".
- **Zero Policy**: The `search_documents` tool **MUST** enforce `tenant_id` filtering. The `PgVector` tool in Mastra supports a filter object. We must pass the `tenantId` from the context into the vector search.
- **Safety**: Ensure PI redaction (already in `index.ts`) covers tool outputs if necessary.
- **Handoff**: 🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...

### Phase 2: Test Strategy
- **Sad Paths**:
    - **No results**: Agent should handle empty search results gracefully.
    - **Wrong Tenant**: High-risk path. Test that searching with Tenant A's context never returns Tenant B's docs.
- **Test Plan**:
    - **Isolation Test**: Extend `tenant-isolation.test.ts` to verify the search tool specifically.
    - **Integration Test**: Check that `rioAgent.generate()` triggers the tool when contextually appropriate.
- **Handoff**: 🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...

### Phase 3: Performance Assessment
- **Analysis**: Gemini 1.5 Flash is significantly faster than GPT-4o-mini for RAG tasks.
- **Vector Indexing**: Verify `rio_document_chunks` has an active HNSW index for the `embedding` column.
- **Handoff**: 🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...

### Phase 4: Documentation Plan
- **Tools**: Document the `search_documents` tool in the internal technical docs.
- **Prompting**: Document the 3-tier prompt strategy:
    1. Base Persona (FRIENDLY neighbor).
    2. Community Context (Passed by BFF).
    3. Retrieved Knowledge (RAG chunks).
- **Gap Logging**: Logged missing documentation for the new 3-tier prompt composition strategy in `docs/documentation_gaps.md`.
- **Handoff**: 🔁 [PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...

### Phase 5: Strategic Alignment & Decision
- **Context**: Issue #193 is the core "intelligence" task. It enables the agent to actually "know" community-specific information via RAG.
- **Sizing**: **M**. Switching to Gemini Flash and implementing a robust, isolated RAG tool is a standard Mastra pattern but requires careful prompt engineering.
- **Decision**: **Prioritize**. Ready for development for Sprint 11.
- **Issue Link**: [Issue #193](https://github.com/mjcr88/v0-community-app-project/issues/193)

✅ [REVIEW COMPLETE] Issue #193 is now **Ready for development**.
