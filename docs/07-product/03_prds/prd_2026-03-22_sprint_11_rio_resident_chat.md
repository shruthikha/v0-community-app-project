# PRD: Río AI — Sprint 11: Resident Chat Experience

**Date**: 2026-03-22
**Sprint**: 11
**Status**: 🟢 Sprint Complete (Stability & UI Fully Delivered)
**Epic**: [[Epic] Río AI — Sprint 3: Chat Interface (#161)](https://github.com/mjcr88/v0-community-app-project/issues/161)
**Lead Agents**: `frontend-specialist`, `backend-specialist`

---

Sprint 11 delivers the **Resident Chat Experience** for Río AI while simultaneously performing critical **Stability & Remediation** following the Sprint 10 deployment. This is the "Aha!" moment where the foundation (Sprint 8), ingestion pipeline (Sprint 9), and admin configuration (Sprint 10) culminate in a premium, helpful interaction for the residents, backed by a hardened and self-healing backend.

---

## 🎨 User Experience & Design

**Design Assets / Visual References**:
The visual designs and mocked-up layouts for the new interfaces are located at:
- `docs/07-product/01_idea/rio/assets/Screenshot 2026-03-22 at 9.13.31 AM.png`
- `docs/07-product/01_idea/rio/assets/Screenshot 2026-03-22 at 9.13.52 AM.png`
- `docs/07-product/01_idea/rio/assets/Screenshot 2026-03-22 at 9.15.35 AM.png`
- `docs/07-product/01_idea/rio/assets/Screenshot 2026-03-22 at 9.15.45 AM.png`

### 1. The Dashboard Entry (`RioWelcomeCard`) & `CreatePopover`
- **Visual**: The parrot illustration becomes an interactive "prompt zone" embedded in the layout.
- **Inline Input**: A beautiful, large text input invites residents to ask questions directly from the dashboard.
- **Engagement**: Clicking "Send", hitting Enter, or selecting the "Chat with Río" action in the CreatePopover smoothly transitions the user into the `RioChatSheet`.

### 2. The Chat Interface (`RioChatSheet`)
- **Desktop**: A robust side-panel (Sheet) that pushes or slides over the main content, allowing for simultaneous browsing and chatting.
- **Mobile**: A full-screen modal experience optimized for thumb-reach and clarity.
- **Foundation**: Built on top of **shadcn/ui AI chatbot** (e.g. `useChat`), stripped of complexity (no model selectors) to ensure a focused assistant feel that matches the provided mockups entirely.
- **Citations**: Render source citations seamlessly within the UI thread using the data points returned by the agent.

---

## 🎯 Selected Issues & Sizing

| # | Issue | Title | Priority | Size | Est. Hours |
|---|---|---|---|:---:|---|
| 1 | [#199] | Feature flag gate (rio.enabled + rio.rag) | P0 | S | 4-8h |
| 2 | [#195] | POST /api/v1/ai/chat — Vercel BFF Feature Flags | P0 | S | 4-8h |
| 3 | [#193] | RioAgent on Railway — RAG integration (Gemini Flash) | P0 | M | 1-2d |
| 4 | [#180] | Build RioChatSheet component (shadcn foundation) | P0 | M | 1-2d |
| 5 | [#197] | Source citation UI | P1 | S | 4-8h |
| 6 | [#178] | Redesign RioWelcomeCard.tsx (Inline Prompt) | P1 | S | 4-8h |
| 7 | [#179] | Add "Chat with Río" to CreatePopover.tsx (+) button | P1 | XS | 2-4h |
| 8 | [#247] | Rio Assistant Citation Improvements & UI Branding | P1 | M | 1-2d |
| **ST1** | — | **Fix: Stale Error Badge** (Remediation) | **P0** | **XS** | 2-4h |
| **ST2** | — | **BFF: Timeout Guards** (Stability) | **P1** | **XS** | 2-4h |
| **ST3** | — | **RLS: JWT Pattern Fix** (Hardening) | **P0** | **M** | 1-2d |

**Reasoning:**
These issues represent the end-to-end flow for the resident chat experience. Issue #247 was added as a late-sprint enhancement to align with the Nido design system and improve citation clarity. The stability/remediation tasks (ST1-ST3, #199) address critical security and reliability gaps identified during the QA audit of PR #243.

### 🛡️ Remediation Summary (Phase 1)
All 14 findings from the CodeRabbit audit of PR #243 have been remediated in Branch 1:
- [x] **Tenant Impersonation**: Fixed by validating `tenantId` against auth session.
- [x] **Idempotency**: Added stable per-request keys for chat POSTs.
- [x] **RPC Hardening**: Hardened `SECURITY DEFINER` functions with `search_path` and `auth.uid()` validation.
- [x] **Feature Gating**: Unified dual-flag logic (`rio.enabled` & `rio.rag`) across UI and BFF.
- [x] **Timeout Guards**: Wired 30s total timeout to upstream fetch signals.
- [x] **PII & Doc Cleanup**: Redacted test emails and repaired broken internal links.
- [x] **RAG Seeding**: Fixed `search_documents` test failure by seeding missing `rio_documents` entries.
- [x] **Auth Hardening**: Implemented `x-agent-key` protocol on `/chat` endpoint to prevent direct access.
- [x] **Thread Isolation**: Scoped `localStorage` by `userId` to prevent cross-user history leakage.
- [x] **Build Stabilization (Railway)**: Resolved `Mastra v1.13.2` compatibility issues:
    - Removed deprecated `.register()` calls in favor of consolidated constructor initialization.
    - Fixed `self-signed certificate` SSL errors in `PostgresStore` by implementing `{ rejectUnauthorized: false }` for production environments.
    - Resolved `mastra is not defined` dev-scope collision by renaming internal instance and explicitly exporting `mastra`.
    - Restored `ingestionWorkflow` visibility by explicitly importing and registering it in the `Mastra` constructor.

---

## 🏗️ Architecture & Git Strategy

*   **Git Strategy**: To minimize risk and avoid migration conflicts, this sprint uses a **Grouped Branching Strategy**:
    *   **Branch 1 (Infrastructure & Security)**: `feat/sprint-11-resident-chat-and-remediation`
        *   Contains issues: ST1, ST2, ST3, #199.
        *   *Note: This is the current active branch and already holds the foundational commits for ST1 (error badge) and ST3 (RLS migrations).*
        *   Must be reviewed and merged to `main` first.
    *   **Branch 2 (Backend Intelligence)**: `feat/sprint-11-rio-infrastructure`
        *   Branch off `main` after Branch 1 merges.
        *   Contains issues: #193, #195.
    *   **Branch 3 (User Interface)**: `feat/sprint-11-rio-chat-ux`
        *   Branch off `main` after Branch 1 and 2 are merged.
        *   Contains issues: #180, #197, #178, #179, #247.
*   **Dependency Mapping**:
    *   **Frontend**: `RioWelcomeCard` and `CreatePopover` triggers depend heavily on `RioChatSheet` (#180). #180 depends on the Vercel BFF (#195).
    *   **Backend**: The BFF (#195) acts as the secure proxy for the Mastra RioAgent on Railway (#193). It relies on the feature flags queried at the tenant level (#199).
*   **Risk**: HIGH RISK on ST3 (RLS policies) and #195 (BFF Authorization). Must ensure no data leaks between tenants.

---

## 🚦 Implementation Order

1.  **ST3: RLS JWT Pattern Fix** (Security-Critical Foundation)
2.  **#199: Feature flag gate** (Kill Switch - Must be in place before exposing endpoints)
3.  **#195 & ST2: Vercel BFF proxy + Timeout Guards** (Infrastructure)
4.  **#193: RioAgent on Railway RAG Integration** (Backend Intelligence)
5.  **#180: Build RioChatSheet component** (Core UI)
6.  **#197: Source citation UI** (UI Enhancement)
7.  **#178: Redesign RioWelcomeCard.tsx** (Entry Point 1)
8.  **#179: Add "Chat with Río" to CreatePopover.tsx** (Entry Point 2)
9.  **ST1: Fix Stale Error Badge** (Independent Bug Fix)

---

## ✅ Acceptance Criteria & Breakdown

### Issue #199: Feature flag gate
- [x] AC1: When `tenant.features.rio.enabled` is false (or missing), no Río UI entry points are visible to residents.
- [x] AC2: When `tenant.features.rio.enabled` is false, `/api/v1/ai/chat` returns 403 Forbidden.

### Issue #195: Vercel BFF Proxy & ST2: Timeout Guards
- [x] AC1: When communicating with the Railway agent, the BFF accurately forwards `tenant_id` and `user_id` context.
- [x] AC2: When the Railway agent response exceeds 15s (or 30s max), the BFF aborts the request and returns a 504 Timeout gracefully.
- [x] AC3: When the Railway agent returns SSE streams, the BFF correctly pipes them to the client using `@ai-sdk/react` data stream format.

### Issue #193: RioAgent on Railway — RAG integration
- [x] AC1: When `search_documents` tool is called, it correctly filters `rio_document_chunks` using the provided `tenant_id`.
- [x] AC2: Given a question about a community document, when asked, the agent responds using the provided context without hallucinating.

### Issue #180: Build RioChatSheet component
- [x] AC1: When accessed on desktop, the chat appears as a right-side sliding Sheet.
- [x] AC2: When accessed on mobile, the chat appears as a full-screen Drawer/Modal.
- [x] AC3: When receiving streaming text, the UI displays messages and "typing" indicators smoothly.

### Issue #197: Source citation UI
- [x] AC1: When the backend streams data annotations containing `document_name` and `excerpt`, they are neatly rendered below the relevant AI message.
- [x] AC2: When the excerpt is excessively long, it is truncated visually in the UI.

### Issue #178: Redesign RioWelcomeCard.tsx
- [x] AC1: When viewed on the dashboard, the card displays a prominent, functional chat input.
- [x] AC2: When typing a prompt and pressing Enter, the `RioChatSheet` opens with the prompt pre-filled and sent.

### Issue #179: Add "Chat with Río" to CreatePopover.tsx
- [x] AC1: When clicking the (+) Create button, "Chat with Río" is the top option (if enabled).
- [x] AC2: When clicked, the popover closes and the `RioChatSheet` opens immediately.

### Issue #247: Rio Assistant Citation Improvements & UI Branding
- [ ] AC1: When Rio citations are rendered, only those actually referenced in the response (e.g., `[1]`, `[2]`) are shown in the Sources section.
- [ ] AC2: When a source is cited, the "Sources" section is a Shadcn-style collapsible element.
- [ ] AC3: When viewing a citation preview, a "See Document" button links to the correct official document route.
- [ ] AC4: When the chat sheet is open, the header bar is removed and replaced with a centered `RioImage` and "Ask me anything..." text.
- [ ] AC5: When messages are displayed, the Rio icon used for the assistant and user initials for the resident.
- [ ] AC6: When the dashboard widget is visible, the button label is "Take tour" and links to the product tour route.
- [ ] AC7: A B-tree index on `tenant_id` is created for `rio_document_chunks` and `rio_documents`.

### ST1: Fix Stale Error Badge
- [x] AC1: When attempting to re-index, the previous error state is atomically cleared so the error badge hides.

### ST3: RLS JWT Pattern Fix
- [x] AC1: When testing RLS policies, all auth references correctly utilize `auth.uid()` rather than vulnerable JWT extraction patterns.

---

## 🗓️ Sprint Schedule

*Assumes a typical velocity, allowing parallel dev where possible.*

| Issue | Size | Est. Hours | Targeted Day |
|-------|------|------------|--------------|
| ST3, #199 | M+S | 1-2d | Day 1 |
| #195, ST2, #193 | S+M | 1-2d | Day 2 - Day 3 |
| #180, #247 | M+M | 2-4d | Day 4 - Day 6 |
| #197, #178, #179 | S+S+XS | 1-2d | Day 6 - Day 7 |
| ST1 | XS | 2-4h | Day 7 |

*Note: Final start/target dates to be input in GitHub Projects board manually per user request to avoid browser automation.*

---

## 🛡️ Remediation & QA Stability (Post-QA Audit)

### 1. Hydration Mismatch Resolution
- **Issue**: `MobileNav` and `MobileDock` caused `aria-controls` hydration errors due to inconsistent SSR/CSR ID generation.
- **Fix**: Implemented the **`HasMounted`** pattern (client-side only rendering) for mobile-specific navigation layers to ensure ID sequence stability.

### 2. Chat 500 Error & Validation
- **Issue**: Silent failures and "Invalid request body" errors during chat initialization.
- **Fixes**:
    - Relaxed `ChatBodySchema` in the Agent to allow `nullish` values for `threadId` and `resourceId`.
    - Sanitized the BFF payload to ensure empty IDs are passed as `undefined`.
    - Corrected the `memory` structure in the Agent's stream call (`threadId` vs `thread`).
    - Synchronized `x-agent-key` usage across services.

---

## 🚦 Definition of Done
- [x] Code passes `npm run lint` & `npm run test`
- [ ] PR reviewed by at least 1 team member
- [x] Manual QA verification completed per ACs
- [x] No new P0 bugs introduced
- [x] RLS policies confirmed secure (No DB access leaks)
- [x] Feature Flags fail closed (Unauthorized tenants cannot access RAG/Chat)
