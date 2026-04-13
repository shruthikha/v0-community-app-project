source: requirement
imported_date: 2026-04-08
---
# [Brainstorm] Issue 179: Add "Chat with Río" to CreatePopover.tsx (+) button

## Problem Statement
Users need a quick, globally accessible action from the floating Create (+) button to start a chat with Río at any time, regardless of what page they are on.

## User Persona
- **Residents**: Enjoys ubiquitous access to the assistant without needing to navigate back to the dashboard.

## Context
The `CreatePopover.tsx` currently holds actions like 'Create Post' or 'Report Issue'. 'Chat with Río' should be added as the first action here. Clicking it should close the popover and open the `RioChatSheet`. It must be hidden if `rio.enabled = false`.

## Dependencies
- Epic #161: Río AI — Sprint 3: Chat Interface
- Issue #199: Resident Feature Flag Gate (needed for hiding logic).
- Issue #180: Build RioChatSheet component.

## Technical Options
### Option A: Consume Global UI Context
- **Pros**: Identical integration to Issue #178; clicking the action just calls `openChat()`.
- **Cons**: None.
- **Effort**: Very Low
### Option B: Local State Handoff
- **Pros**: Kept within standard prop drilling.
- **Cons**: Gets messy across layout components.
- **Effort**: High
### Option C: Event Emitter
- **Pros**: Decoupled.
- **Cons**: Anti-pattern in modern React.
- **Effort**: Low

## Recommendation
**Option A (Global UI Context)**. This proves the value of the context provider established in #178.
- **Priority**: P1
- **Size**: XS
- **Horizon**: Q2 26

---

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue Details**: Add "Chat with Río" as the first action in `CreatePopover.tsx`.
- **Impact Map**:
    - `components/ecovilla/navigation/create-popover.tsx`: Target component.
    - `hooks/use-rio-chat.ts`: Dependency for opening the chat.
    - `components/ecovilla/chat/RioChatSheet.tsx`: Component to be opened.
- **Historical Context**: Component is stable; no recent regressions.
- **Handoff**: 🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...

### Phase 1: Vibe & Security Audit
- **Vibe Check**: Purely UI-driven. Adheres to "Backend-First" by using shared state to trigger the side panel. No direct DB interaction.
- **Attack Surface**: Minimal. Ensure the feature flag check is robust.
- **Handoff**: 🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...

### Phase 2: Test Strategy
- **Sad Paths**: 
    - Feature flag disabled: Action must not appear.
    - Double click: Ensure only one sheet instance/state change occurs.
- **Test Plan**:
    - **Unit Test**: Test `CreatePopover` with `rioEnabled` true/false mock.
    - **E2E Test**: `e2e/rio-chat-entry.spec.ts` (Shared with #178).
- **Handoff**: 🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...

### Phase 3: Performance Assessment
- **Analysis**: Minimal impact on bundle size and render time.
- **Handoff**: 🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...

### Phase 4: Documentation Plan
- **Analytics**: Log `rio_chat_entry_popover` on click.
- **Manuals**: Update general "How to use Río" guide mentioning both the dashboard and the (+) button.
- **Handoff**: 🔁 [PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...

### Phase 5: Strategic Alignment & Decision
- **Context**: Issue #179 provides a secondary, global entry point for the Río assistant. It is a key part of making the assistant ubiquitous throughout the app.
- **Sizing**: **XS**. Extremely low effort modification to an existing action list.
- **Decision**: **Prioritize**. Ready for development for Sprint 11.
- **Issue Link**: [Issue #179](https://github.com/mjcr88/v0-community-app-project/issues/179)

✅ [REVIEW COMPLETE] Issue #179 is now **Ready for development**.
