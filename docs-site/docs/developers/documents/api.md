---
title: API & Logic
sidebar_label: API
---

# Official Documents API

The Official Document feature is powered by Server Actions for both administrative management and resident-facing data fetching.

## Administrative Actions

Located at: `app/actions/documents.ts`

### `upsertDocument(documentData)`
Creates or updates a document.
- **Logic**: Handles both initial creation and updates. If a document is updated, it does NOT automatically re-trigger AI indexing to prevent unnecessary compute costs.
- **AI Sync**: Clearing or updating a document will optionally remove its associated records from `rio_documents` if the status changes to `draft`.

### `deleteDocument(documentId)`
Hard deletes a document record and its associated metadata.
- **Cleanup**: Automatically deletes related records in `document_reads` and `rio_documents` via cascade or manual cleanup calls.

---

## Resident Actions

Located at: `app/actions/resident-documents.ts`

### `getDocuments(tenantId)`
Fetches the list of published documents for the current resident's community.
- **Read State Mapping**: Automatically joins with `document_reads` for the current `auth.uid()` to return an `is_read` boolean for each document.
- **Ordering**: Prioritizes `is_featured: true` documents, followed by `updated_at` descending.

---

## AI Ingestion Pipeline

Documents are ingested into Río's knowledge base via the [Admin Documents Table](../../guides/admin/documents.md#ai-indexing).

### Ingestion Trigger
When an admin clicks "Add to knowledge base":
1. The document content (HTML or PDF data) is sent to the AI ingestion worker.
2. A record is created in `rio_documents` with `source_document_id`.
3. The table polls for status updates from `rio_documents`.

### Ingestion Logic (Rio Agent)
The ingestion process utilizes:
- **LlamaParse**: For high-fidelity PDF parsing.
- **Mastra**: For workflow orchestration and vector storage.

:::tip
Always check the `is_ai_indexed` flag in the document metadata to verify if the document is being reflected in Río's chat responses.
:::
