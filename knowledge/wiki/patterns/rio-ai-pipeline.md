---
title: Río AI Pipeline
description: Document ingestion → RAG → Chat → Memory pipeline
categories: [ai, pipeline, rag]
sources: [prd_2026-03-19_sprint_8_rio_foundation.md, prd_2026-03-19_sprint_9_rio_ingestion.md, prd_2026-03-22_sprint_11_rio_resident_chat.md]
---

# Río AI Pipeline

## Architecture Overview

```
Document Upload → Storage → Ingestion → Vector Store → Chat Interface
                  (BFF)         (pgvector)      (Mastra)
```

## Pipeline Stages

### Stage 1: Foundation (Sprint 8)
- `rio_configurations` table — persona prompts
- `rio_documents` table — document metadata
- `rio_document_chunks` table — vector embeddings
- Feature flags in `tenants.features.$rio`
- Private storage bucket

### Stage 2: Ingestion (Sprint 9)
1. **Fetch** — Get file from Supabase Storage (signed URL)
2. **Parse** — LlamaParse to Markdown
3. **Chunk** — Structure-aware chunking (headers, tables)
4. **Embed** — Gemini-1.5-Embed-Text (1536 dims)
5. **Upsert** — Atomic to pgvector

### Stage 3: Admin (Sprint 10)
- Manual trigger "Add to knowledge base"
- Status badges: pending → processing → processed
- Re-index capability
- Delete cascade

### Stage 4: Chat (Sprint 11)
- Feature flags: `rio.enabled` + `rio.rag`
- Vercel BFF proxy
- Railway Mastra agent
- Citation rendering

## Feature Gating

Fail-closed dual-flag pattern:

```typescript
const canUseRio = tenant.rio?.enabled && tenant.rio?.rag;
if (!canUseRio) {
  return 403; // Block access
}
```

## Security

- Strict tenant isolation via RLS
- `search_path` hardenging in SQL functions
- Service role hygiene
- Injection filter on prompts

---

## Related

- [ai-ingestion-pipeline](../lessons/ai-ingestion-pipeline.md)
- [rag-citations](../lessons/rag-citations.md)