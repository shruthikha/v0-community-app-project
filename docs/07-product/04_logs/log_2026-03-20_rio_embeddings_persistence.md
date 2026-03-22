# Build Log: Rio Embedding & Persistence (#189-191)
**Issue:** #189, #190, #191 | **Date:** 2026-03-20 | **Status**: ✅ Done

## Context
- **PRD Link**: [Sprint 9 PRD](../03_prds/prd_2026-03-19_sprint_9_rio_ingestion.md)
- **Req Link**: [scope_160_ingestion_pipeline.md](../../05_plans/scope_160_ingestion_pipeline.md)
- **Board Status**: Initializing local build. 
- **Patterns Noted**: 
    - **[2026-03-20] Structure-Aware Chunking**: Chunks preserve hierarchy and table rows.
    - **[2026-03-20] Mastra 1.x Workflow Chaining**: Sequential step pattern.

## Clarifications (Socratic Gate)
<!-- To be filled in Phase 1 -->

## Progress
- [x] **Phase 1: Planning**
    - [x] Researched Gemini embedding limits [DONE]
    - [x] Decided on batch size 50 for safety [DONE]
    - [x] Proposed Atomic Upsert via RPC [DONE]
- [x] **Phase 2: Implementation**
    - [x] Updated `embeddings.ts` with `embedMany` batching (#189) [DONE]
    - [x] Created `upsert_document_chunks` RPC in Supabase (#190) [DONE]
    - [x] Updated `supabase.ts` to call RPC (#190) [DONE]
    - [x] Updated `ingest.ts` workflow with `embedChunksStep` and `persistChunksStep` (#191) [DONE]
- [x] **Phase 3: Verification**
    - [x] Unit test for batching and truncation [DONE]
    - [x] End-to-end ingestion of pilot documents [DONE]
    - [x] SQL vector dimension audit [DONE]

## Handovers
<!-- Agent-to-Agent context transfers -->

## Blockers & Errors
- [Resolved] Unauthenticated Ingest Endpoint in `packages/rio-agent/src/index.ts`.
- [Resolved] SQL RPC Vulnerabilities in `upsert_document_chunks`.
- [Resolved] Auth Logic Drift in `app/api/v1/ai/ingest/route.ts`.
- [Resolved] Storage Key Overwrites in `seed-pilot-docs.ts`.
- [Resolved] Supabase Init fallback bug in `lib/supabase.ts`.
- [Resolved] Test Gaps in `embeddings.test.ts` (batching verified).
- [Resolved] Race Condition in `workflows/ingest.ts` (atomic status update).

## Decisions
- **Decision: Unified Implementation**: Issues 189-191 will be implemented together to ensure transactional integrity between vectors and text chunks.

## Lessons Learned
<!-- Candidates for nido_patterns.md -->
