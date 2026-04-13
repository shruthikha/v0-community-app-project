---
source: build-log
imported_date: 2026-04-08
---
# Build Log: ST1: Fix Stale Error Badge
**Issue:** ST1 | **Date:** 2026-03-22 | **Status:** Completed ✅

## Context
- **PRD Link**: [prd_2026-03-22_sprint_11_rio_resident_chat.md](file:///Users/mj/Developer/v0-community-app-project/docs/07-product/03_prds/prd_2026-03-22_sprint_11_rio_resident_chat.md)
- **Problem**: Ingestion status badge keeps showing "Error" after re-index because the RPC only updated status, not the error message.

## Progress Log
- [2026-03-22 14:55] Implementation Plan approved.
- [2026-03-22 14:58] Created migration `supabase/migrations/20260322000005_fix_stale_error_badge_rpc.sql`.
- [2026-03-22 15:00] Applied migration to **nido.dev** and **nido.prod**.

## Decisions
- Clear `error_message` atomically in the `upsert_rio_document_if_not_processing` RPC.

## Lessons Learned
- Ensure PL/pgSQL functions have `DECLARE` block for local variables.
