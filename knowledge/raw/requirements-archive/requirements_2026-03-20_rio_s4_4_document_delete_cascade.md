source: requirement
imported_date: 2026-04-08
---
# Requirements: Río S4.4 — Document Delete (Atomic Cascade)

**Issue**: [#202](https://github.com/mjcr88/v0-community-app-project/issues/202)
**Epic**: [#162 — Río AI Sprint 4: Admin Experience](https://github.com/mjcr88/v0-community-app-project/issues/162)
**Sprint**: Sprint 10
**Date**: 2026-03-20

---

## Context

Once documents are ingested into `rio_document_chunks`, deleting a document from the admin UI must also remove all associated AI data — otherwise stale chunks will continue to surface in resident chat responses. This requires a cascading delete that spans three tables atomically.

## Problem Statement

Without cascade delete, a deleted document's chunks remain in `rio_document_chunks` and can still be cited by the AI agent, causing factual errors and ghost citations.

## User Personas

- **Tenant Admin**: Expects that deleting a document removes it from both the resident library and the AI knowledge base.

## Dependencies

- **Depends on**: S4.2 (`source_document_id` FK must exist to link tables)

## Key Design Decisions

1. **Postgres RPC (`SECURITY DEFINER`)**: Wraps the 3-step delete in a single atomic function, consistent with the project's `nido_patterns.md` pattern for cross-table operations.
2. **Graceful for drafts**: If no `rio_documents` row exists (document was never published/ingested), the function skips steps 1–3 and deletes only the source document.
3. **No Storage object cleanup in this sprint**: Files in the `documents` bucket remain accessible at their CDN URL. Storage cleanup can be added to a future maintenance task.

## Functional Requirements

- **FR1**: Deleting a published document atomically removes: all `rio_document_chunks` rows → the `rio_documents` row → the `documents` row.
- **FR2**: Deleting a draft (no `rio_documents` row) removes only the `documents` row, no errors.
- **FR3**: Admin is redirected to the document list with a success toast after deletion.
- **FR4**: Cross-tenant delete attempt (other tenant's `document_id`) returns 403.

## Technical Requirements

| File | Change |
|---|---|
| `supabase/migrations/20260321000002_delete_rio_cascade.sql` | [NEW] `delete_document_with_rio_cascade(p_document_id uuid)` RPC |
| `app/actions/documents.ts` | [MODIFY] `deleteDocument()` server action calls the RPC |
| `app/t/[slug]/admin/documents/page.tsx` or list | [MODIFY] Wire delete button to the new action |

**RPC logic**:
```sql
CREATE OR REPLACE FUNCTION delete_document_with_rio_cascade(p_document_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_rio_doc_id uuid;
BEGIN
  SELECT id INTO v_rio_doc_id FROM rio_documents WHERE source_document_id = p_document_id;
  IF v_rio_doc_id IS NOT NULL THEN
    DELETE FROM rio_document_chunks WHERE document_id = v_rio_doc_id;
    DELETE FROM rio_documents WHERE id = v_rio_doc_id;
  END IF;
  DELETE FROM documents WHERE id = p_document_id;
END; $$;
```

## Acceptance Criteria

- [ ] AC1: Deleting a published, ingested document removes all chunks and `rio_documents` row atomically.
- [ ] AC2: Deleting a draft document removes only the `documents` row, no error.
- [ ] AC3: Admin sees success toast and is returned to the document list.
- [ ] AC4: Cross-tenant delete returns 403.
- [ ] AC5 (Manual QA, deferred until Sprint 11 chat): Deleted document no longer cited in chat responses.

## Classification

- **Priority**: P1
- **Size**: S (4–8h estimated)
- **Branch**: `feat/sprint-10-rio-admin`
