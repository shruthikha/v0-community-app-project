source: requirement
imported_date: 2026-04-08
---
# Requirements: Río AI Privacy Settings (GDPR)

**Date**: 2026-03-28
**Issue**: [#259](https://github.com/mjcr88/v0-community-app-project/issues/259)
**Status**: 📝 Phase 1 (Definition)
**Parent Epic**: [#163](https://github.com/mjcr88/v0-community-app-project/issues/163)

---

## 🛑 Problem Statement

Residents currently have no visibility or control over the "learned facts" that Río AI persists in its long-term memory (Working Memory). To ensure trust, transparency, and GDPR compliance, residents must be able to:
1. View what Río has learned about them.
2. Delete specific facts that are no longer accurate or they wish to keep private.
3. Bulk-delete all learned memories to reset Río's personalization.

## 👥 User Persona

**Sarah, the Privacy-Conscious Resident**
- **Goal**: Wants to use Río for community assistance but is wary of "creepy" persistence of personal details.
- **Need**: Wants a clear dashboard where she can audit and wipe her interaction data without deleting her entire user account.

## 📖 Context

This feature is part of **Sprint 12: Agent Memory**. It leverages Mastra's native `workingMemory` which is scoped to a `resourceId` (mapped to `userId`).

### Key Functional Requirements
- **Route**: Integrated as a new collapsible section on the existing Resident Profile Privacy page (`/t/[slug]/dashboard/settings/profile` or similar).
- **Display**: A "Río's Memory" accordion or collapsible section.
    - **Pagination**: Initial load of **10 memories** with a **"Load more"** button.
    - **Format**: Individual "fact cards" with clear delete actions.
- **Actions**:
    - **Single Delete**: Remove individual lines/facts from the working memory block.
    - **Bulk Delete**: Clear the entire working memory block.
- **Security Confirmation**: Bulk deletion requires the user to type `DELETE` in a confirmation modal to prevent accidental wipes.
- **BFF Integration**: Proxying calls to the Railway-hosted agent via `/api/v1/ai/memories`.

## 🔗 Dependencies & Related Issues

- **Critical Dependency**: [#256](https://github.com/mjcr88/v0-community-app-project/issues/256) (Ensuring `resourceId` is correctly mapped to `userId`).
- **Related**: [#261](https://github.com/mjcr88/v0-community-app-project/issues/261) (Mastra configuration must have `workingMemory` enabled).
- **Related**: [#260](https://github.com/mjcr88/v0-community-app-project/issues/260) (Tier 3 Profile Injection - helps distinguish between "learned" memory and "profile" data).

## 🕳️ Documentation Gaps
- [ ] Technical spec for the `DELETE /api/v1/ai/memories` endpoint (whether it accepts a specific fact ID or just syncs the whole block).
- [ ] UI Design for "Learned Facts" list (List vs. Cards vs. Text Block).

---

## 💡 Phase 2: Technical Options (Ideation)

### Option 1: Direct Markdown Sync (Text-Based)
- **Description**: The UI provides a "Source View" of the working memory block. Users can edit or delete lines directly in a text area. The entire block is synced back to the agent on "Save".
- **Pros**: low implementation overhead; transparent to what the LLM actually sees.
- **Cons**: Poor UX; risk of user-introduced formatting errors; lacks "premium" feel.
- **Effort**: S (4-8h)

### Option 2: Structured Fact Cards (Recommended)
- **Description**: The BFF parses the working memory markdown (typically a bulleted list) into a JSON array of strings. The UI renders these as elegant cards in the "Purples/Stone" design system. Each card has a discrete "Delete" action.
- **Pros**: High-quality UX; prevents accidental formatting errors; matches the PRD "delete individual facts" requirement exactly.
- **Cons**: Requires robust parsing of the working memory string; potentially complex if the LLM generates non-list structures.
- **Effort**: M (8-16h)

### Option 3: Logic-Based Memory Filter (Intervention Layer)
- **Description**: Instead of deleting from the Mastra Working Memory block, we maintain a "Blacklist" of forbidden facts/keywords in Supabase. The BFF filters the working memory context before it reaches the LLM.
- **Pros**: Immediate "forgetting" without needing to wait for Mastra sync; durable even if Mastra re-learns the fact.
- **Cons**: Over-engineering; introduces a fragmented source of truth for memory; high operational complexity.
- **Effort**: L (24h+)

---

## 📈 Phase 3: Recommendation (Product Owner)

### Recommendation: Option 2 (Structured Fact Cards) — REVISED
We recommend **Option 2** for the initial implementation of the Rio Privacy Settings, integrated as a **collapsible section** within the existing resident profile settings. This approach provides a "Premium" feel that aligns with the v0-community-app design standards while ensuring structural integrity of the Mastra Working Memory. 

**Key UX Enhancements**:
- **Pagination**: Load 10 items initially to keep the profile page performant.
- **Granular Control**: Give residents the ability to prune specific facts while maintaining a bulk "Reset" option for peace of mind.

### Metadata
- **Priority**: P2
- **Size**: M
- **Horizon**: Q1 26

🔁 [PHASE 3 COMPLETE] Handing off to User for Review...

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue**: #259 (Privacy Settings + GDPR)
- **Impact Map**:
    - **Frontend**: `app/t/[slug]/dashboard/settings/privacy/privacy-settings-form.tsx`
    - **BFF**: `app/api/v1/ai/chat/route.ts`, `app/api/v1/ai/threads/`
    - **New Endpoints**: `POST /api/v1/ai/threads/new`, `DELETE /api/v1/ai/memories`
    - **Agent**: `packages/rio-agent/src/` (Mantra configuration)
- **Historical Context**: Recent work centered on RAG and thread isolation. Mastra memory is currently enabled but lacks granular control and UI visibility.

### Phase 1: Vibe & Security Audit
- **Vibe Check (Backend-First)**: 
    - [FAIL] `resourceId` leakage: Currently defaults to `tenantId` in BFF and hardcoded to `"rio-chat"` in Agent. This allows cross-resident memory contamination.
    - [PASS] Thread ownership: Verified in both BFF and Agent via `auth.uid()` and stored metadata.
- **Attack Surface**:
    - **Memory Deletion**: New endpoints for GDPR (`/api/v1/ai/memories`) MUST strictly enforce `userId` scoping.
    - **RLS Coverage**: `rio_threads`, `rio_messages`, and `user_memories` are correctly secured with `auth.uid()` subqueries.
- **Recommendation**: Immediate fix for `resourceId = userId` mapping is required before deploying persistent memory features.

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Cross-Resident Access**: User A requests deletion of User B's `resourceId`. Should yield 403.
    - **Malformed Memory**: LLM stores non-bulleted facts. Parser should handle plain text gracefully.
    - **Sync Latency**: Dashboard confirms "Deleted" but Agent/DB write is pending. Need clear optimistic UI vs. confirmation.
- **Test Plan**:
    - **Unit (Agent)**: Test `MemoryService.deleteFactByIndex()` logic in isolation.
    - **Integration (BFF)**: Mock Railway response and verify `/api/v1/ai/memories` route handling.
    - **E2E (Playwright)**: Full flow: User Settings -> Rio Memory Tab -> Delete Card -> Verify absence in next chat.

### Phase 3: Performance Assessment
- **Indexing Status**:
    - [PASS] `rio_document_chunks`: HNSW index on embeddings verified.
    - [PASS] `user_memories`: Index on `user_id` verified.
    - [NOTE] `rio_messages`: Index on `thread_id` is highly recommended as history grows.
- **Latency & Throughput**:
    - **Memory Parsing**: Current logic parses a single markdown block. At < 2k tokens, this overhead is < 50ms.
    - **Vector Recall**: HNSW provides O(log N) retrieval, suitable for production community sizes.
- **Recommendation**: Monitor `mastra_observational_memory` growth; recommend a periodic "summarization" or "pruning" logic if a resident stays active for > 12 months.

### Phase 4: Documentation Logic
- **Documentation Gaps**:
    - **ADR-015**: Propose a new ADR for "Resident-Scoped Memory Architecture" to formalize Phase 1 fixes.
    - **API Expansion**: Add `DELETE /api/v1/ai/memories` (bulk/individual) and `GET /api/v1/ai/memories` to the technical API reference.
    - **Resident Manual**: Create a "How to Manage Your AI Memories" guide for the `docs/manual` folder detailing the impact of memory deletion.
- **Update Mapping**:
    - `docs/02-technical/rio-agent/memory-schema.md`: Must include `user_memories` table and reflect User-Scoped `resourceId` pattern.

### Phase 5: Strategic Alignment & Decision
- **Alignment**: This specification fulfills the "Resident-level memory" (M7) and "GDPR Compliance" (P2) requirements from the Sprint 12 PRD.
- **Decision**: 
    - [APPROVED] Implementation of `resourceId = userId` mapping.
    - [APPROVED] Privacy Settings UI with individual fact deletion via specialized parser.
- **Next Steps**: Transition to `/03_scope` for Issue 259 to generate a concrete Git Plan.

---
**STATUS: [READY FOR DEVELOPMENT]**
*Reviewed by: Antigravity AI (Technical Review Pipeline)*
