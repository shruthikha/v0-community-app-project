---
title: Document Ingestion
description: Admin trigger, source_document_id FK, status badges
categories: [ai, ingestion, admin]
sources: [requirements_2026-03-20_rio_s4_0_documents_bucket.md, requirements_2026-03-20_rio_s4_2_ingest_trigger.md, requirements_2026-03-20_rio_s4_3_ingest_status_badge.md]
---

# Document Ingestion

## Manual Trigger Pattern

Admins manually trigger ingestion via UI:

```typescript
// Admin clicks "Add to knowledge base"
const triggerIngest = async (documentId: string) => {
  await fetch('/api/v1/ai/ingest', {
    method: 'POST',
    body: JSON.stringify({ source_document_id: documentId })
  });
};
```

## Source-Document Link

```sql
-- FK links AI records to source documents
ALTER TABLE rio_documents 
ADD COLUMN source_document_id UUID REFERENCES documents(id);
```

## Status Badge States

| Status | Badge | Action |
|--------|-------|--------|
| Not Indexed | Gray | "Add to knowledge base" |
| Pending | Spinner | Auto-poll |
| Processed | Green ✅ | "Re-index" |
| Error | Red 🔴 | "Retry" |

---

## Related

- [rio-ai-pipeline.md](../patterns/rio-ai-pipeline.md)