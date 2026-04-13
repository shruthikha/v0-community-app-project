source: requirement
imported_date: 2026-04-08
---
# Requirements: Río AI — Conversation Continuity & History

**Status**: 🟠 Draft (Phase 1: Definition)
**Date**: 2026-03-28
**Sprint**: 12
**Epic**: [[Epic] Río AI — Sprint 5: Agent Memory (#163)](https://github.com/mjcr88/v0-community-app-project/issues/163)
**Issues**: #256, #257, #258, #260

---

## 1. Problem Statement

Currently, Rio's chat sessions are fragile and client-side driven. When a resident refreshes their browser or returns after a break, the conversation context is often lost or requires complex persistence logic in the UI. There is no way for residents to browse past conversations or manually start a "clean slate" while preserving Rio's learned knowledge about them.

We need a server-authoritative session model that uses Mastra's native memory layers to provide a seamless, multi-session experience.

## 2. User Persona

- **Resident**: Wants to ask Rio questions about their community, return later to follow up, and see a history of what was discussed previously. They expect Rio to remember their name and preferences but also want a "New Chat" option for fresh topics.

## 3. Context & Dependencies

### Current Implementation Context
- `RioChatSheet.tsx` currently manages `threadId` via `localStorage` and a primitive `threads/active` fetch.
- `useChat` from `@ai-sdk/react` handles the real-time stream via `/api/v1/ai/chat`.
- The Railway agent handles RAG but doesn't yet have `workingMemory` or `semanticRecall` fully configured with `resourceId = userId`.

### Internal Dependencies
- **Issue #163 (Epic)**: Parent container for all memory work.
- **Issue #250, #251, #252**: Core foundational fixes for `resourceId` and server-driven threads.
- **PRD**: `docs/07-product/03_prds/prd_2026-03-26_sprint_12_rio_memory.md` is the primary source of truth.

### External Dependencies
- **Mastra SDK**: Native support for `workingMemory`, `semanticRecall`, and `autoTitle`.

## 4. Requirement Details

### 4.1. Session Management (Inactivity & Multi-Tab)
- **15-Min Timeout**: A session is defined as 15 minutes of inactivity.
- **Expiry Check**: On chat open, if the `lastActivityAt` > 15 mins, a new thread is generated via `POST /api/v1/ai/threads/new`.
- **Multi-Tab Sync**: `localStorage` changes for `activeThreadId` must be listened to across tabs to ensure consistency.
- **Device Sync**: If a user switches devices, the timer resets, but they can pick up the active thread if within the 15-min window (BFF to manage TTL).

### 4.2. Auto-Titling
- **Timing**: Trigger Mastra's `autoTitle` generation *after* Rio's first response to the first user message in a new thread.
- **Persistence**: Titles must be saved in Mastra's thread metadata and be queryable via the history list.

### 4.3. Conversation History UI
- **Entry Point**: A "See previous chats" button in the chat header or footer.
- **List View**: Paginated list (5 per page) showing thread title, date, and a snippet of the last message.
- **Resumption**: Clicking a past thread loads its full message history and sets it as the active `threadId`.

### 4.4. Manual Reset ("Start New Chat")
- **Behavior**: Clears the current message list and creates a new server-side thread ID.
- **Memory Persistence**: Rio's `workingMemory` (facts learned) and `semanticRecall` (similarity search over old threads) must remain active and transparent.

## 5. Documentation Gaps

- **Architecture**: Need a sequence diagram for the thread recreation flow (`docs/02-technical/flows/rio-thread-lifecycle.md`).
- **API**: Missing documentation for `GET /api/v1/ai/threads` (list) and `POST /api/v1/ai/threads/new`.
- **Privacy**: RLS policy documentation for Mastra storage in Supabase is currently missing.

---

## 6. Technical Options (Ideation)

### Option 1: Mastra-Native Client-Side Management (Lightweight)
Focus on using `localStorage` for the 15-min timer and Mastra's client-side `threadId` management.
- **Implementation**: `RioChatSheet.tsx` manages a `lastActivityAt` timestamp in `localStorage`. On component mount, if the diff is > 15m, it calls a simple `threads/new` BFF proxy.
- **Pros**: Minimal backend changes; low latency for session checks.
- **Cons**: Sub-optimal multi-device sync (relying entirely on local state); logic leakage into UI components.
- **Effort**: S (Small)

### Option 2: Server-Authoritative Session BFF Middleware (Robust)
Move the session logic to the BFF (`/api/v1/ai/chat`) and a dedicated session service.
- **Implementation**: The BFF checks a `sessions` table (or uses Redis/KV if available, otherwise a Supabase `user_sessions` table) to verify TTL. If expired, the BFF automatically starts a new thread in the background before processing the message.
- **Pros**: Strong multi-device consistency; UI stays "dumb" and focused only on display; handles multi-tab race conditions server-side.
- **Cons**: Requires a new database table or more complex Redis logic; slight overhead on every chat request.
- **Effort**: M (Medium)

### Option 3: Event-Driven Hybrid (Optimized)
Combine client-side timer for immediate UI feedback with server-side validation.
- **Implementation**: Client tracks the 15-min window for UI resets (closing the list). However, the BFF validates the `threadId` on every request. If the backend sees the thread is "stale" (based on its own DB timestamp), it returns a specific `THREAD_EXPIRED` error, forcing the client to re-sync or create a new one.
- **Pros**: Best balance of UX (instant load) and consistency (server validation); leverages Mastra's own metadata for staleness if possible.
- **Cons**: Complex error handling in `useChat` hook; requires two round-trips if a thread expires during a message send.
- **Effort**: M (Medium)

---

## 7. Recommendation (Product Owner)

### Selected: Option 3 (Event-Driven Hybrid)
We recommend the **Hybrid** approach for its superior balance of user experience and security.
- **Why**: Residents expect the chat list to be updated instantly when they close/open the sheet. Relying on a client-side 15-min check provides this immediate UI feedback. However, for security and multi-device consistency, the BFF must be the ultimate authority. By having the BFF validate the `threadId` status on each request, we ensure that a resident cannot "force" a stale thread to stay alive indefinitely.
- **Key Implementation Pivot**: We will use Mastra's internal thread metadata to store a `last_activity_at` server-side timestamp, reducing the need for a custom Supabase session table.

### Mandatory Metadata
- **Priority**: P1 (Core Sprint 12 Goal)
- **Size**: L (Large - Covers Frontend UI, BFF logic, and Agent Memory configuration)
- **Horizon**: Q1 2026

---

**Next Steps**: Move to Phase 4 (User Review) to approve these requirements before updating the GitHub issues.
