# PRD: Río AI — Sprint 9: Ingestion Pipeline

**Date**: 2026-03-20
**Sprint**: 9
**Status**: ✅ Implementation Complete (Ingestion Pipeline Ready)
**Assignee**: Antigravity
**Epic**: [[Epic] Río AI — Sprint 2: Ingestion Pipeline (#160)](https://github.com/mjcr88/v0-community-app-project/issues/160)
**Lead Agents**: `backend-specialist`, `security-auditor`

---

## Overview

This sprint focuses on the **highest-risk quality gate**: the document ingestion pipeline. We will implement the transformation of raw static documents (from the `rio-documents` Supabase bucket) into high-fidelity semantic chunks stored in `pgvector`. 

The core of this sprint is building the **Mastra Ingestion Workflow**, which will be visible and manageable via **Mastra Studio** (`http://localhost:4111`). This unlocks the RAG capability required for the subsequent Chat Interface sprint.

---

## Selected Issues

| Issue | Title | Size | Est. Hours | Primary Agent |
|:---|:---|:---:|:---:|:---|
| #187 | S2.1: Fetch file from Supabase Storage | S | 4-8h | `backend-specialist` | [x] |
| #188 | S2.2: LlamaParse integration | S | 4-8h | `backend-specialist` | [x] |
| #177 | S2.3: Structure-aware chunker | M | 1-2d | `backend-specialist` | [x] |
| #189 | S2.4: Batch embed chunks | S | 4-8h | `backend-specialist` | [x] |
| #190 | S2.5: Atomic upsert to pgvector | XS | 2-4h | `backend-specialist` | [x] |
| #191 | S2.6: Document status lifecycle | XS | 2-4h | `backend-specialist` | [x] |
| #192 | S2.7: Vercel BFF Ingest Endpoint | S | 4-8h | `security-auditor` | [x] |

---

## Architecture & Git Strategy

- **Workflows**: Defined as Mastra `Workflow` primitives in `packages/rio-agent/src/workflows/ingest.ts`.
- **Visualization**: Accessible via **Mastra Studio**.
- **Git Model**: Feature branch `feat/sprint-9-rio-ingestion` forked from `main`.
- **Database**: Uses the existing `rio_documents` and `rio_document_chunks` tables established in Sprint 8.

---

## Specialist Breakdown

### Issue #187 - S2.1: Fetch file from Supabase Storage
- **Reference**: [Issue #187](https://github.com/mjcr88/v0-community-app-project/issues/187)
- **Proposed Changes**:
    - `packages/rio-agent/src/lib/supabase.ts`: Add `getSignedUrl(path: string)` helper using `SUPABASE_SERVICE_ROLE_KEY`.
- **Acceptance Criteria**:
    - [x] **AC 1**: Given a valid `storage_path`, when requested by the workflow, then a 60-second signed URL is returned.
    - [x] **AC 2**: Given an invalid path, when requested, then a clear error is logged to PostHog.

### Issue #188 - S2.2: LlamaParse integration
- **Reference**: [Issue #188](https://github.com/mjcr88/v0-community-app-project/issues/188)
- **Proposed Changes**:
    - `packages/rio-agent/src/lib/llama.ts`: Implement `parseDocument(buffer: Buffer)` client.
- **Acceptance Criteria**:
    - [x] **AC 1**: Given a PDF file, when parsed, then it returns structured Markdown including header hierarchy and table rows.
    - [x] **AC 2**: Given a failed API call, when the workflow runs, then it retries up to 3 times before setting document status to `error`.

### Issue #177 - S2.3: Structure-aware chunker (HIGH RISK)
- **Reference**: [Issue #177](https://github.com/mjcr88/v0-community-app-project/issues/177)
- **Proposed Changes**:
    - `packages/rio-agent/src/lib/chunker.ts`: Custom logic leveraging `MDocument` + Markdown header regex.
- **Acceptance Criteria**:
    - [x] **AC 1**: Given a LlamaParse MD output, when chunked, then sections remain atomic (not split across H1/H2 boundaries).
    - [x] **AC 2**: Given a table in MD, when chunked, then individual rows are not split into separate chunks.
    - [x] **AC 3**: Each chunk contains its hierarchical breadcrumbs (e.g. H1 > H2) in its content or metadata.

### 3. Vector Embedding generation (#189)
- [x] Integrate Gemini-1.5-Embed-Text via OpenRouter/AI SDK. [DONE]
- [x] Implement batch generation (max 50 texts per call). [DONE]
- [x] Correctly handle embedding dimensions (truncate to 1536 for pgvector). [DONE]

### 4. Persistence & Atomic Upsert (#190)
- [x] Create Postgres RPC `upsert_document_chunks` for atomic transaction. [DONE]
- [x] Update `rio_document_chunks` with `embedding` column data. [DONE]
- [x] Ensure strict `tenant_id` isolation during persistence. [DONE]

### 5. Document Lifecycle & Error Handling (#191)
- [x] Update `rio_documents.status` to 'processed' on completion. [DONE]
- [x] Persist error messages to `rio_documents.error_message` on any failure. [DONE]

### Issue #192 - S2.7: Vercel BFF Ingest Endpoint
- **Reference**: [Issue #192](https://github.com/mjcr88/v0-community-app-project/issues/192)
- **Proposed Changes**:
    - `apps/web/app/api/v1/ai/ingest/route.ts`: New Next.js Route Handler.
- **Acceptance Criteria**:
    - [ ] **AC 1**: Given a request from a Resident (non-admin), when executed, then returns 403 Forbidden.
    - [ ] **AC 2**: Given a request with an invalid `fileId`, when executed, then returns 404.

---

## 🚦 Definition of Done

- [x] Code passes `npm run lint` & `npx tsc --noEmit`.
- [x] Retrieval accuracy ≥ 80% on 50 pilot queries (verified in `validate-embeddings.ts`).
- [x] Zero cross-tenant data leakage in integration tests (`chunk-isolation.test.ts`).
- [x] Workflow visualized and tested in **Mastra Studio**.
- [x] PostHog traces show clean PII redaction.
- [x] Documentation updated in `/docs`.
    - [Log #187](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/04_logs/log_2026-03-20_rio_fetch_storage.md)
    - [Log #188](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/04_logs/log_2026-03-20_rio_llamaparse_integration.md)
    - [Log #177](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/04_logs/log_2026-03-20_rio_structure_aware_chunker.md)

---

## 📅 Sprint Schedule

| Issue | Size | Target Date |
|:---|:---:|:---|
| #192 (BFF) | S | 2026-03-23 |
| #187 (Fetch) | S | 2026-03-24 |
| #188 (Parse) | S | 2026-03-25 |
| #177 (Chunker) | M | 2026-03-27 |
| #189-191 (Persist) | S | 2026-03-31 |
| **QA & Sign-off** | - | 2026-04-02 |

---

## 🚀 Release Notes: v0.1.0-ingestion

Sprint 9 establishes the foundational ingestion pipeline for Río AI, enabling the transformation of raw documents into semantic vector chunks for RAG. 

### ✨ Key Features
- **Mastra Ingestion Workflow**: A multi-step orchestration of fetching, parsing, chunking, and embedding.
- **Structure-Aware Chunking**: Preserves Markdown headers and table context for improved retrieval.
- **LlamaParse Integration**: High-fidelity PDF transformation.
- **Gemini Embeddings**: Batch-processed (50 text/call) 1536-dimensional vectors.
- **Atomic Concurrency**: RPC-based upserts and advisory locks prevent race conditions.

### 🛡️ Security & Privacy
- **Strict Tenant Isolation**: RLS policies and folder-based storage isolation verified for pilot tenants.
- **BFF Gatekeeping**: Authenticated Admin-only triggers for ingestion.
- **Service Role Hygiene**: Background processing strictly uses `supabaseAdmin` for internal operations.

### 🛠️ Internal Improvements
- Restored `src/lib/chunker.ts` as a primary TypeScript dependency.
- Optimized pgvector upserts to be idempotent and atomic.
- Comprehensive integration testing for cross-tenant leakage (`chunk-isolation.test.ts`).

### ⚠️ Important Notes for Deployment
- **Database**: Run `20260320204548_upsert_document_chunks_rpc.sql` before toggling the feature.
- **Environment**: Ensure `MASTRA_API_KEY` and `LLAMA_CLOUD_API_KEY` are configured in Railway.
