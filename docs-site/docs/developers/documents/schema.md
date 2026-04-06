---
title: Database Schema
sidebar_label: Schema
---

# Official Documents Schema

The Official Document feature relies on three primary tables in the `public` schema to manage resources, track resident interaction, and bridge to AI knowledge bases.

## `public.documents`

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key. |
| `tenant_id` | `uuid` | Foreign Key to `tenants`. |
| `category` | `enum` | One of: `regulation`, `financial`, `construction`, `hoa`. |
| `status` | `enum` | One of: `draft`, `published`, `archived`. |
| `document_type` | `enum` | One of: `page` (rich text) or `pdf` (file upload). |
| `is_featured` | `boolean` | If true, pins document to the top of the resident feed. |

## `public.document_reads`

Tracks resident engagement. A record is inserted automatically when a resident opens a document page.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key. |
| `document_id` | `uuid` | Foreign key to `documents.id`. |
| `user_id` | `uuid` | Foreign key to `users.id`. |
| `tenant_id` | `uuid` | Foreign key to `tenants.id`. |

**Constraints:**
- **Unique**: `(document_id, user_id)` ensures a resident is only counted once per document.

## AI Bridge (`rio_documents`)

The documents feature integrates with the Río AI Assistant via the `rio_documents` table (managed within the AI ingestion pipeline).

- **Mapping**: `rio_documents.source_document_id` links directly to `public.documents.id`.
- **Indexing**: Documents marked as `published` are eligible for indexing in the vector database for RAG (Retrieval-Augmented Generation).

:::info
For details on the vector schema and embedding process, see the [Río AI Agent Architecture](../rio-agent/architecture.md) documentation.
:::
