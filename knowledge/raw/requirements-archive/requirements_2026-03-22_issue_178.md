source: requirement
imported_date: 2026-04-08
---
# [Brainstorm] Issue 178: Redesign RioWelcomeCard.tsx with inline chat input

## Problem Statement
The current dashboard widget for Río is just a static illustration. We need to invite residents to interact directly with Río from the dashboard to improve engagement and reduce friction for asking questions.

## User Persona
- **Residents**: Needs an intuitive and obvious way to start a conversation with the community AI assistant.

## Context
As part of the Sprint 11 Resident Chat Experience, the entry point needs to be prominent, featuring a large inline text input. It preserves the existing parrot illustration. Entering text and sending should seamlessly transition the user to the chat sheet with their query pre-populated. Existing "Take Tour" and "Complete Profile" buttons must remain functional.

## Dependencies
- Epic #161: Río AI — Sprint 3: Chat Interface
- Issue #180: Build RioChatSheet component (Need the component to exist to trigger it from the card).

## Technical Options
### Option A: Global UI Context for ChatSheet Activity
- **Pros**: Clean, standardized React pattern; easy to share state with `CreatePopover`.
- **Cons**: Requires modifying the root provider tree.
- **Effort**: Low
### Option B: URL Query Parameters (`?chat=open&prompt=...`)
- **Pros**: Allows deep-linking to the chat state.
- **Cons**: Clutters the URL, harder to manage smooth opening animations.
- **Effort**: Low
### Option C: Zustand / Global Store
- **Pros**: State can be toggled without React context re-renders.
- **Cons**: Introduces a new state management pattern if not already used.
- **Effort**: Low

## Recommendation
**Option A (Global UI Context)**. It aligns well with typical Next.js layouts for side panels and allows passing initial prompts easily.
- **Priority**: P1
- **Size**: S
- **Horizon**: Q2 26

---

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue Details**: Redesign `RioWelcomeCard.tsx` to include an inline chat input. The input should trigger the `RioChatSheet` (to be built in #180).
- **Impact Map**:
    - `components/ecovilla/dashboard/RioWelcomeCard.tsx`: Primary target for redesign.
    - `app/t/[slug]/dashboard/page.tsx`: Parent page that renders the card.
    - `components/ecovilla/chat/RioChatSheet.tsx`: Dependency (new component).
    - `hooks/use-rio-chat.ts`: Likely need for a new hook to manage chat visibility and state.
- **Historical Context**: `RioWelcomeCard.tsx` is a relatively new component created during the initial dashboard layout. No major regressions found in its short history.
- **Handoff**: 🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...

### Phase 1: Vibe & Security Audit
- **Vibe Check**: `RioWelcomeCard.tsx` is a `"use client"` component. It currently follows "Backend-First" principles by only using `Link` for navigation. The new chat input must NOT trigger direct DB calls; it must interface with the `RioChatSheet` which calls the BFF.
- **Attack Surface**:
    - **Input Sanitization**: The chat input should handle special characters and long strings gracefully.
    - **Tenant Isolation**: The `slug` prop must be strictly used to ensure any subsequent chat requests are scoped to the correct community. Verified `middleware.ts` handles session/tenant context.
    - **Zero Policy**: Confirmed project uses Zero Policy architecture. No client-side RLS definitions needed.
- **Handoff**: 🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Empty Input**: User hits Enter without typing. Recommendation: Disable send button or show a subtle visual hint.
    - **Offline Mode**: User tries to send a prompt while offline. Recommendation: Show an offline toast.
    - **Prompt Length**: Handle extremely long strings without breaking the layout.
- **Test Plan**:
    - **Unit Tests**: Create `RioWelcomeCard.test.tsx` using Vitest/React Testing Library. Verify presence of input and "Send" button.
    - **E2E Tests**: Create `e2e/rio-chat-entry.spec.ts`. Test the full flow: Dashboard -> Type Prompt -> Hit Enter -> Chat Sheet Opens with prompt.
- **Handoff**: 🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...

### Phase 3: Performance Assessment
- **Schema Static Analysis**: `RioWelcomeCard` redesign doesn't change schema but impacts `rio_messages` and `rio_threads` (Sprint 8 foundation). Verified indexes exist on `tenant_id` and `user_id` for threads.
- **Bottlenecks**: Transition from card to sheet must be <100ms. Recommendation: Pre-fetch `rio` feature flag in dashboard layout to avoid layout shift.
- **Handoff**: 🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...

### Phase 4: Documentation Plan
- **User Manuals**: Update `docs/01-manuals/resident-guide/dashboard.md` to reflect the interactive chat entry.
- **Analytics**: Log new event `rio_chat_entry_dashboard` when Enter/Send is clicked.
- **API/Schema**: No changes required for this UI task.
- **Gap Logging**: Logged missing mobile layout screenshots to `docs/documentation_gaps.md`.
- **Handoff**: 🔁 [PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...

### Phase 5: Strategic Alignment & Decision
- **Context**: Issue #178 is a core part of the Sprint 11 "Resident Experience" focus. It provides the primary dashboard entry point for the new chat features.
- **Sizing**: **S** (Small). UI-heavy but logic is straightforward (context toggle).
- **Decision**: **Prioritize**. Ready for development for Sprint 11.
- **Issue Link**: [Issue #178](https://github.com/mjcr88/v0-community-app-project/issues/178)

✅ [REVIEW COMPLETE] Issue #178 is now **Ready for development**.
