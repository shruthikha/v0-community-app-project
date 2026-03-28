# Rio Agent - Technical Overview

The Rio Agent is a specialized AI service built using **Mastra** to assist residents within the Nido community. It handles multi-tenant conversations and provides contextual answers via a RAG (Retrieval-Augmented Generation) pipeline.

## Core Capabilities

### 1. Multi-Tenant Isolation (Issue 169)
To ensure data privacy between different communities (tenants), Rio implements a "Backend-First" isolation strategy:
- **Auth Layer**: The BFF (Backend-for-Frontend) verifies the user's JWT and extracts the `tenant_id`.
- **Thread Storage**: Mastra is configured with a `PostgresStore` that strictly filters threads and messages by `tenant_id` and `user_id`.
- **Vector Search**: All embedding queries include a metadata filter for `tenant_id`.

### 2. RAG & Ingestion Lifecycle (Issue 160)
The assistant uses structure-aware retrieval to find relevant community information:
- **Embedding Provider**: **OpenAI** (via OpenRouter/Mastra).
- **Model**: `openai/text-embedding-3-small` (1536 dimensions).
- **Parsing**: **LlamaParse** (High-fidelity PDF-to-Markdown).
- **Vector Store**: `PgVector` (Supabase).
- **Process**:
    1. **Trigger**: Admin uploads doc to `documents` bucket and manually clicks "Add to knowledge base".
    2. **Fetch**: Agent downloads file via `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for processing. Note: The `documents` bucket is **private**. Readers access files via **Signed URLs** generated on the server with 1-hour expiries for secure iframe previews.
    3. **Parse**: LlamaParse converts to structured Markdown (headers/tables).
    4. **Chunk**: **Structure-aware chunker** respects H1/H2 boundaries and keeps tables atomic. Filenames are ingestion-randomized (e.g., `page-${documentId}.html`) to prevent enumeration.
    5. **Embed**: Batch generated (50/request) into 1536-dim vectors.
    6. **Upsert**: Atomic persistence via `upsert_document_chunks` RPC. **Seeding Requirement**: RAG requires an exact match in the `rio_documents` table (INNER JOIN) for citations to render correctly.
    7. **Status**: `rio_documents.status` updated to `processed` or `error`.

### 3. Resident Chat Experience (Issue 180)
Río provides a dedicated chat interface for residents:
- **Components**: `RioChatSheet` (responsive Sheet/Drawer) and `RioWelcomeCard` (dashboard entry).
- **State Management**: `use-rio-chat` Zustand store for global sheet visibility.
- **Hydration**: (Sprint 12) Support for **Message Hydration** upon opening the sheet. The BFF proxies the last 10 messages from Mastra's `listMessages` to prevent an empty state on session resume.
- **Thread Management**: (Sprint 12) **Server-Authoritative Threads**. Thread IDs are generated via `POST /api/v1/ai/threads/new` and associated with `userId` and `tenantId` metadata on creation.
- **Interactive Citations**: RAG sources are rendered as interactive Popovers.

### 4. Agent Instruction Logic
Río uses a 3-tier instruction system injected via the system prompt:
1. **Global Context**: Base instructions (Persona, Safety, Tool usage).
2. **Property Context**: Community-wide configurations (Emergency contacts, policies).
3. **Resident Context**: Personalized info (Name, Lot number, Interests) fetched via Supabase in the BFF and injected into the Tier 1 prompt.

### 5. Multi-Tenant Isolation & Security
- **BFF Gatekeeping**: Authenticated Admin-only triggers for ingestion.
- **Shared Secret**: `x-agent-key` (`RIO_AGENT_KEY`) verifies BFF-to-Agent communication.
- **Memory Scoping**: (Sprint 12) `resourceId` is strictly set to `userId`. This scopes Mastra's **Working Memory** and **Semantic Recall** to the individual resident, ensuring cross-session continuity without data leakage between users.
- **RLS Enforcement**: "Backend-First" security model.

## API Reference

### Health Check (Rio Agent)
`GET /health`

### New Thread (BFF)
`POST /api/v1/ai/threads/new`
Creates a server-authoritative thread and returns the `threadId`.

### Chat (BFF)
`POST /api/chat`
Main interaction endpoint.
**Payload**:
```json
{
  "messages": [...],
  "threadId": "uuid"
}
```
**Headers**:
- `x-tenant-id`: Required for multi-tenant isolation.
- `x-user-id`: Required for session tracking and user-scoped memory (resourceId).

### Configuration Check
`GET /config-check`
(Development Only) Verifies environment variables and connection strings.
