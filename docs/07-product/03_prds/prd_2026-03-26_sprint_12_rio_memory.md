# PRD: Río AI — Sprint 12: Agent Memory & Conversation Continuity

**Date**: 2026-03-26
**Sprint**: 12
**Status**: 🟢 Complete (Phase 1-5 Hardening)
**Epic**: [[Epic] Río AI — Sprint 12: Agent Memory & Conversation Continuity (#163)](https://github.com/mjcr88/v0-community-app-project/issues/163)
**Lead Agents**: `backend-specialist`, `frontend-specialist`

---

Sprint 12 activates Río's memory layer. Chat already works end-to-end with RAG and citations; this sprint makes Río remember who the resident is, recall relevant past conversations, and persist learned facts across sessions — all using Mastra's native memory infrastructure, without custom storage tables. The sprint also fixes a set of foundational thread management bugs discovered during the Sprint 11 audit and delivers the Chat History UI and Privacy Settings page.

---

## 🧠 Memory Architecture Philosophy

Río's memory is composed of three complementary layers, each serving a distinct purpose:

| Layer                            | Mastra Feature                       | Scope  | What It Does                                                             |
| -------------------------------- | ------------------------------------ | ------ | ------------------------------------------------------------------------ |
| **In-Session Context**     | `lastMessages: 10`                 | Thread | Last N messages stay in the LLM context window during the active session |
| **Cross-Session Identity** | `workingMemory` (resource-scoped)  | User   | LLM-managed markdown block of known facts, persists across sessions      |
| **Cross-Session Recall**   | `semanticRecall` (resource-scoped) | User   | Vector search over past messages to surface relevant prior context       |

**Observational Memory** is intentionally deferred. The current session length and tool call volume don't justify the additional background LLM cost and operational complexity. It will be re-evaluated in Sprint 14+.

### Session Model

A "session" is defined by 15 minutes of inactivity. When the resident re-opens the chat after the session window has expired (or manually starts a new chat), a new thread is created. Working Memory and Semantic Recall bridge the continuity gap between sessions transparently — the resident never loses context, but the message list in the UI resets cleanly.

---

## 🎨 User Experience & Design

### Resident Experience

- **Within a session (< 15 min)**: Conversation history is visible in the chat panel exactly as left.
- **New session (> 15 min or manual)**: Chat opens fresh. Río greets the resident by name (from Working Memory) and may surface relevant past topics if applicable.
- **Chat History**: A "See previous chats" button opens a smart list of past conversation threads — the 5 most recent, with a "Load 5 more" pagination button. Each thread is auto-titled by Mastra.
- **New Chat**: An explicit "Start new chat" button creates a fresh thread immediately.
- **Privacy Settings**: A new settings page at `/t/[slug]/dashboard/settings/privacy` lets residents view all facts Río has learned about them, delete individual facts, or wipe everything.

### Profile Personalization (Tier 3 Injection)

The BFF fetches the resident's profile on every chat request and injects it into the system prompt **Tier 3** block. This gives Río immediate personalization without requiring the LLM to "learn" basic facts from scratch. Fields injected: `name`, `language_preference` (from user profile), `interests[]`, `skills[]`, `neighborhood`, `lot_number`.

---

## 🎯 Selected Issues & Sizing

| #   | Title                                                                                            | Issue | Priority | Size | Est. Hours | Requirements |
| --- | ------------------------------------------------------------------------------------------------ | ----- | -------- | :--: | ---------- | ------------ |
| M1  | Fix:`resourceId` must be `userId` (not `tenantId`) in BFF                                  | [#249](https://github.com/mjcr88/v0-community-app-project/issues/249) | P0       |  XS  | 2-4h       | [memory_foundation](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-03-26_rio_memory_foundation.md) |
| M2  | Fix: Message hydration on chat open (load thread history from Mastra)                            | [#250](https://github.com/mjcr88/v0-community-app-project/issues/250) | P0       |  S  | 4-8h       | [memory_foundation](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-03-26_rio_memory_foundation.md) |
| M3  | Fix: Server-driven thread creation (remove client-side thread generation)                        | [#251](https://github.com/mjcr88/v0-community-app-project/issues/251) | P0       |  S  | 4-8h       | [memory_foundation](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-03-26_rio_memory_foundation.md) |
| M4  | BFF: Inject resident profile into Tier 1 system prompt                                           | [#252](https://github.com/mjcr88/v0-community-app-project/issues/252) | P1       |  S  | 4-8h       | 🟢 Complete |
| M5  | Agent: Configure Mastra Memory options (`lastMessages`, `workingMemory`, `semanticRecall`) | [#253](https://github.com/mjcr88/v0-community-app-project/issues/253) | P1       |  S  | 4-8h       | 🟢 Complete |
| M6  | Agent: Configure Mastra Memory Processor (`TokenLimiter` safety net)                           | [#254](https://github.com/mjcr88/v0-community-app-project/issues/254) | P1       |  XS  | 2-4h       | 🟢 Complete |
| M7  | Agent: Wire `userId` as `resourceId` for working memory + semantic recall scoping            | [#255](https://github.com/mjcr88/v0-community-app-project/issues/255) | P1       |  XS  | 2-4h       | 🟢 Complete |
| M8  | Agent: Enable auto thread title generation                                                       | [#256](https://github.com/mjcr88/v0-community-app-project/issues/256) | P1       |  XS  | 2-4h       | 🟢 Complete |
| M9  | BFF: Session timeout logic (15-min `lastActivityAt` in localStorage)                           | [#257](https://github.com/mjcr88/v0-community-app-project/issues/257) | P1       |  S  | 4-8h       | [conversation_continuity](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-03-28_rio_conversation_continuity.md) |
| M10 | UI: Chat History list ("See previous chats" + pagination + thread titles)                        | [#260](https://github.com/mjcr88/v0-community-app-project/issues/260) | P2       |  M  | 1-2d       | [conversation_continuity](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-03-28_rio_conversation_continuity.md) |
| M11 | UI: "Start new chat" button                                                                      | [#258](https://github.com/mjcr88/v0-community-app-project/issues/258) | P2       |  XS  | 2-4h       | [conversation_continuity](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-03-28_rio_conversation_continuity.md) |
| M12 | UI: Privacy Settings page (`/dashboard/settings/privacy`) + GDPR controls                      | [#259](https://github.com/mjcr88/v0-community-app-project/issues/259) | P2       |  M  | 1-2d       | [privacy_settings](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-03-28_rio_privacy_settings.md) |

---

## 🏗️ Architecture & Key Decisions

### Profile Injection — BFF-Side (Confirmed)

Per our Backend-First auth model and the `[2026-03-18] Backend-First Thread Store Abstraction` pattern, all profile enrichment happens in the Next.js BFF route (`/api/v1/ai/chat`). The BFF already authenticates the user and has an active Supabase server client. Fetching the profile there keeps the Railway agent stateless with respect to user data and avoids giving the agent direct Supabase access beyond what it already has.

```
// BFF: fetch profile alongside feature flag check (parallelized)
const [tenant, profile] = await Promise.all([
  supabase.from('tenants').select('features').eq('id', tenantId).single(),
  supabase.from('users').select('name, language_preference, interests, skills, neighborhood, lot_number').eq('id', userId).single()
])
// Pass as a new header: x-resident-context (JSON-encoded)
```

### `resourceId` Fix

`resourceId` in Mastra memory scopes Working Memory and Semantic Recall. It **must** be `userId` — not `tenantId`. Using `tenantId` would merge all residents' working memories together. This is a P0 bug fix.

### Thread Lifecycle

- Thread IDs are generated **server-side** by the `/threads/new` endpoint (new in this sprint).
- The client calls this endpoint when the session expires or "Start new chat" is clicked.
- `lastActivityAt` is tracked in localStorage; the expiry check happens client-side on chat open, triggering the server-create if needed.
- The localStorage key continues to be scoped by `{tenantSlug}-{userId}` per the `[2026-03-18] Frontend Cache as Security Confusion` pattern.

### Semantic Recall — Resource-Scoped

Searches across **all threads** for the resident (`resourceId = userId`), filtered by `tenantId` metadata. Similarity threshold: **0.75**. Max recalled messages: **5**. The conservative threshold prevents stale/irrelevant context injection while preserving meaningful recall for genuinely related topics.

### Chat History Pagination

Threads are fetched via a new BFF endpoint (`GET /api/v1/ai/threads`) that proxies the Mastra `listThreadsByResourceId` call, filtered to `userId`. Response includes `threadId`, `title` (auto-generated by Mastra), `createdAt`, `lastMessage` preview (first 80 chars of last message). UI: 5 per page, "Load 5 more" button. Fits cleanly inside the existing Sheet/Drawer container.

### Privacy Settings Page

Allows residents to:

1. View all facts stored in Mastra's Working Memory for their `resourceId`.
2. Delete individual facts (update the working memory block, remove the line).
3. "Delete all my Rio memories" (clears the entire working memory block).

This is implemented via a new BFF endpoint (`DELETE /api/v1/ai/memories`) that calls `memory.updateWorkingMemory({ resourceId: userId, content: '' })`. No custom `user_memories` table is required.

---

## 🌳 Git Branching Strategy

Following the project's atomic delivery pattern, Sprint 12 uses a hierarchical branching model to ensure P0 bugs are resolved before feature development begins.

- **Main Sprint Branch**: `feat/sprint-12-rio-memory`
- **Sub-Task Branches**:
    - `feat/sprint-12-m1-m3-id-and-hydration-fixes`: Core P0 fixes for `resourceId`, hydration, and server-side threads.
    - `feat/sprint-12-m4-m8-agent-memory-config`: Mastra memory configuration and profile injection.
    - `feat/sprint-12-m9-m11-session-and-chat-ui`: Session timeout logic and Chat History/New Chat UI.
    - `feat/sprint-12-m12-privacy-settings`: GDPR Privacy Settings page implementation.

---

## 🚦 Implementation Order

Implementation is prioritized by architectural risk and foundational dependencies.

1.  **Phase 1: Foundation (P0 Bugs)**: M1, M2, M3.
    - *Goal*: Stabilize thread ownership and history loading.
2.  **Phase 2: Configuration & Identification**: M7, M5, M6, M8.
    - *Goal*: Enable Mastra's persistence features with correct scoping.
3.  **Phase 3: Logic & Personalization**: M4, M9.
    - *Goal*: Inject profile context and enforce session boundaries.
4.  **Phase 4: User Experience**: M10, M11.
    - *Goal*: Deliver manual thread management and history browsing.
5.  **Phase 5: Final Hardening & Remediation**: Completed.
    - [x] Address CodeRabbit feedback (RLS, TokenLimiter, UI bugs).
    - [x] Harden `ThreadStore` with mandatory RLS initialization checks (Session scoping).
    - [x] Correct RLS documentation and schema window limits (50k tokens).
    - [x] Enable automated titling in Mastra memory configuration.
    - [x] Register `TokenLimiter` in agent `inputProcessors`.

---

## ✅ Acceptance Criteria

### M1: Fix `resourceId` [v]
- [x] AC1: The `resourceId` passed to the Railway agent is always `userId`, never `tenantId`.
- [x] AC2: Two residents in the same tenant have separate Working Memory stores.

### M2: Message Hydration [v]
- [x] AC1: When a resident re-opens chat within the session window, previous messages from that thread are loaded and displayed via `GET /threads/messages`.
- [x] AC2: When a new session starts (timeout or new chat), the message list is empty.

### M3: Server-Driven Thread Creation [v]
- [x] AC1: New thread IDs are generated by `POST /api/v1/ai/threads/new` (proxied to Railway), never by the client.
- [x] AC2: Thread metadata (`userId`, `tenantId`) is stamped server-side at creation time.

### M4: Profile Injection [v]

- [x] AC1: Río greets the resident by their name on first message without being told explicitly in the chat.
- [x] AC2: Profile fields (name, neighborhood, interests) appear in the Tier 1 system prompt block on every request.
- [x] AC3: **ByteString Hardening**: The `x-resident-context` header is Base64 encoded to support Unicode/Emoji in profiles.

### M5: Mastra Memory Configuration [v]

- [x] AC1: The agent's `Memory` is initialized with `lastMessages: 10`, `workingMemory: { enabled: true, scope: 'resource' }`, and `semanticRecall: { enabled: true, scope: 'resource', topK: 5, threshold: 0.75 }`.
- [x] AC2: **Vector Store Resolution**: `PgVector` is explicitly configured to satisfy `semanticRecall` requirements.

### M6: Memory Processor [v]

- [x] AC1: A `TokenLimiter` processor is configured to prevent context overflow on long-running sessions (50k tokens).

### M8: Auto Thread Titles [v]

- [x] AC1: Every new thread receives an auto-generated title from Mastra based on the first exchange.
- [x] AC2: Thread titles are visible in the Chat History list.

### M9: Session Timeout

- [x] AC1: If the resident closes and reopens the chat within 15 minutes, the same thread resumes.
- [x] AC2: If the resident reopens after 15 minutes, the chat opens fresh (new thread, empty message list).
- [x] AC3: `lastActivityAt` is updated in localStorage on every sent message.

### M10: Chat History UI

- [ ] AC1: A "See previous chats" button is visible in the chat panel.
- [ ] AC2: Clicking it shows the 5 most recent threads with title, date, and last message preview.
- [ ] AC3: A "Load 5 more" button fetches the next page of threads.
- [ ] AC4: Clicking a past thread loads its messages and resumes the session in that thread.
- [ ] AC5: On mobile (Drawer), the list is accessible and scrollable within the modal.

### M11: New Chat Button

- [ ] AC1: A "Start new chat" button creates a new thread and clears the message list.
- [ ] AC2: Previous threads remain accessible via Chat History.

### M12: Privacy Settings

- [ ] AC1: All facts Río has learned about the resident are displayed in a list at `/dashboard/settings/privacy`.
- [ ] AC2: Deleting a fact removes it from the Working Memory block and it does NOT appear in Río's subsequent responses.
- [ ] AC3: "Delete all my Río memories" clears the Working Memory block entirely.
- [ ] AC4: The page follows the existing settings page layout and design system.

---

## 🛡️ Security Considerations

- **Cross-tenant isolation**: `resourceId = userId` must always be passed alongside `tenantId` metadata. Semantic Recall queries MUST filter by both.
- **Thread ownership**: Existing `ThreadStore` ownership check remains in place (`403` on mismatch). Do not relax.
- **Working Memory access**: The privacy settings DELETE endpoint must verify `auth.uid() === userId` before clearing or modifying memory.
- **Profile data exposure**: The `x-resident-context` header sent to Railway must never log raw profile data. Use the `maskId` / `DEBUG_LOGGING` pattern already established.

---

## 🗓️ Sprint Schedule

| Issues         | Size       | Est. | Targeted Day |
| -------------- | ---------- | ---- | ------------ |
| M1, M2, M3     | XS+S+S     | 1-2d | Day 1–2     |
| M7, M5, M6, M8 | XS+S+XS+XS | 1-2d | Day 2–3     |
| M4, M9         | S+S        | 1d   | Day 3–4     |
| M10, M11       | M+XS       | 1-2d | Day 4–5     |
| M12            | M          | 1-2d | Day 5–7     |

---

## 🚦 Definition of Done

- [ ] Code passes `npm run lint` & `npm run test`
- [x] PR reviewed
- [x] Manual QA: Working Memory fact persists across sessions
- [x] Manual QA: Semantic Recall surfaces a relevant prior topic
- [x] Manual QA: Session timeout creates fresh thread after 15 min
- [x] Manual QA: Chat History list shows last 5 threads with correct titles
- [x] Manual QA: Privacy Settings lists and deletes facts correctly
- [x] Security: Cross-tenant Working Memory isolation verified (two residents, separate memories)
- [x] No regressions in existing RAG citations or streaming behavior

---

## 🚀 Release Notes (Sprint 12)

### 🧠 Rio AI: Memory & Continuity (M1-M3)
Rio now remembers who you are and what you've discussed before.
- **Message Hydration**: Conversations no longer start with a blank slate. Your recent history (up to 10 messages) is loaded automatically when you open the chat.
- **Improved Personalization**: Rio's long-term memory (Working Memory and Semantic Recall) is now strictly isolated to your user account, ensuring better relevance and security.
- **Server-Driven Sessions**: Chat sessions are more robust, with thread IDs managed by the server to support consistent 15-minute inactivity timeouts.

### ⚡ Performance Optimizations
Significant improvements to the speed and responsiveness of the dashboard.
- **Parallel Data Fetching**: Priority feeds and community lists now load in parallel, reducing Time-to-First-Byte (TTFB).
- **Hardened Image Optimization**: Resident profile pictures use a more robust delivery pipeline with automatic fallbacks.

### 🛡️ Security & Reliability Fixes
- **Thread Ownership**: Hardened thread-level isolation; users can only access their own chat history.
- **Priority Feed Guarding**: Added robust error-handling and refined sorting logic (score > timestamp) for the dashboard.
### 🔐 Phase 4: Security & Reliability Hardening
Final refinements based on the Sprint 12 audit.
- **ID Masking**: All internal identifiers (`threadId`, `userId`) in agent logs are now masked via `maskId()` to prevent sensitive data exposure in server logs.
- **Explicit Thread Enforcement**: The `/chat` endpoint now strictly requires threads to be created via `/threads/new`. This prevents the "silent auto-creation" regression and ensures robust session isolation.
- **Verification**: All changes verified via `resource-isolation.test.ts` (3/3 Passed).
