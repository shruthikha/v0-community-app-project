source: requirement
imported_date: 2026-04-08
---
# [Brainstorm] Issue 195: POST /api/v1/ai/chat — Vercel BFF (JWT → forward + SSE stream)

## Problem Statement
The Vercel frontend needs to securely communicate with the Railway agent while strictly enforcing authorization and feature flags, protecting backend AI resources from abuse.

## User Persona
- **System/Backend**: Needs to act as a secure proxy and feature flag gatekeeper.

## Context
The endpoint `POST /api/v1/ai/chat` must verify `tenant.features.rio.enabled` and `tenant.features.rio.rag`. If disabled, it returns 403 Forbidden. Otherwise, it forwards correctly configured `tenant_id` and `user_id` as headers/context to the Railway agent and streams the SSE response back to the client. Needs robust timeout guards (15s/30s) to prevent hanging connections.

## Dependencies
- Epic #161: Río AI — Sprint 3: Chat Interface
- Issue #193: RioAgent on Railway (downstream dependency).

## Technical Options
### Option A: Standard Fetch Proxy
- **Pros**: Minimal dependencies.
- **Cons**: Manually handling SSE chunks is extremely error-prone and tedious in React.
- **Effort**: Medium
### Option B: `@ai-sdk/react` + `createDataStreamResponse`
- **Pros**: Out-of-the-box hooks (`useChat`), handles streaming robustly, supports sending tool metadata (citations).
- **Cons**: Need to adapt Mastra's stream to `ai-sdk` format.
- **Effort**: Medium
### Option C: Mastra Next.js SDK
- **Pros**: End-to-end framework alignment.
- **Cons**: May abstract away too much control for our custom auth and feature flags.
- **Effort**: Low

## Recommendation
**Option B (`@ai-sdk/react`)**. The existing `useChat` hook is unparalleled for frontend DX, and we can map Mastra's output to the DataStream format on the BFF. We'll generate/track `threadId` here to pass memory state to Mastra.
- **Priority**: P0
- **Size**: S
- **Horizon**: Q2 26

---

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue Details**: Implement BFF proxy with feature flag enforcement.
- **Impact Map**:
    - `app/api/v1/ai/chat/route.ts`: Core implementation.
- **Historical Context**: Mirrors `ai/ingest` logic but for streaming.
- **Handoff**: 🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...

### Phase 1: Vibe & Security Audit
- **Vibe Check**: "Backend-First" requires the BFF to be the final gatekeeper for AI spend and data access.
- **Authorization**: Must verify the user's `tenant_id` from their JWT (`app_metadata`) matches the context.
- **Feature Flags**: Query the `tenants` table for `features->'rio'->'enabled'` before proxying. Return 403 if disabled.
- **Handoff**: 🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Railway Down**: Return 502/504 gracefully.
    - **Flag Disabled**: Return 403.
    - **Invalid Stream**: Handle malformed JSON chunks from Railway without crashing the BFF.
- **Test Plan**:
    - **Integration Test**: `api-chat-proxy.test.ts` mocking `fetch` to Railway.
    - **E2E Test**: `e2e/rio-chat-auth.spec.ts`.
- **Handoff**: 🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...

### Phase 3: Performance Assessment
- **Analysis**: Edge runtime suitability should be evaluated to reduce latency.
- **Streaming**: Do not use `await response.json()`. Use `ReadableStream` to pipe immediately.
- **Handoff**: 🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...

### Phase 4: Documentation Plan
- **Status Codes**: 401 (Unauth), 403 (Rio Disabled), 504 (Agent Timeout).
- **Gap Logging**: Logged missing documentation for BFF-specific error codes and retry logic in `docs/documentation_gaps.md`.
- **Handoff**: 🔁 [PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...

### Phase 5: Strategic Alignment & Decision
- **Context**: Issue #195 is the security gatekeeper for the chat experience. It ensures only authorized residents with active feature flags can consume AI resources.
- **Sizing**: **S**. Logic is straightforward but requires careful SSE stream transformation to match Vercel AI SDK expectations.
- **Decision**: **Prioritize**. Ready for development for Sprint 11.
- **Issue Link**: [Issue #195](https://github.com/mjcr88/v0-community-app-project/issues/195)

✅ [REVIEW COMPLETE] Issue #195 is now **Ready for development**.
