---
source: build-log
imported_date: 2026-04-08
---
# Build Log: Río S4.2: Manual Ingest Trigger button + `source_document_id` FK
**Issue:** #234 | **Date:** 2026-03-21 | **Status:** Ready for QA

## Context
- **PRD Link**: [prd_2026-03-20_sprint_10_rio_admin.md](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/03_prds/prd_2026-03-20_sprint_10_rio_admin.md)
- **Req Link**: [requirements_2026-03-20_rio_s4_2_ingest_trigger.md](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/02_requirements/requirements_2026-03-20_rio_s4_2_ingest_trigger.md)
- **Board Status**: Issue #234 is "Ready for Development" in Sprint 10.
- **Relevant Patterns**:
    - [x] Multi-tenant isolation (tenant_id)
    - [x] Server-side Supabase access (@/lib/supabase/server)
    - [x] TipTap HTML sanitization (DOMPurify)
    - [x] RLS on framework tables (Mastra)

## Clarifications (Socratic Gate)
1. **Ingestion Payload for Pages**: 
    - **Q**: Should BFF send HTML in body or agent fetch from DB?
    - **A**: **Option B (Agent Fetches)**. Agent will use `source_document_id` to fetch the content from `public.documents` table. This is more robust for large documents.
2. **Concurrency/Status Lock**: 
    - **Q**: Block in BFF or let Mastra handle?
    - **A**: **Mastra Lifecycle**. The `claimDocument` helper in the agent handles the mutex.
3. **Source Document Updates**: 
    - **Q**: Automatic cleanup/stale detection?
    - **A**: **Stale Detection**. If `documents.updated_at > rio_documents.updated_at`, status will show as "Out of Date" in the UI with a "Re-index" button. Cleanup is already handled by `upsert_document_chunks` RPC (Delete-then-Insert).

## Progress Log
- **2026-03-21 06:45**: Phase 0 Complete. Issue selected and context established.
- **2026-03-21 07:30**: Phase 2 Complete. `get-ingest-status` API and `delete_document` RPC implemented.
- **2026-03-21 08:45**: Phase 3 Complete. `IngestionStatusBadge` and `ReindexButton` integrated into table.
- **2026-03-21 09:45**: Critical Fixes. Resolved RLS policy mismatch and stabilized status polling loop.

## Handovers
- **2026-03-21 10:15**: `🔁 [BUILD COMPLETE] Ingestion Polish and Atomic Deletion verified. Ready for QA.`

### QA Feedback & Hardening (2026-03-21)

All 17 findings from CodeRabbit PR #236 have been addressed and verified.

### 🛡️ Security Hardening
- **RPC Lockdown**: `delete_document_with_rio_cascade` now strictly validates `p_tenant_id` to prevent cross-tenant deletion by non-owners.
- **Storage RLS**: Enforced `${tenantId}/` folder-level isolation in the `documents` bucket policies.
- **Access Control**: Generalized `uploadFileClient` to support multiple buckets while maintaining tenant path conventions.

### 🏗️ Stability & UX
- **Runtime Fix**: Resolved `useRouter` undefined error in `AdminDocumentsTable`.
- **Race Condition**: Implemented atomic `upsert` for `rio_documents` to prevent status resets during concurrent re-indexing.
- **PDF Safety**: Added server-side validation in `upsertDocument` to ensure `file_url` presence for PDF types.
- **Accessibility**: Added ARIA labels to all icon-only buttons in the document management UI.

### 🔧 Post-Verification Fix (2026-03-21 14:40)
- **RPC Mismatch**: Identified and resolved a signature mismatch where the application was calling a 2-parameter RPC but the DB only had a 1-parameter version.
- **Parity**: Manually applied `20260321000004_fix_storage_rls.sql` and `20260321000005_delete_rio_cascade.sql` to the project to ensure full alignment between code and database.
- **Overload Cleanup**: Dropped the obsolete 1-parameter version of the deletion function to prevent ambiguity.
- **RLS Path Fix**: Corrected a qualification bug in the storage policies where `name` was incorrectly qualified as `users.name`, restoring upload functionality.

**Final Verdict**: Ingestion pipeline is 100% verified, hardened, and operational.

### Phase 0: Activation & Code Analysis (Findings)
> [!IMPORTANT]
> **Summary of 17 CodeRabbit Findings for PR #236**

#### 🔴 Critical / High Severity
- **Runtime Failure**: `AdminDocumentsTable` uses `router` without calling `useRouter()`.
- **Compile Failure**: `uploadFileClient` restricted to `"documents"` bucket, breaking `"photos"` callers.
- **Security (Storage)**: `20260321000000_documents_bucket.sql` allows cross-tenant writes (missing tenant_id check in policies).
- **Security (RPC)**: `delete_document_with_rio_cascade` (SECURITY DEFINER) lacks tenant validation.
- **Semantic Mismatch**: Storage bucket ID is `documents` but agent code expects `rio-documents`.
- **Race Condition**: `/api/v1/ai/ingest` can race to reset `processing` status to `pending`.
- **Data Integrity**: Deleting DB row before storage cleanup; if storage fails, doc is stranded.
- **Embedding Drift**: No strategy for legacy Gemini embeddings vs new OpenAI `text-embedding-3-small`.

#### 🟡 Major/Medium Severity
- **Stuck Status**: Failed handoff to Railway can leave documents permanently `pending` with no retry.
- **Access Gaps**: Edit/Delete/Re-index buttons lack `aria-label` (Accessibility).
- **UX**: Actions (Edit/Re-index) are not disabled when a document is in `processing` or `deleting`.
- **Validation**: PDF file requirement missing in server-side `upsertDocument` action.
- **UI Logic**: `ReindexButton` shows for draft/archived docs if a `rioDoc` already exists.

#### 🔵 Minor / Polish
- **Env Cleanup**: Duplicate `DATABASE_URL` in `.env.example`.
- **Docs**: Local `file://` URIs and broken relative links in PRD/Logs.
- **Lint**: Untyped code fences (MD040) in PRD.

## Blockers & Errors (Resolved)
- **Embedding Dimension Mismatch**: Fixed by switching to `openai/text-embedding-3-small`.
- **Storage RLS**: Fixed by using path-based folder isolation.
- **Metadata Visibility (RLS)**: Discovered `rio_documents` used JWT claims while main app used DB subqueries. Aligned all `rio_` tables with the subquery pattern to restore visibility.
- **Polling Stale Data**: Fixed by adding cache-busting (timestamp + no-cache) to status checks.

## Decisions
- Ingestion is MANUAL (admin choice).
- `source_document_id` was added to `rio_documents` to bridge the tables.
- **Mutually Exclusive UI**: Dashboard shows either the "Add to Knowledge Base" button OR the status badge, preventing cluttered layout.
- **Model Choice**: Standardized on 1536-dimension OpenAI embeddings for the knowledge base.
- **Storage Strategy**: Consolidated PDFs and images into the `documents` bucket with UUID prefixes.

## Lessons Learned
- **Dimension Strictness**: pgvector `vector(N)` is strict. Always verify model output vs column definition early. AI-generated migrations often hallucinate Gemini's dimensions as 1536 (it's 768 for v1).
- **Storage Pathing**: Supabase Storage RLS policies are more reliable when based on `(storage.foldername(name))[1]` rather than complex JWT checks for nested folders.
