source: requirement
imported_date: 2026-04-08
---
# Requirement: Río AI 3-Tier Prompt Architecture & Resident Context (#252)

**Date**: 2026-03-26
**Issue**: [#252](https://github.com/mjcr88/v0-community-app-project/issues/252)
**Epic**: [[Epic] Río AI — Sprint 5: Agent Memory (#163)](https://github.com/mjcr88/v0-community-app-project/issues/163)
**Status**: 🏗️ Definition

---

## Problem Statement

Currently, Río's system prompt is constructed from two blocks:
1. Static instructions in the agent source code.
2. Tenant-specific configuration (persona, policies) fetched from the database.

It lacks a way to inject **specific resident context** (name, lot, interests) dynamically without the resident's manual input. Furthermore, the existing documentation and Sprint 12 PRD have inverted or confusing numbering for these layers, which risks architectural drift and developer confusion.

We need to formalize a **3-Tier Prompt Architecture** that places the most specific context (Resident) closest to the user's message (bottom of system prompt) to ensure the LLM prioritizes these facts correctly.

## User Persona

**Resident**: Wants to feel recognized and valued by their community assistant. They shouldn't have to explain basic facts (like their lot number or neighborhood) repeatedly.
**Community Admin**: Wants to be able to configure Río's "personality" and local knowledge separately from the core platform logic.

## Context (The 3-Tier Model)

Per user clarification on 2026-03-26, the architecture follows this hierarchy:

| Tier | Name | Source | Content |
| :--- | :--- | :--- | :--- |
| **Tier 1 (Top)** | **Base Instructions (Global)** | `rio-agent.ts` | Core persona, safety rules, formatting, tool usage instructions. |
| **Tier 2 (Mid)** | **Community Context (Admin)** | `rio_configurations` | Tenant-specific persona, policies, emergency contacts, sign-offs. |
| **Tier 3 (Bottom)** | **Resident Context (Dynamic)** | `BFF -> x-resident-context` | Resident PII/Preferences: `name`, `lot`, `neighborhood`, `interests`, `skills`. |

### Behavioral Specs (Mastra Memory Integration)
- **Working Memory**: Known facts Río learns *during* conversation (Mastra resource-scoped to `userId`).
- **Semantic Recall**: Vector retrieval of past messages (Mastra resource-scoped to `userId`).
- **Profile Injection (This Requirement)**: Known facts imported from the **Nido User Profile** at the start of every session/turn.

## Dependencies

- **Issue #163**: Parent Epic for Memory.
- **Issue #252**: The specific M4 task for BFF profile injection.
- **Sprint 12 PRD**: Defines the 15-minute session rule and Mastra layers.
- **Security Check**: Profile data MUST be fetched server-side in the BFF and forwarded via JSON header to prevent spoofing or leakage.

## Documentation Gaps

- [ ] `docs/02-technical/rio-agent/memory-architecture.md` (Missing)
- [ ] Diagram for 3-tier prompt assembly (Missing)
- [ ] `docs/07-product/03_prds/prd_2026-03-26_sprint_12_rio_memory.md` (Contains outdated Tier numbering - requires update)

---

## Technical Options

### Option A: BFF-Enriched System Prompt (Recommended)
The BFF fetches the user profile and encodes it into a JSON string sent via the `x-resident-context` header. The Railway agent parses this and explicitly appends it to the system prompt before calling `rioAgent.stream()`.

- **Pros**: Agent remains stateless; single source of profile data (Next.js BFF); minimal latency (one DB fetch already happening in BFF).
- **Cons**: Sensitive PII travels over the wire (must be over HTTPS/VPN).
- **Effort**: Small (2-4 hours).

### Option B: Agent-Side Middleware Fetch
The Railway agent receives the `userId` and `tenantId` and fetches the profile directly from Supabase using its own service role key. This happens inside a Mastra "before" hook or at the start of the chat handler.

- **Pros**: Reduced payload size between BFF and Agent; cleaner separation of concerns for identity hydration.
- **Cons**: Increased latency (additional RTT between Agent and Supabase); Agent needs Supabase credentials + table permissions.
- **Effort**: Medium (4-8 hours).

### Option C: Mastra Working Memory Sync
Instead of injecting into the system prompt, the BFF "seeds" the Mastra Working Memory for the user with their profile data if it's empty. Río then naturally "remembers" these facts via Mastra's native memory retrieval.

- **Pros**: Leverages Mastra's native memory architecture; no complex prompt concatenation logic.
- **Cons**: Profile changes (e.g., name change) require a sync/wipe of working memory; "Recall" is less reliable than explicit "In-Context" instructions for core identity facts.
- **Effort**: Medium (6-10 hours).

---

## Recommendation

**Selected Option: Option A (BFF-Enriched System Prompt)**

We will implement Option A. It provides the best balance of security (Backend-First) and performance. The BFF already handles authentication and tenant context; adding a profile fetch is a marginal increase in latency that provides a significantly better user experience.

### Implementation steps:
1. **BFF (`app/api/v1/ai/chat/route.ts`)**: Fetch `public.users` fields (`name`, `neighborhood`, `interests`, `skills`, `lot_number`) and pass as base64 or JSON-encoded header `x-resident-context`.
2. **Agent (`packages/rio-agent/src/index.ts`)**: Parse the header and construct the Tier 3 block.
3. **Prompt Order**: 
   - Tier 1: Global (Instructions)
   - Tier 2: Tenant (Configurations)
   - Tier 3: Resident (Profile)

---

## Metadata
- **Priority**: P1
- **Size**: S
- **Horizon**: Q1 26

---

---

## 8. Technical Review

### Phase 0: Issue Details
- **Issue**: #252 (BFF Profile Injection)
- **Goal**: Standardize 3-tier prompt architecture and satisfy M4/Epic #163.
- **Reference Doc**: `requirements_2026-03-26_rio_memory_3tier.md`

### Phase 0: Impact Map
- `app/api/v1/ai/chat/route.ts`: BFF logic for profile fetch and header forwarding.
- `packages/rio-agent/src/index.ts`: Agent server logic for tier assembly.
- `packages/rio-agent/src/agents/rio-agent.ts`: Static Tier 1 instructions.
- `supabase/tables/users`: Source of resident identity facts.
- `supabase/tables/rio_configurations`: Source of Tier 2 community facts.

### Phase 0: Historical Context
- Recent commits to `app/api/v1/ai/chat/route.ts` settled the Backend-First isolation logic (March 22).
- `rio-agent` was recently refactored to use Mastra (March 18).
- No major regressions noted in the targeted files.

🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...

### Phase 1: Security Audit
- **Vibe Check**: PASSED. The "Tier 3" injection occurs exclusively server-side (BFF to Agent). No resident profile data is exposed to the client-side code during the assembly process.
- **Tenant Isolation**: The BFF verifies the `tenant_id` from the user session against the DB before fetching the profile. The Agent's `resourceId` is correctly scoped to `userId` for memory isolation.
- **Attack Surface**:
    - **Header Integrity**: `x-resident-context` is protected by `RIO_AGENT_KEY`.
    - **PII Exposure**: **WARNING**: Resident name and lot number will be part of the system prompt. Agent logs must NOT dump the full `systemPrompt` or `x-resident-context` header in production.
- **Remediation**: Ensure `RIO_AGENT_DEBUG` is disabled in production to prevent prompt logging.

🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...

### Phase 2: Test Plan
- **Sad Paths**:
    - **Missing Profile**: If `public.users` returns no data, the BFF should fallback to an empty context string rather than failing.
    - **Supabase Timeout**: Ensure a 3s timeout on the profile fetch to prevent blocking the chat response indefinitely.
    - **Invalid JSON**: The Agent must robustly handle malformed or missing JSON in the `x-resident-context` header.
- **Unit Testing**:
    - `describe('Profile Formatter')`: Test the helper function that maps the Supabase user object to the `x-resident-context` JSON structure.
- **Integration Testing**:
    - Update `app/api/v1/ai/chat/__tests__/gate.test.ts` to mock the profile fetch and verify the header presence in the outbound Railway request. (Command: `npm test gate.test.ts`)
- **Manual Verification**:
    - Use a staging resident account.
    - Modify "Interests" in Supabase (e.g., add "Pickleball").
    - Chat with Rio: "Who am I and what do I like?"
    - Expected: Rio mentions the user's name and "Pickleball".

🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...

### Phase 3: Performance Review
- **Query Efficiency**: The `public.users` table is indexed by `id`. Fetching profile fields (`name`, `interests`, etc.) is high-performance.
- **N+1 Optimization**: 
    - **Observation**: The current BFF route (`app/api/v1/ai/chat/route.ts`) already performs a `select('role, tenant_id')` from `users`. 
    - **Optimization**: To avoid a new round-trip, the implementation MUST append the required profile fields to this existing query. 
    - **Total Latency**: Total DB overhead remains at 2 round-trips (1 for User/Profile, 1 for Tenant Features).
- **Memory Impact**: The `x-resident-context` header should be kept under 2KB to ensure it doesn't exceed internal header size limits in proxy layers (Railway/Vercel). Residents with >20 "Interests" should have the array truncated.

🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...

### Phase 4: Documentation Plan
- **Architecture**: Create `docs/02-technical/architecture/domains/rio-3-tier-prompt.md` explaining the hierarchy and injection points.
- **Flows**: Create `docs/02-technical/flows/rio-profile-injection.md` with a Mermaid sequence diagram showing Resident -> BFF (Supabase Fetch) -> Agent (Header Parsing) -> Resident Response.
- **API Reference**: Update `docs/02-technical/rio-agent/overview.md` to formally document the `x-resident-context` header schema.
- **Manuals**: Add a "Personalization" section to `docs/01-manuals/resident-guide.md` explaining how Río uses profile facts.
- **Gap Logging**: Logged Gap #101 (Profile Injection Flow Diagram) to `docs/documentation_gaps.md`.

🔁 [PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...

### Phase 5: Strategic Alignment
- **Conflicts**: None. This is a baseline feature for all Sprint 12/13 personalized memory work.
- **Sizing**: **XS**. Low complexity, localized changes in BFF and Agent middleware.
- **Decision**: **PRIORITIZE**. This issue is the "M4" milestone and a hard dependency for subsequent memory features.

### Technical Review Summary (DoD)
1. **BFF Enrichment**: Fetch `name, neighborhood, interests, skills, lot_number` in the existing `users` query inside `app/api/v1/ai/chat/route.ts`.
2. **Stateless Injection**: Pass context via `x-resident-context` header. No session state should be stored in the agent for this specific tier.
3. **Prompt Order**: Standardized 3-tier sequence (Global -> Community -> Resident).
4. **Validation**: Integration test mocking Supabase and verifying outbound fetch headers.
5. **Privacy**: Ensure PII is not logged in agent debug traces.

✅ [REVIEW COMPLETE] Issue #252 is now **Ready for Development**.
