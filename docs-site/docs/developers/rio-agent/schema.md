# Río AI Agent: Data Model

The técnico-functional implementation of Río AI relies on several tables to manage its 3-tier prompt model, 3-layer memory architecture, and RAG ingestion state.

## Core Tables

### 1. `rio_configurations`
Stores the Tier 2 prompt context (Persona & Tone) configured by tenant admins.

| Column | Type | Description |
|---|---|---|
| `tenant_id` | `uuid` | Primary Key. References `tenants.id`. |
| `prompt_community_name` | `text` | The name used by the agent to address the community. |
| `prompt_persona` | `text` | Deep description of the admin's desired persona/identity. |
| `tone` | `text` | Tone of voice (e.g., "Professional yet warm"). |
| `community_policies` | `text` | Community guidelines the agent must enforce. |
| `emergency_contacts` | `text` | Explicit contacts to provide when urgency is detected. |
| `sign_off_message` | `text` | Custom signature or closing phrase. |
| `preferred_model` | `text` | AI model override (defaults to OpenRouter defined). |
| `created_at` / `updated_at` | `timestamptz` | Audit timestamps. |

---

### 2. `rio_documents`
Tracks the state of documents ingested into the RAG (Retrieval Augmented Generation) pipeline.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key. |
| `tenant_id` | `uuid` | References `tenants.id`. |
| `name` | `text` | User-friendly document title. |
| `file_path` | `text` | Path to the source file in Supabase Storage. |
| `status` | `text` | Ingestion state: `pending`, `completed`, `error`. |
| `source_document_id` | `uuid` | Reference to the original community document if applicable. |
| `error_message` | `text` | Details if the ingestion failed. |
| `embedding_model` | `text` | Model used for vectorization. |

---

### 3. `rio_threads`
Manages AI conversation sessions, acting as a Nido-layer wrapper around Mastra threads to enforce tenant and user isolation.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key. |
| `tenant_id` | `uuid` | References `tenants.id`. Enforces multi-tenancy. |
| `user_id` | `uuid` | References `users.id`. Enforces resident isolation. |
| `mastra_thread_id` | `text` | The unique ID used by the Mastra framework. |
| `metadata` | `jsonb` | Contextual flags (e.g., specific journey stage). |

---

### 4. `rio_messages`
Stores the actual chat history for each thread, linked to the `rio_threads` wrapper.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key. |
| `thread_id` | `uuid` | Reference to `rio_threads.id`. |
| `role` | `text` | `user`, `assistant`, or `system`. |
| `content` | `text` | The message body. |
| `metadata` | `jsonb` | Citation details, tool call logs, etc. |

---

### 5. `mastra_resources`
Acts as the **Working Memory** (Recall tier) for the agent, providing persistence across thread transitions.

| Column | Type | Description |
|---|---|---|
| `id` | `text` | Unique identifier (resource name). |
| `workingMemory` | `text` | Serialized JSON containing current "facts" known about the user. |
| `tenant_id` / `user_id` | `uuid` | Scoping for resident-specific memory retrieval. |
| `updatedAt` | `timestamp` | Used to invalidate memory if older than the pruning threshold. |

---

### 6. `user_memories`
Stores extracted "Durable Memories" (Facts) learned about residents through their interactions.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key. |
| `tenant_id` | `uuid` | References `tenants.id`. |
| `user_id` | `uuid` | The resident this memory relates to. |
| `memory_type` | `text` | Categorization (e.g., `preference`, `fact`, `task`). |
| `content` | `text` | The learned information. |
| `metadata` | `jsonb` | Confidence scores or source thread IDs. |

## Relationships

- **Tenant Isolation**: All tables contain a `tenant_id` to ensure data sovereignty.
- **Resident Privacy**: Conversations and personal facts are strictly isolated via `user_id`.
- **Mastra Lifecycle**: `mastra_threads` and `mastra_messages` are managed by the Mastra framework but hard-scoped via database logic in the BFF.
