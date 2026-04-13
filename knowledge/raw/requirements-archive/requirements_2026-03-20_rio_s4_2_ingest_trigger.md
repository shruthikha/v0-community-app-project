source: requirement
imported_date: 2026-04-08
---
# Requirements: Río S4.2 — Ingest Trigger on Publish

**Issue**: [#234](https://github.com/mjcr88/v0-community-app-project/issues/234)
**Epic**: [#162 — Río AI Sprint 4: Admin Experience](https://github.com/mjcr88/v0-community-app-project/issues/162)
**Sprint**: Sprint 10
**Date**: 2026-03-20

---

## Context

The Río AI ingestion pipeline (Sprint 9) can process documents from Supabase Storage, but there is no UI trigger for admins to manually add documents to the knowledge base. This issue adds the "Add to knowledge base" action to the admin document list, bridging the `documents` table (resident-facing) to the `rio_documents` table (AI-facing).

## Problem Statement

Admins want granular control over which documents are indexed by the AI. Automatic ingestion on publish is too broad. This issue provides a manual "Add to knowledge base" button in the admin UI to trigger the ingestion for specific published documents.

## User Personas

- **Tenant Admin**: Wants to selectively add published documents to the knowledge base. Requires a clear manual trigger for ingestion.
- **Resident**: Unaffected — document library continues to work exactly as before.

## Dependencies

- **Depends on**: S4.0 (documents bucket must exist in dev)
- **Depends on**: Sprint 9 ingestion pipeline (`POST /api/v1/ai/ingest`, Mastra workflow)
- **Enables**: S4.3 (status badges need `source_document_id` FK)

## Key Design Decisions

1. **Manual trigger**: Ingestion is triggered by an explicit admin action in the document list UI. It is NOT automatic upon publishing.
2. **`source_document_id` FK**: A new nullable column `source_document_id UUID REFERENCES documents(id)` on `rio_documents` links AI records back to source documents, enabling status polling and cascade delete.
3. **Page-type ingestion**: Rich text pages (TipTap HTML) are converted to Markdown via `turndown` before the standard chunking pipeline — no Storage file needed.
4. **Resident features preserved**: No changes to document reads, `file_url` links, notifications, or changelog.

## Functional Requirements

- **FR1**: Add "Add to knowledge base" button to the `/admin/documents` list for each published document.
- **FR2**: Clicking the button triggers `POST /api/v1/ai/ingest`.
- **FR3**: The BFF endpoint upserts a `rio_documents` row keyed by `source_document_id`. If a row exists, reset `status = 'pending'` and re-trigger. If not, create a new row.
- **FR4**: PDF and Page document support as per Sprint 9 logic.
- **FR5**: Draft, archived, and featured-only documents should not show the ingestion trigger or should have it disabled.

## Technical Requirements

| File | Change |
|---|---|
| `components/admin/document-list.tsx` | Add "Add to knowledge base" action/button |
| `app/api/v1/ai/ingest/route.ts` | Accept `content` param; upsert `rio_documents` by `source_document_id` |
| `supabase/migrations/20260321000001_source_document_id.sql` | Add `source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL` to `rio_documents` |
| `packages/rio-agent/src/workflows/ingest.ts` | Add `parseHtmlToMarkdown` step for page type |
| `packages/rio-agent/src/lib/html-parser.ts` | `parseHtmlToMarkdown(html: string): string` using `turndown` |

## Acceptance Criteria

- [ ] AC1: Clicking "Add to knowledge base" on a PDF → `rio_documents` row created with `status='pending'`, `source_document_id` set.
- [ ] AC2: Clicking "Add to knowledge base" on a Page → page HTML ingested as chunks.
- [ ] AC3: Draft documents do not show the "Add to knowledge base" button.
- [ ] AC4: Clicking "Re-index" on an already ingested document → existing row resets to `pending`, re-triggers workflow.
- [ ] AC5: Trigger failure does not surface an error to the resident-facing library.

## Classification

- **Priority**: P0 (Core feature of Sprint 10)
- **Size**: S (4–8h estimated)
- **Branch**: `feat/sprint-10-rio-admin`
