source: requirement
imported_date: 2026-04-08
---
# [Brainstorm] Issue 197: Source citation UI (document name + chunk excerpt per response)

## Problem Statement
For transparency and trust, residents need to know which official community documents were used to generate the AI assistant's answers.

## User Persona
- **Residents**: Needs confidence that the AI is using official sources and wants a path to verify the original document.

## Context
When the RAG tool is used, the agent returns metadata containing the `document_name` and relevant `excerpt`. The UI must neatly render this list below Río's message bubbles (as small cards or a collapsible section).

## Dependencies
- Epic #161: Río AI — Sprint 3: Chat Interface
- Issue #180: RioChatSheet (where the messages render).
- Issue #193: RioAgent on Railway (must provide the metadata).

## Technical Options
### Option A: Append to Markdown String
- **Pros**: Extremely simple. Agent just prints `[Source: Rules.pdf]`.
- **Cons**: Flaky, UI cannot style it gracefully as clickable cards.
- **Effort**: Low
### Option B: Stream Data Annotations via AI SDK
- **Pros**: Clear separation of data and text. The frontend receives JSON metadata arrays enabling rich UI rendering.
- **Cons**: Requires syncing the Mastra tool output through the BFF stream logic.
- **Effort**: Medium
### Option C: Separate API call for Context
- **Pros**: Simple stream.
- **Cons**: Subject to race conditions and inaccurate contexts.
- **Effort**: High

## Recommendation
**Option B (Stream Data Annotations)**. We can intercept the tool call results on the BFF and send them as message annotations using the Vercel AI SDK data protocol.
- **Priority**: P1
- **Size**: S
- **Horizon**: Q2 26

---

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue Details**: Display `document_name` and `excerpt` below Río responses.
- **Impact Map**:
    - `components/ecovilla/chat/RioChatSheet.tsx`: Update to render citations.
    - `app/api/v1/ai/chat/route.ts`: Ensure metadata is propagated in the SSE stream.
- **Historical Context**: New UI requirement for RAG transparency.
- **Handoff**: 🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...

### Phase 1: Vibe & Security Audit
- **Vibe Check**: Citations should feel native to the chat, using subtle "Source" tags or a small card grid.
- **Privacy**: The `excerpt` must pass through the `PatternRedactor` before being served to the client if there's any risk of PII in the source documents.
- **Validation**: Ensure `document_name` is escaped before rendering.
- **Handoff**: 🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Malformed Metadata**: If the agent returns citations as a string instead of JSON, the UI should fail gracefully (hide citations) rather than crash.
    - **Long Excerpts**: Truncate excerpts in the UI to prevent huge bubbles.
- **Test Plan**:
    - **Visual Regression**: Compare chat bubbles with and without citations.
    - **E2E Test**: `e2e/rio-chat-citations.spec.ts`. Verify that asking a specific community question results in the correct document name appearing as a source.
- **Handoff**: 🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...

### Phase 3: Performance Assessment
- **Analysis**: Rendering citations after streaming avoids layout thrashing during the text generation phase.
- **Handoff**: 🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...

### Phase 4: Documentation Plan
- **UI Design**: Document the "Citation Component" in the frontend library.
- **Gap Logging**: Logged missing mobile responsive mockups for the citation card layout in `docs/documentation_gaps.md`.
- **Handoff**: 🔁 [PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...

### Phase 5: Strategic Alignment & Decision
- **Context**: Issue #197 is essential for RAG transparency. It should be implemented as part of the core chat bubble work in Issue #180.
- **Sizing**: **S**. Purely a frontend rendering task once the BFF stream format is defined.
- **Decision**: **Prioritize**. Ready for development for Sprint 11.
- **Issue Link**: [Issue #197](https://github.com/mjcr88/v0-community-app-project/issues/197)

✅ [REVIEW COMPLETE] Issue #197 is now **Ready for development**.
