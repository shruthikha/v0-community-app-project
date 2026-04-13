source: requirement
imported_date: 2026-04-08
---
# Requirements: Río S4.3 — AI Ingestion Status Badge + Re-index Button

**Issue**: [#235](https://github.com/mjcr88/v0-community-app-project/issues/235)
**Epic**: [#162 — Río AI Sprint 4: Admin Experience](https://github.com/mjcr88/v0-community-app-project/issues/162)
**Sprint**: Sprint 10
**Date**: 2026-03-20

---

## Context

Now that the manual ingest trigger (S4.2) is planned, admins need visibility into the ingestion state and a way to re-trigger it. This issue adds an "AI Status" column to the admin document list that houses both the status badge and the manual "Add to knowledge base" / "Re-index" button.

## Problem Statement

Without status feedback, admins cannot tell if the AI has learned from their documents. A failed ingestion would be invisible, and documents published before Sprint 10 would never be indexed without a way to trigger it manually.

## User Personas

- **Tenant Admin**: Needs to see which documents are indexed ("Ready"), pending, or errored — and be able to re-trigger without re-saving the document.

## Dependencies

- **Depends on**: S4.2 (`source_document_id` FK and `rio_documents.status` field must exist)

## Key Design Decisions

1. **Poll-on-demand**: The badge polls `GET /api/v1/ai/ingest-status` every 5s only when status is `pending` or `processing`. Stops automatically on terminal states.
2. **Re-index button**: Calls the same `POST /api/v1/ai/ingest` endpoint that the auto-trigger uses. This allows retries and backfill without re-publishing.
3. **Draft behaviour**: Drafts show "—" and no Re-index button (no ingestion path for drafts).

## Functional Requirements

- **FR1**: Admin document list shows a new "AI Status" column with status badge per document.
- **FR2**: Badge states: `pending` (spinner), `processing` (spinner), `processed` (✅ "Ready"), `error` (🔴 with error tooltip on hover).
- **FR3**: Documents with no `rio_documents` row show "—" (not indexed).
- **FR4**: A small Re-index icon button appears alongside the badge for: `error`, `not indexed` (published with no rio row), `processed`.
- **FR5**: Re-index button is hidden for draft documents.
- **FR6**: Badge auto-updates every 5s when in `pending` or `processing` state, without page reload.
- **FR7**: A new `GET /api/v1/ai/ingest-status?documentId=...` endpoint returns `{ status, error_message? }` (admin-only, 403 for residents).

## Technical Requirements

| File | Change |
|---|---|
| `components/admin/ingestion-status-badge.tsx` | [NEW] Client component, 5s polling, stops on terminal state |
| `components/admin/reindex-button.tsx` | [NEW] Icon button, calls `POST /api/v1/ai/ingest`, shows loading spinner |
| `app/api/v1/ai/ingest-status/route.ts` | [NEW] `GET` handler, admin-only RLS check, returns status |
| `app/t/[slug]/admin/documents/page.tsx` | [MODIFY] Fetch `rio_documents` status for each document on page load |
| `components/admin/document-list.tsx` | [MODIFY] Add AI Status column |

## Acceptance Criteria

- [ ] AC1: Newly published document → AI Status column shows pending spinner immediately.
- [ ] AC2: Processed document → ✅ "Ready" badge shown.
- [ ] AC3: Error state → red badge; hovering shows the error message.
- [ ] AC4: Pending badge auto-updates to "Ready" within 5s of processing completing, no page reload.
- [ ] AC5: Draft document → "—" shown, no Re-index button.
- [ ] AC6: Clicking Re-index on errored document → status resets to pending, ingestion re-triggers.
- [ ] AC7: Clicking Re-index on a pre-Sprint-10 published document → new `rio_documents` row created, ingestion begins.
- [ ] AC8: `GET /api/v1/ai/ingest-status` called by a resident → 403.

## Classification

- **Priority**: P1
- **Size**: S (4–8h estimated)
- **Branch**: `feat/sprint-10-rio-admin`
