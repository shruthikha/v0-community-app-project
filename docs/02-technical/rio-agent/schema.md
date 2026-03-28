# Rio Agent - Schema Documentation

The Rio Agent service uses Supabase (Postgres) for both vector storage and session memory.

## Knowledge Base Schema

### Table: `rio_documents`
Stores document metadata and lifecycle status.

| Column | Type | Description |
| --- | --- | --- |
| `id` | `UUID` (PK) | Unique identifier |
| `tenant_id` | `UUID` | Isolation |
| `source_document_id` | `UUID` (FK) | Link to `public.documents` |
| `name` | `TEXT` | Display name |
| `status` | `TEXT` | `pending`, `processing`, `processed`, `error` |
| `file_path` | `TEXT` | Path in `documents` bucket |
| `error_message` | `TEXT` | Last error encountered |
| `embedding_model` | `TEXT` | Model used for indexing (e.g. `text-embedding-3-small`) |
| `tenant_id` | `UUID` | Isolation |

### Performance Indices
To ensure high-performance semantic search even as the database grows, the following indices are maintained:

1. **Vector Index (`rio_chunks_embedding_idx`)**: HNSW index on `embedding` (Cosine Similarity).
2. **Tenant Performance Index**: B-tree index on `tenant_id` for `rio_documents` and `rio_document_chunks`. This ensures O(log n) pre-filtering by community.

### Table: `rio_document_chunks`
Stores embedded document chunks for semantic search.

| Column | Type | Description |
| --- | --- | --- |
| `id` | `UUID` (PK) | Unique identifier |
| `tenant_id` | `UUID` | Denormalized for pre-filtering |
| `document_id` | `UUID` (FK) | Reference to `rio_documents` |
| `content` | `TEXT` | The raw chunk text |
| `embedding` | `vector(1536)` | text-embedding-3-small vector |
| `metadata` | `JSONB` | Additional context |

**Index**: `rio_chunks_embedding_idx`
- **Type**: HNSW
- **Metric**: Cosine Similarity
- **Config**: `m=16, ef_construction=128` (Optimized for production recall)

## Conversation Schema

Río uses custom tables for conversation history with hardened RLS.

### Table: `rio_configurations`
+Stores per-tenant and per-user assistant settings.
+
+| Column | Type | Description |
+| --- | --- | --- |
+| `tenant_id` | `UUID` (PK) | Isolation |
+| `prompt_community_name` | `TEXT` | Property display name |
+| `prompt_persona` | `TEXT` | Assistant tone (e.g., friendly, professional) |
+| `prompt_language` | `TEXT` | Default interaction language |
+| `emergency_contacts` | `TEXT` | Property-specific contact info |
+| `community_policies` | `TEXT` | General community rules |
+| `sign_off_message` | `TEXT` | Post-answer signature |
+| `preferred_model` | `TEXT` | Target LLM |
+| `metadata` | `JSONB` | Extensibility |
+
+### Table: `rio_threads`
| Column | Type | Description |
| --- | --- | --- |
| `id` | `UUID` (PK) | Unique identifier |
| `tenant_id` | `UUID` | Multi-tenant isolation |
| `user_id` | `UUID` | Owner of the thread |
| `last_active_at` | `TIMESTAMPTZ` | Temporal relevance |

### Table: `rio_messages`
| Column | Type | Description |
| --- | --- | --- |
| `id` | `UUID` (PK) | Unique message identifier |
| `thread_id` | `UUID` (FK) | Reference to `rio_threads` |
| `role` | `TEXT` | `user`, `assistant`, `tool` |
| `content` | `TEXT` | Message text or tool calls |
