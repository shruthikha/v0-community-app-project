---
title: Patterns
---

# Patterns

## Database
- [supabase-multi-tenancy.md](supabase-multi-tenancy.md) — Tenant isolation, RLS, storage path-prefixing
- [supabase-concurrency.md](supabase-concurrency.md) — Atomic updates, upsert, foreign keys
- [tenant-scoped-rls.md](tenant-scoped-rls.md) — Tenant-scoped RLS must be explicit and non-permissive
- [type-safe-data-layer.md](type-safe-data-layer.md) — Explicit types instead of `any` in data access
- [default-query-limits.md](default-query-limits.md) — Safe default limits for list queries
- [batch-rpc-counts.md](batch-rpc-counts.md) — Batch RPCs for count enrichment

## Server Actions
- [server-actions.md](server-actions.md) — Zod mandate, input types, cache invalidation
- [backend-first-auth.md](backend-first-auth.md) — Defense-in-depth RLS + admin client
- [admin-client-authorization.md](admin-client-authorization.md) — Authorize before using admin client
- [zod-validation.md](zod-validation.md) — Parse user input with Zod at the boundary

## Frontend
- [react-perf.md](react-perf.md) — Lazy loading, client components, array mutation

## Security
- [security-patterns.md](security-patterns.md) — Service role, BFF gates, PII redaction, thread ownership

## Framework
- [mastra-rls.md](mastra-rls.md) — initRls(), connection affinity, metadata triggers
- [xss-prevention.md](xss-prevention.md) — DOMPurify, dangerouslySetInnerHTML

## UI Components
- [mobile-ui.md](mobile-ui.md) — Mobile dock, empty states, geolocation, event bus
- [cmdk-patterns.md](cmdk-patterns.md) — Value decoupling, ranking, inline creation

## AI & Pipeline
- [rio-ai-pipeline.md](rio-ai-pipeline.md) — Document → RAG → Chat → Memory pipeline

---

**PRD Compilation:** New patterns from `knowledge/raw/prds-archive/`:
- Tech stack → `domains/engineering/tech-stack.md`
- Río pipeline → `patterns/rio-ai-pipeline.md`
- Feature flags → `concepts/feature-flags.md`