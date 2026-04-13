---
title: AI Ingestion Pipeline
description: Document parsing, chunking, embedding — full pipeline patterns
categories: [ai, ingestion, pipeline]
sources: [log_2026-03-20_rio_llamaparse_integration.md, log_2026-03-20_rio_structure_aware_chunker.md, log_2026-03-20_documents_bucket.md, log_2026-03-17_supabase_admin_refactor.md]
---

# AI Ingestion Pipeline

## Pipeline Stages

```
Document Upload → LlamaParse → Structure-Aware Chunking → Embedding → Vector Store
```

## Stage 1: Document Fetch

Fetch from Supabase Storage with tenant isolation:

```typescript
const { data } = await supabase.storage
  .from('documents')
  .download(`${tenantId}/${documentId}/${filename}`);
```

## Stage 2: LlamaParse

Markdown output preserves header hierarchy:

```typescript
const result = await llama.parse(fileBuffer, {
  output: 'markdown'  // Preserves H1/H2 for chunker
});
```

## Stage 3: Structure-Aware Chunking

Key patterns:

### Hierarchy Breadcrumbs
Each chunk prefixed with breadcrumb path:

```
H1 Title > H2 Title: chunk content
```

### Table Row Atomicity
Treat each table row as atomic chunk with header context:

```
Table: Fee Schedule | Row: $50 monthly fee
```

### Token Budget
- 512-token soft limit per chunk
- 50-token overlap for recursive splits
- Character approximation: 4 chars/token

## Stage 4: Embedding

Model: `openai/text-embedding-3-small` (1536 dimensions)

⚠️ Critical: pgvector dimension must match model exactly. Gemini uses 768 dimensions.

## Stage 5: Storage

Chunk schema:

```sql
CREATE TABLE rio_document_chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  tenant_id UUID NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1536)
);
```

---

## Key Lessons

### 1. Embedding Dimension Strictness

pgvector is strict. Mismatched dimension causes silent failures:

```sql
-- Correct: 1536 for text-embedding-3-small
embedding vector(1536) NOT NULL
```

### 2. Idempotent Processing

Delete existing chunks before re-processing:

```sql
DELETE FROM rio_document_chunks WHERE document_id = p_document_id;
INSERT INTO rio_document_chunks ...;
```

### 3. Storage Path Isolation

Use folder-level isolation:

```
tenants/{tenant_id}/documents/{document_id}/{filename}
```

### 4. Status Lock Prevention

Use atomic upserts to prevent race conditions:

```sql
UPDATE rio_documents SET status = 'processing' 
WHERE id = p_id AND status = 'pending';
```

---

## Related

- [server-actions](../patterns/server-actions.md)
- [supabase-concurrency](../patterns/supabase-concurrency.md)