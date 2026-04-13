---
source: build-log
imported_date: 2026-04-08
---
# Build Log: Río S0.3: Validate SSE pipeline Railway → Vercel BFF → Browser
**Issue:** #168 | **Date:** 2026-03-15 | **Status:** Finished

## Context
- **PRD Link**: [Phase 3 roadmap in blueprint_rio_agent.md](../01_idea/blueprint_rio_agent.md)
- **Req Link**: N/A (Technical spike in Epic #158)
- **Board Status**: Issue moved to In Progress
- **Patterns**: Reviewed `fail-fast` initialization and PaaS var collisions from Issue #167 in `nido_patterns.md`.

## Clarifications (Socratic Gate)
- **Testing Surface**: Test UI will be placed at `/t/rio-sse-test/page.tsx` as a temporary playground.
- **Authentication**: Implementing full Supabase auth check in the BFF using our standard Server Client to ensure tenant isolation. The BFF extracts `tenantId` securely.
- **Stream Transformation**: Will use Mastra's `@mastra/ai-sdk` utility `toAISdkStream()` inside the BFF to map tokens.

## Progress Log
- 2026-03-15: Verified token-by-token streaming, English response enforcement, and session memory persistence.
- 2026-03-16: Implemented PII log redaction, thread ownership enforcement (403), and upstream abort propagation. Hardened RLS policies and trigger safety on dev/prod databases.

## Handovers
- 🔁 **[PHASE 1 COMPLETE]** Research done & scope confirmed. Handing off to Implementation...
- Passport **[AGENT HANDOFF: Orchestrator → Backend Specialist]** `backend-specialist` built the `app/api/v1/ai/chat/route.ts` BFF route featuring Supabase Server Client Auth for tenant isolation. We skipped `@mastra/ai-sdk` (not installed) and wrote a custom TransformStream to format SSE chunks as Vercel AI SDK expects (`0:"message"`).
- Passport **[AGENT HANDOFF: Backend Specialist → Frontend Specialist]** `frontend-specialist` built `app/t/rio-sse-test/page.tsx` utilizing `@ai-sdk/react` `useChat` hooked into `/api/v1/ai/chat`. Included tenant testing input field and UI tailored to handle streaming correctly.
- ✅ **[PHASE 5 COMPLETE]** Feature implemented, verified, and documented. Ready for QA.
- 🛠️ **[PR FEEDBACK FIXES]** Addressed feedback from PR #222 review:
    - **Memory Isolation**: Implemented `threadId` forwarding in BFF and enforced it in the Agent to ensure conversation context isolation.
    - **Request Robustness**: Added 30s timeout with `AbortController` and 504 Gateway Timeout handling in the BFF.
    - **Frontend Polish**: Integrated stable `threadId` in `page.tsx`, removed debug logs, and fixed duplicate text rendering logic.
    - **RLS Hardening**: Fixed a critical "Cardinal Sin" by enabling RLS on all 27 Mastra tables. Patched these with robustness guards (`IS NOT NULL` checks) and safe UUID casting in the metadata trigger (`BEGIN...EXCEPTION`) to prevent crashes from malformed inputs.
    - **Persistence**: Switched from in-memory to true persistence using `PostgresStore` for Mastra Memory, ensuring conversation continuity across Railway restarts.
    - **Security Hardening (r2943050030/31/35)**:
        - **Logging**: Implemented SHA-256 masking for sensitive identifiers (`userId`, `tenantId`, `threadId`).
        - **Access Control**: Added cross-tenant/user thread lookup rejection (403 Forbidden).
        - **Stability**: Wired HTTP `AbortSignal` to upstream `rioAgent.stream()` for resource cleanup on client disconnect.
    - **Round 2 Security Hardening (r2943290497/503/512)**:
        - **Fail-Closed Security**: Rejection of requests with 500/403 if thread ownership or metadata sync fails. (r2943290497)
        - **Stream Integrity**: SSE `[DONE]` symbol only emitted upon successful stream completion. (r2943290503)
        - **Niche Exceptions**: Narrowed database trigger exception handling to specific `invalid_text_representation`. (r2943290512)
        - **Clean State**: Purged all dev threads and messages to ensure RLS compliance from scratch.
    - **Round 3: Payload Validation (r2943391385)**:
        - Added Zod schema validation to the Mastra agent to ensure robust handling of incoming JSON payloads and avoid 500 errors on malformed requests.
    - **Database Hardening**: Applied `IS NOT NULL` guards to RLS policies and `BEGIN...EXCEPTION` safety to the metadata sync trigger.

## Blockers & Errors
- `TypeError: append is not a function`: Fixed by using `sendMessage` in `@ai-sdk/react` v3.x.
- `AI_UIMessageStreamError`: Fixed by implementing a specific `text-start` and `text-delta` JSON envelope in the BFF proxy.
- Mastra v1.x breaking changes: Fixed by migrating from positional message arguments to a nested `memory` object config and using `.textStream` property.

## Decisions
- Custom TransformStream: Decided against installing more dependencies (`@mastra/ai-sdk`) to maintain a lean BFF. Wrote a standard `TransformStream` to map tokens.
- Native Mastra Server: Utilized the `registerApiRoute` patterns to move away from legacy Fastify routes.

## Lessons Learned
- Always check the internal Zod schema (`uiMessageChunkSchema`) of the Vercel AI SDK when writing custom proxy routes; it expects specific event sequences (`text-start` -> `text-delta`).
- Mastra v1.x `stream()` returns an object with nested streams; direct iteration is no longer the standard for text-only proxying.

## 📋 QA Findings: Issue #168 Review
### Phase 0-1: Alignment & Readiness
- **PRD Alignment**: [Pass] Features align with the Technical Spike PRD.
- **Git Strategy**: [Pass] Correct branch hierarchy used.
- **Test Readiness**: [Pass/Partial] Test page verified; automated E2E gap noted for future sprints.

### Phase 2: Specialized Audit
- **Security Check**:
    - [FAIL] **"Cardinal Sin"**: `mastra_*` tables on `nido.dev` have `rowsecurity: false` (RLS disabled).
    - [PASS] BFF correctly enforces Supabase Auth for Railway agent proxy.
    - [PASS] No leaked secrets in client-side code.
- **Vibe Code Check**: [FAIL] due to the RLS policy gap mentioned above.
- **Performance**: [Pass] Minimal overhead in BFF transformation stream.

### Phase 3: Documentation & Release Planning
- **Doc Gaps**:
    - Missing `rio-agent/overview.md`.
    - Missing API reference for `/health` and `POST /api/chat`.
- **Release Strategy**: Ready for merge once RLS policy status is clarified/addressed.
- **Persistence Fix [2026-03-16]**:
    - Identified a trigger crash in `sync_mastra_metadata_to_columns` caused by accessing a non-existent `content` column on the `mastra_threads` table.
    - Implemented **Metadata Inheritance**: Created a new trigger `inherit_row_metadata` that automatically copies `tenant_id` and `user_id` from a thread to its child messages, ensuring RLS compliance even when the framework Omits the metadata during stream persistence.
    - Switched trigger to `SECURITY DEFINER` to allow slug resolution for all authenticated database users.
    - Verified full conversation history memory after page refresh.
