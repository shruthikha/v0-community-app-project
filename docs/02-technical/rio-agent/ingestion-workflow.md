# Río Agent: Ingestion Workflow

The Ingestion Pipeline is responsible for transforming raw community documents into semantic vector chunks suitable for RAG.

## Architecture
The pipeline is implemented as a **Mastra Workflow** in `packages/rio-agent/src/workflows/ingest.ts`. It follows a linear, step-based orchestration.

## Workflow Steps

### 1. File Retrieval (`fetchStep`)
- **Action**: Downloads the document blob from the **private** `documents` Supabase bucket using a relative path.
- **Authentication**: Uses `SUPABASE_SERVICE_ROLE_KEY` via the `downloadDocument` helper.
- **Security**: The bucket is strictly private. Residents only access files via **Signed URLs** generated on the server with short-lived expiries. This prevents document scraping and unauthorized enumeration.

### 2. Document Parsing (`parseStep`)
- **Service**: **LlamaParse** (LlamaIndex).
- **Strategy**: `high_accuracy` with Markdown output.
- **Capabilities**: Extracts text from PDFs while preserving structural elements like header hierarchies (`#`, `##`) and table data (`|`).
- **Resilience**: Retries up to 3 times on API timeouts.

### 3. Structure-Aware Chunking (`chunkStep`)
- **Logic**: Custom chunker in `src/lib/chunker.ts`.
- **Filename Randomization**: Each uploaded asset is renamed to `[type]-[documentId].[ext]` (e.g., `page-abc-123.html`) to prevent filename enumeration in storage.
- **Multi-Phase Split**:
    1. **Boundary Splitting**: Splits the Markdown by Top-Level Headers (H1/H2). This prevents a single chunk from merging two unrelated topics.
    2. **Atomic Tables**: Ensures table structures stay intact within a single chunk where possible.
    3. **Recursive Refinement**: Within large sections, applies a recursive character split (512 token target, 50 token overlap).
- **Metadata**: Each chunk inherits the `document_id` and `tenant_id`.

### 4. Embedding Generation (`embedStep`)
- **Model**: `openai/text-embedding-3-small` (1536 dimensions) via OpenRouter.
- **Batching**: Chunks are processed in batches of 50 to optimize network latency and respect rate limits.
- **Alignment**: Vectors are normalized to **1536 dimensions** to align with the `pgvector(1536)` schema.

### 5. Atomic Persistence (`upsertStep`)
- **Operation**: SQL RPC `upsert_rio_document_if_not_processing`.
- **Atomicity**: Uses `ON CONFLICT (source_document_id) DO UPDATE ... WHERE status <> 'processing'`. This ensures that parallel ingestion attempts for the same document are ignored if one is already active, preventing race conditions.
- **Validation**: The workflow includes a pre-persistence check that parsing resulted in non-empty Markdown and at least one chunk was generated. If these fail, the status is set to `error` with a descriptive message.


## Admin Interface & Controls
- **Manual Trigger**: Ingestion is an explicit admin action via the "Add to knowledge base" button. This prevents unintentional data exposure.
- **Status Polling**: The Admin UI uses real-time polling to reflect transition states: `pending` -> `processing` -> `processed` / `error`.
- **Re-indexing**: Admins can trigger a full re-index, which invokes the workflow with the same `document_id`, triggering the atomic upsert.

## 6. Document Cleanup
When a source document is deleted, all associated AI metadata and vector embeddings must be removed to prevent "zombie" search results.

### Hardened Deletion RPC
- **Function**: `delete_document_with_rio_cascade(p_document_id, p_tenant_id)`
- **Mechanism**: A `SECURITY DEFINER` Postgres function that atomically deletes from:
    1. `rio_embeddings` (vector chunks)
    2. `rio_documents` (pipeline metadata)
    3. `documents` (source record)
- **Security Check**: Mandatory `p_tenant_id` validation. The function strictly verifies that the document belongs to the specified tenant before executing any deletions. This prevents cross-tenant data destruction via ID manipulation.

## Storage Isolation
- **Bucket**: `documents`
- **Isolation Pattern**: Each tenant's files are stored in a folder named with their `tenant_id` (UUID).
- **RLS Enforced**: Storage RLS policies (using `storage.foldername(name)`) strictly limit `INSERT`, `UPDATE`, and `DELETE` operations to folders matching the user's `tenant_id` as recorded in `public.users`.
