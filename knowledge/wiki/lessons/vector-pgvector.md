---
title: Vector Store & pgvector
description: pgvector strictness, dimension mismatches, HNSW indexing
categories: [database, vector, ai]
sources: [log_2026-03-18_validate_embeddings.md, log_2026-03-19_rio_hnsw_index.md]
---

# Vector Store & pgvector

## Dimension Strictness

pgvector is strict. Mismatched dimension causes silent failures:

```sql
-- Correct: 1536 for text-embedding-3-small
CREATE TABLE rio_document_chunks (
  id UUID PRIMARY KEY,
  embedding vector(1536) NOT NULL
);
```

⚠️ Common issue: Gemini uses 768 dimensions, OpenAI uses 1536.

## Embedding Model Dimensions

| Model | Dimensions |
|-------|------------|
| Gemini (gemini-embedding-001) | 768 |
| OpenAI text-embedding-3-small | 1536 |
| OpenAI text-embedding-3-large | 3072 |

## HNSW Indexing

For better recall and speed:

```sql
CREATE INDEX idx_chunks_embedding 
ON rio_document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 128);
```

Parameters:
- `m = 16`: Connections per layer
- `ef_construction = 128`: Search width during build

## Lessons from Production

1. **Dimension Verification**: Always verify model output vs column definition early
2. **Mastra Compatibility**: `@mastra/pg` expects exact columns: `vector_id`, `embedding`, `metadata`
3. **Idempotent Seeds**: Use content-hashed IDs, not randomUUID, for re-runs

---

## Related

- [ai-ingestion-pipeline](./ai-ingestion-pipeline.md)