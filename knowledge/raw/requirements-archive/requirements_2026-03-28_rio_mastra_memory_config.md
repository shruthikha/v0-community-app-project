source: requirement
imported_date: 2026-04-08
---
# Requirements: Río AI — Mastra Memory Configuration (M5-M8)

**Date**: 2026-03-28
**Status**: Approved
**Issues**: #253, #254, #255
**Epic**: [[Epic] Río AI — Sprint 5: Agent Memory (#163)](https://github.com/mjcr88/v0-community-app-project/issues/163)

## Problem Statement
Río currently lacks a persistent memory layer, meaning it cannot "remember" residents between sessions or recall relevant context from previous threads. This results in a fragmented user experience where residents must re-introduce themselves or repeat information. We need to leverage Mastra's native `Memory` features (`workingMemory`, `semanticRecall`, `lastMessages`) to provide continuity and personalization.

## User Persona
**The Resident**: A member of a managed community who interacts with Río for help with amenities, rules, or local info. They expect Río to remember their name, preferences, and past inquiries (e.g., "Was the pool heater fixed like we discussed last week?").

## Context
This implementation focuses on configuring the Railway-hosted Mastra agent to use its own PostgreSQL storage for memory. This work occurs after the P0 fixes for `resourceId` stability (M1) and thread management (M2, M3) are implemented in the BFF. It involves:
- Configuring the `Memory` object with the correct sliding window and recall thresholds.
- Implementing a `TokenLimiter` to manage cost and latency.
- Correctly scoping all memory operations to the `userId` (`resourceId`) at the `agent.stream` entry point.

## Dependencies & Related Work
## Dependencies & Related Work
- **M1-M3 (Prerequisites)**: Assumes `resourceId` is correctly passed as `userId` from the BFF and thread hydration is functional.
- **Supabase**: Profile data (name, interests) is injected via the BFF (M4, subsequent work) but persists in Mastra's `workingMemory`.
- **OpenRouter**: Provides `google/gemini-2.5-flash` and `openai/text-embedding-3-small`.
- **Mastra Core**: Native `Memory` and `Processor` infrastructure.
- **Issue 163**: Parent Epic.
- **Issue 252**: 3-Tier Prompt Architecture (interacts with memory injection).

## Functional Requirements (M5-M8)

### 1. Memory Window & Recall (#253)
- `lastMessages`: Strictly **10** messages.
- `workingMemory`: Enabled, scoped to `resource`.
- `semanticRecall`: Enabled, scoped to `resource`, `topK: 5`, `threshold: 0.75`.
- **Embedding Model**: `openai/text-embedding-3-small` (to match ingestion workflow).

### 2. Guardrails & Performance (#254)
- **TokenLimiter**:
    - **Limit**: 50,000 tokens (for `gemini-2.5-flash`).
    - **Strategy**: `truncate` (gracefully trim oldest history).
    - **Purpose**: Prevent cost spikes and latency degradation on complex multi-step threads.

### 3. Security & Multi-Tenancy (#255)
- **Resource Scoping**: `resourceId` MUST ALWAYS be `userId`.
- **Stream Entry Point**: The `userId` must be extracted and passed to `rioAgent.stream()` reliably within `packages/rio-agent/src/index.ts`.
- **Leaked Context Prevention**: Verification that memory cannot be retrieved across different user IDs even within the same tenant.

## Documentation Gaps
- [ ] Confirm if `TokenLimiter` should apply to `input`, `output`, or `perStep` — Recommendation: `input` and `perStep`.

---

## Technical Options (Phase 2)

### Option 1: Modular Memory Configuration (Recommended)
- **Description**: Extract memory and processor initialization into `packages/rio-agent/src/lib/memory.ts`.
- **Pros**:
    - Clean separation of concerns.
    - Simplified unit testing for memory logic.
    - Prevents `rio-agent.ts` from becoming a bloated "god file".
- **Cons**: Adds one additional file to the package.
- **Effort**: **S** (4-6 hours)

### Option 2: Enhanced In-Place Configuration
- **Description**: Directly update `packages/rio-agent/src/agents/rio-agent.ts` with the new `Memory` configurations and `TokenLimiter` processor.
- **Pros**:
    - Simplest implementation flow.
    - All agent configuration is visible in one place.
- **Cons**: Decreased readability as the agent grows with more guardrails and processors.
- **Effort**: **XS** (2-4 hours)

### Option 3: Config-Driven Memory Initialization
- **Description**: Create a central `config.ts` that defines all memory parameters (`lastMessages`, `tokenLimit`, `recallThreshold`). The `Memory` instance consumes this config.
- **Pros**:
    - High tunability without code changes.
    - Prepares the system for multi-agent or multi-tenant specific configurations.
- **Cons**: Potential over-engineering for the current scope.
- **Effort**: **M** (8-12 hours)

---

## Recommendation (Phase 3)

### **Selected: Option 1 (Modular Memory Configuration)**

**Rationale**: 
As the Río Agent complexity increases, separating infrastructure (Memory, Storage, Processors) from agent instructions and tool logic is critical for long-term maintainability. Option 1 allows us to encapsulate the `TokenLimiter` and `Memory` initialization in a reusable way.

**CRITICAL IMPLEMENTATION ORDER**:
1.  **M7 (#255) MUST be implemented first (or simultaneously)**: Current code in `index.ts` hardcodes `resourceId: "rio-chat"`. If we enable `workingMemory` (M5) before fixing the wiring, all users will share the same memory. 
2.  **M5 (#253)**: Configure the memory engine with the validated `userId`.
3.  **M6 (#254)**: Layer on the `TokenLimiter` for performance safety.

### Mandatory Metadata
- **Priority**: P0
- **Size**: S
- **Horizon**: Q1 26


## 8. Technical Review

### Phase 0: Context Gathering (Retrieval, Map & History)

#### Phase 0: Issue Details
- **Issue #253 (M5)**: Configure Mastra Memory options. Enable `workingMemory` and `semanticRecall` (topK: 5, threshold: 0.75). `lastMessages` limited to 10.
- **Issue #254 (M6)**: Add `TokenLimiter` memory processor. Prevents context overflow for `gemini-2.5-flash`.
- **Issue #255 (M7)**: Wire `userId` as `resourceId` in `rioAgent.stream()`. Scopes memory to the resident.

#### Phase 0: Impact Map
- `packages/rio-agent/src/agents/rio-agent.ts`: Primary agent configuration.
- `packages/rio-agent/src/index.ts`: Entry point for streaming and wiring.
- `packages/rio-agent/src/lib/memory.ts`: [Proposed] Modular memory configuration.
- `packages/rio-bff/src/services/ai.service.ts`: [Potential] BFF side changes for profile injection and thread management.

#### Phase 0: Historical Context
- Recent work has focused on RAG citations and basic streaming.
- `resourceId` was previously hardcoded to `"rio-chat"`, leading to shared memory issues.
- Integration with `Mastra` core for thread management is a key transition in Sprint 12.

### Phase 1: Vibe & Security Audit

#### Phase 1: Security Audit
1.  **Vibe Check (Backend-First)**:
    - **Confirmed**: The agent correctly enforces thread ownership in `index.ts` by checking `userId` and `tenantId` against the `ThreadStore`.
    - **Finding**: Direct `PostgresStore` usage for Mastra memory is secure as it's server-authoritative, but multi-tenancy relies entirely on the correctness of `resourceId`.
2.  **Attack Surface Analysis**:
    - **Critical Risk**: Shared `resourceId: "rio-chat"` in the current `rioAgent.stream` call (index.ts:213) constitutes a cross-user data leak risk if `workingMemory` is enabled without remediation.
    - **Mitigation**: Requirement M7 (#255) is mandatory before M5 (#253) deployment.
    - **Residual Risk**: LLM prompt injection potentially bypassing guardrails. The 3-tier prompt architecture in the BFF provides partial mitigation, but agent-level `TokenLimiter` (M6) is needed to prevent DoS via large tool outputs.

### Phase 2: Test Strategy

#### Phase 2: Test Plan
1.  **Sad Paths**:
    - **Identity Swap**: Attempt to retrieve User A's `workingMemory` using User B's `resourceId`. Expected: `403` or empty context.
    - **Context Bloat**: Simulate a 100k token tool output. Expected: `TokenLimiter` triggers and agent completes without overflow error.
    - **Anonymous Request**: Request without `x-user-id` header. Expected: `400 Bad Request`.
2.  **Automated Tests**:
    - **Unit**: Validate `Memory` config initialization values match spec (#253).
    - **Integration (`packages/rio-agent/src/tests/memory-isolation.test.ts`)**: Seed Mastra's `mastra_memory` and `mastra_threads` tables with multi-user data; verify that `lastMessages` and `workingMemory` queries return strictly partitioned data.
3.  **Manual Verification**:
    - **Persistence Proof**: User tells Rio "My favorite color is Blue", starts a new session (>15 mins), and asks "What's my favorite color?". Rio must answer "Blue".

### Phase 3: Performance Assessment

#### Phase 3: Performance Review
1.  **Index Optimization**:
    - **Confirmed**: `idx_mastra_threads_tenant_user` and `idx_mastra_messages_tenant_user` provide efficient O(log N) lookup for resident-scoped threads and messages.
    - **Advisory**: Ensure `public.mastra_memory` has a GIN or B-tree index on `resource_id` to keep `workingMemory` retrieval fast as the resident population grows.
2.  **Latency & Cost Control**:
    - **M6 (#254) Validation**: The `TokenLimiter` strategy of `truncate` is the most performance-efficient approach for `gemini-2.5-flash`. It avoids the heavy compute cost of "summarize" strategies while maintaining a responsive 10-message sliding window.
    - **Semantic Recall**: Capped at `topK: 5` with a high threshold (`0.75`) ensures that vector search doesn't return noisy, low-relevance context that would bloat the prompt and increase latency.

### Phase 4: Documentation Logic

#### Phase 4: Documentation Plan
1.  **Technical Reference**:
    - **Missing Domain Doc**: Create `docs/02-technical/rio-agent/memory-architecture.md` to document the namespacing of `resourceId` (userId) and `threadId` (tenant-prefixed).
    - **API Update**: Document new BFF endpoints (`/threads/new`, `/threads/history`) in `api-reference.md`.
2.  **Schema & Security**:
    - **RLS Policies**: Create `docs/02-technical/schema/policies/mastra_memory.md` documenting the per-user isolation of working memory blocks.
3.  **User Guidance**:
    - **Resident Guide**: Add "Managing Your AI Memory" section to `/docs/01-manuals/resident-guide.md` explaining the Privacy Settings page.

### Phase 5: Strategic Alignment & Decision

#### Phase 5: Decision
1.  **Strategic Fit**: 
    - High. Sprint 12 is dedicated to Memory and Continuity (#163). Issues #253, #254, #255 are core foundational blocks.
2.  **Sizing**: 
    - **Total Estimate**: **S** (approx. 10-14 engineering hours). 
    - **Breakdown**: M5 (4h), M6 (2h), M7 (2h), Testing/QA (4h).
3.  **Conflict Check**:
    - No active "In Progress" items conflict with Mastra memory configuration. Prerequisites M1-M3 (BFF wiring) are marked as foundation-ready.
4.  **Final Decision**: 
    - **🟡 Prioritize (Ready for Dev)**.
    - **Note**: Implementation of Option 1 (Modular Memory) is recommended for maintainability.

#### Definition of Done (Sprint 12 Subset)
- [ ] Mastra `Memory` initialized with 10-message window and recall enabled.
- [ ] `TokenLimiter` configured for `gemini-2.5-flash`.
- [ ] `resourceId` correctly wired to `userId` in `packages/rio-agent/src/index.ts`.
- [ ] Integration tests verify zero-leakage between different `userId`s.
- [ ] Documentation gaps (101-102) addressed.

✅ [REVIEW COMPLETE] Issue #253, #254, #255 are now Ready for Development.


