source: idea
imported_date: 2026-04-08
---
# Río Agent: Detailed Requirements Breakdown

This document provides a granular breakdown of the specific requirements and tasks for each sprint of the Río Agent Epic. This guides the engineering and DevOps teams in scoping individual PRDs and Jira tickets.

---

## Sprint 1: RAG & Knowledge Retrieval

**Objective:** Build a reliable, multi-tenant knowledge ingestion and search pipeline.

### Functional Requirements

* **FR1.1: Admin Upload Dashboard:** React/Shadcn UI located at `/admin/rio/knowledge` allowing CSV, PDF, and DOCX uploads.
* **FR1.2: LlamaParse Pipeline:** Integration with LlamaParse for high-fidelity OCR and table extraction from community bylaws and minutes.
* **FR1.3: Mastra Ingestion Workflow:** A declarative Mastra Workflow that orchestrates document chunking, embeddings generation, and database inserts with built-in retries and state management.
* **FR1.4: Mastra PgVector Integration:** Configure Mastra's `@mastra/pg` `PgVector` class to perform similarity searches against Supabase, dynamically passing the user context to enforce `tenant_id` RLS.

### Non-Functional Requirements

* **NFR1.1: Database Performance:** HNSW indexing on vector columns to ensure search latency < 200ms for datasets up to 100k chunks.
* **NFR1.2: Parsing Fidelity:** 98%+ accuracy on extracting structured lists (quiet hours, parking rules) from standard PDFs.
* **NFR1.3: Scalability:** Support for 100+ documents per tenant with zero cross-tenant leakage.

### Engineering & DevOps Tasks

* **Infra:** Enable `vector` extension in Supabase and configure PostgreSQL roles.
* **Dev:** Implement file staging in Supabase Storage with TTL (auto-delete after parsing).
* **Dev:** Build the "Search Utility" in `@/lib/agents/tools/rag-retriever.ts`.

---

## Sprint 2: Web Chat UI & Agent API

**Objective:** Deploy the agent backend and create a premium streaming chat interface.

### Functional Requirements

* **FR2.1: Mastra Backend Server:** Standalone Node.js server on Railway exposing an authenticated `/api/chat` endpoint.
* **FR2.2: Streaming SSE Proxy:** Next.js Route Handler to proxy requests from Vercel to Railway, maintaining the streaming state for the frontend.
* **FR2.3: Assistant-UI Integration:** Implementation of `useChat` with custom generative UI blocks for "Thinking" states and search citations.
* **FR2.4: JWT Verification & RLS:** Railway backend must use `@supabase/auth-helpers-nextjs` logic to validate session tokens before executing tools.
* **FR2.5: Multi-Tier Prompt Compositor:** Function that securely builds the final system prompt. Tier 1 (Global Master) is set by Super Admins. Tier 2 (Admin Policies/Tone) is set by Tenant Admins via discrete UI fields.
* **FR2.6: Global Agent Settings (Backoffice):** A dedicated super-admin page to select global model providers, set API keys (Railway), and define the default master prompt.

### Non-Functional Requirements

* **NFR2.1: Interaction Latency:** Total Time-to-First-Token (TTFT) < 1.5s under standard US-East-1 network conditions.
* **NFR2.2: Mobile Parity:** Chat UI must respect `mobile-dock.tsx` safe areas and include bottom padding for the dock.
* **NFR2.3: Resilience:** Graceful handling of Railway service restarts and SSE connection drops.

### Engineering & DevOps Tasks

* **Infra:** Set up Railway project with service-to-service networking and environment variable sync.
* **Dev:** Implement `RioChatWidget` in `components/ai/`.
* **Dev:** Configure dynamic model routing (Gemini for fast chat, Sonnet for complex synthesis, DeepSeek/Grok via provider proxy).

---

## Sprint 3: Isolated Memory

**Objective:** Personalize responses across sessions without sacrificing privacy.

### Functional Requirements

* **FR3.1: Mastra Memory Integration:** Configure Mastra's native `Memory` class (Working Memory & Semantic Recall) to automatically manage short-term history and extract long-term entity facts into the `user_memories` table.
* **FR3.2: Retrieval Tooling:** Mastra tool that queries a user's local memory before generating responses to "remember" context.
* **FR3.3: Memory Management UI:** User-facing "Privacy Settings" allowing residents to see what Río remembers and delete specific facts.

### Non-Functional Requirements

* **NFR3.1: Fact Grounding:** LLM must only extract facts with >90% confidence score from the transcript (no hallucinations).
* **NFR3.2: Privacy Isolation:** Zero possibility for Resident A's memory to influence Resident B's agent responses.

### Engineering & DevOps Tasks

* **Infra:** Configure Redis (Upstash or Railway) for message history buffering before extraction.
* **Dev:** Implement the `user_memories` table with JSONB and vector columns.
* **Dev:** Build the "Memory Pruning" logic to prevent context window bloat.

---

## Sprint 4: Telegram Integration

**Objective:** Passively capture group knowledge to improve community-wide RAG.

### Functional Requirements

* **FR4.1: grammY Webhook Listener:** Supabase Edge Function to capture and deduplicate group messages.
* **FR4.2: Activity Log:** Tab in Admin UI showing community activity summaries without exposing raw PII.
* **FR4.3: Community Summarization:** Daily LLM job to turn 500+ daily messages into a cohesive "What's new" summary.

### Non-Functional Requirements

* **NFR4.1: Throughput Management:** Handle message bursts up to 50 msgs/second without dropping payloads.
* **NFR4.2: Data Minimization:** Raw Telegram messages purged after 90 days; only vector-embedded summaries kept permanently.

### Engineering & DevOps Tasks

* **Infra:** Register Telegram Bot and configure webhook security headers.
* **Dev:** Build the summarization trigger via `pg_cron` or Railway Scheduler.
* **Dev:** Implement "PII Scrubbing" middleware for Telegram logs.

---

## Phase 2: Operational Actions (Write Capabilities)

**Objective:** Transition Río from a retrieval-only assistant to an active participant in community operations via API/MCP integration.

### Functional Requirements

* **FR5.1: Action Tooling (Mastra):** Define strong-typed Mastra Tools for core Nido functions once API endpoints exist (e.g., `createEvent`, `rsvpToEvent`, `createMarketplaceListing`, `findResidentProfile`).
* **FR5.2: Human-in-the-Loop (HITL) UI:** Modify the Next.js `Assistant-UI` integration to support "Confirmation Cards". Before any state-mutating tool executes, the user must explicitly click "Approve" or "Cancel" in the chat interface.
* **FR5.3: MCP Server (Optional/Future):** Expose Nido's core business logic via a standard Model Context Protocol server, allowing Río (or external agents) to interact with the platform safely.
* **FR5.4: Permission Scopes:** Admin UI toggle switches controlling which "Actions" Río is allowed to perform for a specific tenant (e.g., allow RSVPs but deny Event Creation).
