---
source: prd
imported_date: 2026-04-08
---
# PRD: Río AI — Sprint 8: Foundation

**Date**: 2026-03-19
**Sprint**: 8 (Roadmap) / Sprint 1 (Río Naming Convention)
**Status**: Completed — Retroactive Document
**Epic**: [#159 — [Epic] Río AI — Sprint 1: Foundation](https://github.com/mjcr88/v0-community-app-project/issues/159)
**Lead Agents**: `backend-specialist`, `security-auditor`, `devops-engineer`

---

## Overview

Sprint 8 established the production-grade foundation for the Río AI Assistant. This work transitioned the project from the "Technical Spike" (Sprint 7) to a structured, multi-tenant infrastructure capable of handling document ingestion and resident conversations.

The primary focus was on establishing the Supabase database schema, configuring private storage buckets, implementing server-side feature flags, and setting up staging/production environments on Railway.

---

## Selected Issues

| Issue | Title | Status | Primary Agent |
|-------|-------|--------|---------------|
| #172 | S1.1: DB migrations — all `rio_*` tables + `user_memories` | ✅ Closed | `backend-specialist` |
| #173 | S1.2: HNSW index on `rio_document_chunks.embedding` | ✅ Closed | `backend-specialist` |
| #174 | S1.3: Private Supabase Storage bucket `rio-documents` | ✅ Closed | `security-auditor` |
| #175 | S1.4: Rio feature flags in `tenants.features` JSONB | ✅ Closed | `backend-specialist` |
| #185 | S1.5: Seed `rio_configurations` default row for pilot tenant | ✅ Closed | `backend-specialist` |
| #176 | S1.6: Cross-tenant chunk isolation integration test (CI) | ✅ Closed | `security-auditor` |
| #186 | S1.7: Railway staging + production environments | ✅ Closed | `devops-engineer` |

---

## Accomplishments

### 1. Database Foundation (#172, #173)
- **Schema Implementation**: Created 7 core tables: `rio_configurations`, `rio_documents`, `rio_document_chunks`, `rio_threads`, `rio_messages`, and `user_memories`.
- **HNSW Optimization**: Configured HNSW vector index with `ef_construction = 128` (upgraded from 64 in spike) for higher production recall quality.
- **Query Performance**: Added B-tree indexes on `document_id` (for citations) and `created_at` (for temporal relevance).
- **Isolation Triggers**: Implemented PostgreSQL triggers to automatically derive `tenant_id` and `user_id` from JSONB metadata, ensuring efficient indexed lookups.

### 2. Secure Infrastructure (#174, #186)
- **Private Storage**: Established the `rio-documents` Supabase bucket with `public = false`.
- **Ingestion Safeguards**: Enforced a 20MB file size cap and restricted uploads to PDF, MD, and TXT formats.
- **Environment Parity**: Configured `rio-agent-staging` and `rio-agent-production` on Railway with isolated Supabase connections and environment variables.

### 3. Feature Control & Pilot Readiness (#175, #185)
- **$rio Feature Flag**: Added a fail-closed `$rio` object to `tenants.features` to control access to RAG, Memory, and Actions.
- **PostHog Integration**: Connected server-side feature flags via PostHog for real-time remote toggles.
- **Pilot Seeding**: Populated `rio_configurations` for Alegría and Ecovilla San Mateo with bilingual community personas and tailored tones.

### 4. Verification & Security (#176)
- **Isolation Verification**: Developed `chunk-isolation.test.ts` which executed 200 parallel searches without a single data leak.
- **RLS Enforcement**: Enabled Row Level Security (RLS) on all 6 core tables and applied strict **Tenant Isolation** policies: `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`.
- **Production Hardening**: Rectified RLS discrepancies between Dev and Prod by applying the definitive migration baseline to the production environment, ensuring 100% security parity.
- **Storage Security**: Hardened the `rio-documents` bucket by enabling RLS on `storage.objects` and restricting access via folder-level tenant filtering.

---

## Technical Decisions

- **Fail-Closed Architecture**: If the feature flag service (PostHog) or the configuration database is unreachable, all Río features default to "Disabled" to prevent unauthorized or unconfigured access.
- **Policy Pattern**: Standardized on a shared PostgreSQL policy pattern for all Río tables, leveraging JWT-extracted `tenant_id` for transparent multi-tenancy.
- **Application-Layer Backup**: While DB RLS is the primary security boundary, the `rio-agent` service continues to enforce `tenant_id` in all raw SQL queries as a secondary "belt-and-suspenders" measure.
- **PgVector Managed Schema**: Decided to use Mastra's native `PgVector` table structure (`vector_id`, `embedding`, `metadata`) to ensure compatibility with framework updates, while using metadata for tenant isolation.

---

## Lessons Learned

- **PgVector Sensitivity**: Learned that Mastra's `PgVector` class expects specific column names; custom schema naming requires manually overriding query logic, so sticking to framework defaults for core vector columns is preferred.
- **Feature Flag TTL**: Discovered that active feature flag caching requires a short TTL (5 minutes) to ensure emergency kill-switches propagate quickly enough during incidents.
- **Frontend Cache Risks**: Identified that frontend `localStorage` for chat history can be an attack vector if not strictly scoped by `userId` and `tenantId` in the cache key.

---

## Assets & Documentation

- **DB Migration**: `supabase/migrations/20260319000000_rio_foundation.sql`
- **Isolation Test**: `packages/rio-agent/src/tests/chunk-isolation.test.ts`
- **Worklogs**: Located in `docs/07-product/04_logs/log_2026-03-19_rio_*`

---
*Created retroactively by Antigravity on 2026-03-19 based on work performed in Sprint 8.*
