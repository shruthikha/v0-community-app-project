---
title: Lessons Learned
---

# Lessons

## Core Patterns
- [route-redirect.md](route-redirect.md) — Route handler redirect hostname mismatch
- [zod-validation.md](zod-validation.md) — Zod validation order, empty strings
- [feature-flags.md](feature-flags.md) — Feature flags must fail closed
- [pii-handling.md](pii-handling.md) — PII in URLs and logs, redaction
- [nextjs-cache.md](nextjs-cache.md) — Cache invalidation, dynamic paths, middleware grace
- [auth-verification.md](auth-verification.md) — Verify role before admin access
- [password-reset-rate-limiting.md](password-reset-rate-limiting.md) — Reset flows need rate limits
- [pii-log-redaction.md](pii-log-redaction.md) — Redact PII from logs
- [rls-triggers-are-not-enough.md](rls-triggers-are-not-enough.md) — Triggers are not enough for tenant isolation
- [double-query-pattern.md](double-query-pattern.md) — Avoid double queries for single-record lookups

## Río AI Patterns (Compiled from Build Logs)
- [rls-security-hardening.md](rls-security-hardening.md) — RLS policies, search path, service_role guards
- [feature-flag-gating.md](feature-flag-gating.md) — Dual-flag logic (enabled + rag), fail-closed UI
- [ai-ingestion-pipeline.md](ai-ingestion-pipeline.md) — Document → Parse → Chunk → Embed → Store
- [bff-timeout-guards.md](bff-timeout-guards.md) — Tiered timeouts, AbortController
- [mastra-memory-config.md](mastra-memory-config.md) — 3-tier prompts, TokenLimiter, session timeout
- [rag-citations.md](rag-citations.md) — RAG tool, citations protocol, SSE streaming
- [supabase-storage-rls.md](supabase-storage-rls.md) — Bucket policies, folder isolation
- [vector-pgvector.md](vector-pgvector.md) — pgvector strictness, dimension mismatches, HNSW
- [multi-tenant-thread-isolation.md](multi-tenant-thread-isolation.md) — Thread isolation levels
- [postHog-observability.md](postHog-observability.md) — PII redaction, SHA-256 masking
- [database-column-strictness.md](database-column-strictness.md) — NOT NULL, upsert patterns

## Platform Patterns (Compiled from Build Logs)
- [search-normalization.md](search-normalization.md) — Lot search, prefix ranking, natural sort
- [profile-auto-save.md](profile-auto-save.md) — Serialized auto-save loop, React functional updater anti-pattern
- [interest-management.md](interest-management.md) — Inline creation, derived filters, backend-first
- [rate-limiting.md](rate-limiting.md) — IP-based rate limit, try-catch scope
- [comment-system.md](comment-system.md) — Threaded comments, RLS vs server action auth
- [design-tokens.md](design-tokens.md) — CSS custom properties, tailwind sync, truncation
- [navigation-debt.md](navigation-debt.md) — Broken links, tab-based routing
- [inventory-one-way.md](inventory-one-way.md) — Consumable items, category-based logic

## Platform Patterns (Batch 3)
- [server-side-filtering.md](server-side-filtering.md) — Privacy filtering on server, admin override
- [responsive-dialog.md](responsive-dialog.md) — Drawer on mobile, Dialog on desktop
- [series-events.md](series-events.md) — Series RSVP scope, event bus sync
- [geolocation-hooks.md](geolocation-hooks.md) — Lazy permission, numeric error codes
- [geojson-data.md](geojson-data.md) — DB constraints, text vs numeric
- [password-reset-flow.md](password-reset-flow.md) — Next.js 15 params, session cookies

## Platform Patterns (Batch 4)
- [session-timeout.md](session-timeout.md) — Remember me, middleware timeout, HttpOnly cookies
- [mobile-tab-alignment.md](mobile-tab-alignment.md) — CSS Grid wrapper fixes, structural parity
- [cross-component-sync.md](cross-component-sync.md) — CustomEvent for state sync
- [admin-family-management.md](admin-family-management.md) — Family by lot, server actions, RLS

---

## PRD Compilation

These lessons were compiled from the original PRDs in `knowledge/raw/prds-archive/`, using content-based evaluation:
- **Engineering decisions** → `domains/engineering/`
- **Code patterns** → `patterns/`
- **Feature concepts** → `concepts/`

## Requirements Compilation (Batch 1)

Compiled from `knowledge/raw/requirements-archive/`:
- [rio-memory-architecture.md](../concepts/rio-memory-architecture.md) — Working memory, semantic recall
- [rio-privacy-settings.md](../concepts/rio-privacy-settings.md) — GDPR, fact deletion
- [3-tier-prompt.md](../concepts/3-tier-prompt.md) — Prompt hierarchy

Next: Continue with requirements compilation

These lessons were compiled from 72 build logs in `knowledge/raw/build-logs/` using the Karpathy LLM Wiki methodology:
- **Batch 1**: Río Foundation logs (2026-03-14 to 2026-03-22)
- **Batch 2**: Río Ingestion pipeline logs (2026-03-17 to 2026-03-21)
- **Batch 3**: UX Consolidation logs (2026-02 to 2026-03-12)

Next: Continue with remaining build logs (2026-01 to 2026-02)