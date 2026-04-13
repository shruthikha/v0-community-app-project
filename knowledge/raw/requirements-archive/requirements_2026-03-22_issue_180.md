source: requirement
imported_date: 2026-04-08
---
# [Brainstorm] Issue 180: Build RioChatSheet component (bottom sheet / side panel)

## Problem Statement
A dedicated UI component is needed to host the rich chat interaction with Río. It needs to handle both mobile and desktop form factors gracefully and support message streaming.

## User Persona
- **Residents**: Interacts directly with the chat interface. Expects a modern, smooth, "app-like" chat experience.

## Context
The foundation is the `shadcn/ui` AI chatbot, simplified to avoid unnecessary controls (no model selectors or voice).
- **Desktop**: A side-panel (drawer) sliding from the right.
- **Mobile**: A full-screen modal overlay.
- It must integrate with `useChat` and display message lists with custom parrot icons for Río's messages.

## Dependencies
- Epic #161: Río AI — Sprint 3: Chat Interface
- Issue #195: POST /api/v1/ai/chat — Vercel BFF (backend stream endpoint).

## Technical Options
### Option A: Unified `shadcn/ui` Dialog
- **Pros**: Single component for all Viewports.
- **Cons**: Doesn't slide from the side on desktop.
- **Effort**: Low
### Option B: Responsive `Sheet` (Desktop) + `Drawer` (Mobile)
- **Pros**: Native feel on mobile (pull to close); elegant slide-out on desktop.
- **Cons**: Requires `vaul` drawer library and conditional rendering based on media queries.
- **Effort**: Medium
### Option C: Custom Absolute Overlay
- **Pros**: Full control over animations.
- **Cons**: Have to reinvent accessibility features (Focus trapping, escape keys).
- **Effort**: High

## Recommendation
**Option B (Sheet + Drawer)**. This provides the premium "app-like" experience expected in the PRD.
- **Priority**: P0
- **Size**: M
- **Horizon**: Q2 26

---

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue Details**: Build `RioChatSheet.tsx` using a responsive Sheet/Drawer pattern.
- **Impact Map**:
    - `components/ecovilla/chat/RioChatSheet.tsx`: New core component.
    - `hooks/use-rio-chat.ts`: New state management hook.
    - `components/ui/sheet.tsx` & `components/ui/drawer.tsx`: UI foundations.
    - `components/library/rio-image.tsx`: For Río's avatar.
- **Historical Context**: New implementation.
- **Handoff**: 🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...

### Phase 1: Vibe & Security Audit
- **Vibe Check**: Follows "Backend-First". The component must only communicate with the `/api/v1/ai/chat` BFF. No client-side API keys or direct model access.
- **Zero Policy**: Thread and message retrieval must be scoped by `tenant_id` and `user_id` on the server.
- **Citations**: Ensure source citation links are validated before rendering to prevent XSS if content is malicious (though RAG sources are internal).
- **Handoff**: 🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Streaming Timeout**: Handle cases where the BFF takes too long to respond.
    - **Unauthorized**: Handle session expiry mid-chat.
    - **Empty RAG**: Gracefully show "I couldn't find specific info but..." if no chunks are returned.
- **Test Plan**:
    - **Unit Test**: `RioChatSheet.test.tsx` mocking `useChat` and verify message rendering.
    - **E2E Test**: `e2e/rio-chat-flow.spec.ts`. Verify end-to-end RAG flow with mocked agent response.
- **Handoff**: 🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...

### Phase 3: Performance Assessment
- **Analysis**: Streaming messages can be JS-intensive. Use efficient list rendering.
- **Animations**: Use `framer-motion` or CSS transitions for the "typing" dot animation to keep the main thread free.
- **Handoff**: 🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...

### Phase 4: Documentation Plan
- **Components**: Document `RioChatSheet` in the technical documentation.
- **Flows**: Create a sequence diagram for: Resident -> BFF -> Railway -> pgvector -> Railway -> BFF -> Resident.
- **Gap Logging**: Logged missing sequence diagram for RAG flow to `docs/documentation_gaps.md`.
- **Handoff**: 🔁 [PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...

### Phase 5: Strategic Alignment & Decision
- **Context**: Issue #180 is the foundational component for the entire resident chat experience. It must be prioritized to unblock dashboard and popover integrations.
- **Sizing**: **M**. Involves responsive design (Sheet/Drawer) and complex streaming state management.
- **Decision**: **Prioritize**. Ready for development for Sprint 11.
- **Issue Link**: [Issue #180](https://github.com/mjcr88/v0-community-app-project/issues/180)

✅ [REVIEW COMPLETE] Issue #180 is now **Ready for development**.
