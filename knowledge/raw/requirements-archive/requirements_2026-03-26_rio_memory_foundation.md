source: requirement
imported_date: 2026-04-08
---
# Requirements: Río AI Memory Foundation

**Date**: 2026-03-26
**Issues**: #249, #250, #251
**Status**: 🟠 Draft (Phase 3: Recommended)
**Epic**: #163

## 1. Problem Statement

Río's memory system is currently in a "stateless" or "loose" state despite having Mastra infrastructure. 
1. **Security/Privacy Gap**: `resourceId` (used for scoping memory) defaults to `tenantId`, merging all residents' memories.
2. **User Experience Gap**: History isn't loaded on chat open, leading to a "blank slate" feeling every time.
3. **Robustness Gap**: Thread IDs are generated client-side, making them unpredictable and harder to manage for session timeouts.

## 2. User Persona

- **The Resident**: Wants Río to remember them, recall past context, and not lose their place if they accidentally close the chat.
- **The Tenant Admin**: Needs to ensure resident memories are strictly isolated and compliant with privacy standards.

## 3. Context & Impact Map

### Impacted Components
- **BFF (`app/api/v1/ai`)**: Needs new endpoints for thread management and history hydration.
- **Railway Agent (`packages/rio-agent`)**: Handlers must respect `userId` and provide memory access tools.
- **UI (`components/ecovilla/chat`)**: `RioChatSheet` needs to transition from client-side generation to server-driven lifecycle.

### Files to Modify
- `app/api/v1/ai/chat/route.ts`
- `packages/rio-agent/src/index.ts`
- `components/ecovilla/chat/RioChatSheet.tsx`
- [NEW] `app/api/v1/ai/threads/messages/route.ts`
- [NEW] `app/api/v1/ai/threads/new/route.ts`

## 4. Documentation Gaps

- [ ] `docs/02-technical/rio-agent/memory-architecture.md`: Needs to be created to document thread lifecycles and `resourceId` scoping.
- [ ] `docs/02-technical/api/api-reference.md`: Needs update with new `/threads` endpoints.

## 5. Dependencies

- **Mastra SDK**: Relies on `Memory` and `PostgresStore` working correctly.
- **Supabase Auth**: Relies on `userId` being accurately extracted from JWT.
- **Issue 163 (Epic)**: This work is the prerequisite for all subsequent Sprint 12 features.

## 6. Phase 2: Technical Options

### Option A: Standard Mastra Native Memory Management
- **Description**: Use Mastra's built-in `Memory` and `PostgresStore`. Correc the `resourceId` mapping to `userId` in the BFF. Implement `/threads/new` and `/threads/messages` by directly proxying to Mastra's `createThread` and `listMessages`.
- **Pros**: Cleanest architecture, minimal custom code, fully leverages the framework.
- **Cons**: Requires the Railway agent to be active and reachable for every history load.
- **Effort**: S (4-8h)

### Option B: Parallel Hydration (BFF + Supabase)
- **Description**: While keeping Mastra for the agent's working memory, store thread metadata and message summaries in the main Supabase database. Hydrate history from Supabase in the frontend to reduce load on the Railway agent.
- **Pros**: Potentially faster initial load, more robust history if the agent service is down.
- **Cons**: Dual-source of truth (Mastra DB vs Supabase), synchronization complexity.
- **Effort**: M (12-16h)

### Option C: Optimistic Client-Side Lifecycle with Server Validation
- **Description**: Keep the client-side ID generation but add a "Sync" step where the BFF validates the ID and stamps it with metadata upon the first message.
- **Pros**: No changes to the `RioChatSheet` initial render logic.
- **Cons**: Doesn't solve the robustness issue of server-driven IDs, harder to manage session timeouts accurately.
- **Effort**: S (4-8h)

## 7. Phase 3: Recommendation (Product Owner)

### Recommendation: Option A (Standard Mastra Native)
We recommend proceeding with **Option A**. This approach adheres to the primary architectural philosophy of using Mastra's native memory management without introducing custom table sync complexity (avoiding the "Dual Source of Truth" anti-pattern). By correcting the `resourceId` to `userId` and moving thread creation to the server, we resolve the security and robustness gaps with minimal footprint.

### Classification
- **Priority**: P0 (Security/Isolation + Hydration Fix)
- **Size**: S (4-8h per issue, overlapping implementation)
- **Horizon**: Q1 26 (Sprint 12)

## 8. Technical Review

### Phase 0: Issue Details & Context
- **Issue 249**: Fix `resourceId`. Found that current mapping uses `tenantId` (BFF) and hardcoded `"rio-chat"` (Agent). Needs `userId` for resident isolation.
- **Issue 250**: History Hydration. `RioChatSheet.tsx` syncs `threadId` but doesn't fetch messages. Needs new BFF `/messages` proxy.
- **Issue 251**: Server-driven Threads. Client currently generates random IDs. Needs `POST /threads/new` in BFF + Agent.

### Phase 0: Impact Map
- `app/api/v1/ai/chat/route.ts`: Update `resourceId` logic.
- `packages/rio-agent/src/index.ts`: Update `rioAgent.stream` call and add thread handlers.
- `components/ecovilla/chat/RioChatSheet.tsx`: Update to use server IDs and hydration calls.
- `app/api/v1/ai/threads/messages/route.ts` [NEW]: History proxy.
- `app/api/v1/ai/threads/new/route.ts` [NEW]: Thread creation proxy.

### Phase 0: Historical Context
- Recent work in `chat/route.ts` added feature flag gating and tenant verification.
- `rio-agent/index.ts` has existing thread ownership checks (`thread.metadata?.userId !== userId`).
- `RioChatSheet.tsx` was modified to move the chat state to a sheet/drawer for mobile.

### Phase 1: Security Audit & Vibe Check
- **Backend-First Compliance**: Implementation follows the BFF -> Agent pattern. Authentication is handled at the edge (Next.js) and re-validated in the Agent.
- **Privacy Isolation (Issue 249)**: Confirmed that `resourceId` is the primary scoping mechanism for Mastra. Transitioning from `tenantId` to `userId` is the correct fix for resident privacy.
- **Vulnerability Found**: `ThreadStore.getThreadById` validates `tenantId` but ignores `userId` in metadata. 
- **Remediation**: 1. Update `ThreadStore` to verify `thread.metadata?.userId === userId`. 2. Ensure `POST /threads/new` stamps the thread with the creator's `userId`.
- **RLS Check**: Confirmed `rls_enabled: true` for `mastra_threads` and `mastra_messages`. 

### Phase 2: Test Strategy
- **Sad Path 1 (Impersonation)**: Simulate a request from User B to `GET /messages` for a Thread ID owned by User A. **Expected**: 403 Forbidden.
- **Sad Path 2 (Anonymity)**: Request from unauthenticated user. **Expected**: 401 Unauthorized at BFF level.
- **Sad Path 3 (System Failure)**: Railway agent timeout during hydration. **Expected**: UI displays "Unable to load history" but allows fresh chat.
- **Verification Plan**:
    - **Unit**: Mock `Memory` in `ThreadStore.test.ts` to verify 403 logic for cross-user Access.
    - **Integration**: `integration/rio-memory.test.ts` to check BFF -> Agent end-to-end flow with valid/invalid tokens.
    - **E2E**: Playwright test in `RioChatSheet.e2e.ts` verifying history appears after page refresh.

### Phase 3: Performance Assessment
- **Indexing Audit**: Confirmed `mastra_messages` is indexed by `(thread_id, createdAt DESC)` and `mastra_threads` is indexed by `(resourceId, createdAt DESC)`. This will efficiently support the new `resourceId = userId` scoping.
- **Hydration Bottleneck**: Fetching full thread history of 100+ messages on every chat open could cause UI jank and high Railway usage.
- **Mitigation**: Implement a default `limit: 20` for history hydration in the BFF. Provide a "Load More" mechanism if the user scrolls up (out of scope for Phase 1, but should be supported by BFF API).

### Phase 4: Documentation Plan
- **Technical Reference**: Create `docs/02-technical/rio-agent/memory-architecture.md` explaining:
    - Thread namespacing (`tenantId:threadId`).
    - `resourceId` mapping to `userId`.
    - Server-authoritative thread lifecycle.
- **API Reference**: Update `docs/02-technical/api/api-reference.md` with specifications for:
    - `POST /api/v1/ai/threads/new`
    - `GET /api/v1/ai/threads/messages?threadId=...&limit=20`
- **Documentation Gaps**: Updated `docs/documentation_gaps.md` to track these missing files.

### Phase 5: Strategic Alignment & Sign-off
- **Issue 249 Alignment**: Verified that `resourceId` usage aligns with the "Resident-First" priority. Memory is now strictly private.
- **Issue 251 Alignment**: Verified that server-authoritative IDs prevent the "Client-Authoritative" anti-pattern.
- **Constraints**: No violations of the Purple Ban or Template Ban. The UI redesign in `RioChatSheet` uses custom Vanilla CSS and follows the glassmorphic aesthetic.
- **Security Check**: RLS is confirmed active. BFS (Backend-First-Security) is upheld by moving all thread logic to the BFF.

**Conclusion**: The technical review of issues 249, 250, and 251 is complete. The architecture is verified as secure, performant, and aligned with Nido standards.

---
🏁 **[REVIEW COMPLETE - SIGN-OFF READY]**
Proceeding to create the Implementation Plan...
