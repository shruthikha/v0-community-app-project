# Río AI Agent: Security & Privacy

Security for Río AI is implemented through strict multi-tenant isolation, resident-specific data encryption/masking, and granular memory sovereignty controls.

## 1. Authorization & Access Control

Operational authorization is verified at the BFF (Backend-for-Frontend) layer before requests are passed to the Mastra engine.

| Persona | Feature Access | Enforcement |
|---|---|---|
| **Resident** | Chat, History, Memory Cleanup | JWT verification + `user_id` claim. |
| **Tenant Admin** | Persona Config, Doc Ingestion | RBAC: `is_tenant_admin` check. |
| **System** | Ingestion Pipeline | Service Role keys + internal VPC proxy. |

## 2. Multi-Tenant Isolation (RLS)

Strict **Row Level Security (RLS)** policies on the underlying Supabase tables ensure that data from one community never leaks to another.

### Database Scoping
Every query to `mastra_threads`, `mastra_messages`, and `rio_configurations` includes a `WHERE tenant_id = current_tenant_id` filter.
- **Pooled Connections**: The `initRls` utility in the thread store ensures that pooled database connections are scoped to the requesting tenant's context before execution.

### Resident Isolation
Resident data is further isolated using `user_id` claims. Even within the same community, a resident cannot view another resident’s chat history or working memory state.

## 3. Memory Sovereignty & Privacy

Río uses a **3-Layer Memory** architecture that prioritizes resident control and GDPR compliance.

### Working Memory Logic
- **SQL Fallback**: Working memory is persisted in `public.mastra_resources`. This prevents factual "forgetfulness" when users refresh their browser or switch threads.
- **Expiration**: Ephemeral session state is cleared after 1 hour of inactivity, while the working memory persists until explicitly modified or deleted.

### Historical Pruning (The "Right to be Forgotten")
Residents have full control over what the AI "remembers" via the **Privacy Page**.
- **Fact Deletion**: When a resident deletes a memory from their profile, the system triggers `redactHistoricalFact`.
- **Redaction Process**: 
  1. The fact is deleted from `user_memories`.
  2. Associated messages in `mastra_messages` are redacted (content replaced with `[DELETED]`).
  3. Related semantic chunks are removed from the vector store to prevent "Ghost Memories" during future RAG retrieval.

## 4. PII Data Handling

- **Logging**: Sensitive identifiers (tenant IDs, individual message IDs) are masked in server logs using `maskId()` (a HMAC-SHA256 one-way hash).
- **Transport**: Data passed between the BFF and the Railway-hosted agent is encrypted via HTTPS. Semantic context is Base64 encoded during transport to prevent intercept leaks.
- **Model Isolation**: OpenRouter is configured to not use resident data for training or fine-tuning of the underlying LLMs.
