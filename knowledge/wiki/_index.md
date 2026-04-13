---
title: Wiki
---

# Knowledge Wiki

Main reference for agents during execution. Contains compiled patterns, lessons, design system, and tool-specific guidance.

## Directory Structure

| Directory | Contents | Files |
|----------|---------|-------|
| [patterns/](patterns/) | Database, framework, and code patterns | ~15 |
| [lessons/](lessons/) | Learned lessons from debugging/production | ~10 |
| [design/](design/) | Brand colors, typography, spacing | ~1 |
| [tools/](tools/) | Tool-specific patterns (Supabase, etc.) | ~4 |
| [domains/](domains/) | Domain-specific knowledge | ~4 |
| [concepts/](concepts/) | Core concepts and definitions | ~5 |

## Quick Reference

### For Agents

| Agent | Wiki Reference |
|-------|----------------|
| backend-specialist | `patterns/` + `lessons/` + `concepts/` |
| frontend-specialist | `design/` + `patterns/` + `concepts/` |
| database-architect | `patterns/` + `domains/engineering/` |
| orchestrator | All domains |

### Key Patterns

- [supabase-multi-tenancy.md](patterns/supabase-multi-tenancy.md) — Tenant isolation
- [supabase-concurrency.md](patterns/supabase-concurrency.md) — Atomic updates
- [server-actions.md](patterns/server-actions.md) — Server Action patterns
- [admin-client-authorization.md](patterns/admin-client-authorization.md) — Privileged access must be verified first
- [zod-validation.md](patterns/zod-validation.md) — Request/action input validation
- [tenant-scoped-rls.md](patterns/tenant-scoped-rls.md) — Tenant-scoped RLS enforcement
- [type-safe-data-layer.md](patterns/type-safe-data-layer.md) — Explicit types for data access

### Key Lessons

- [route-redirect.md](lessons/route-redirect.md) — Route handler redirects
- [zod-validation.md](lessons/zod-validation.md) — Zod ordering
- [feature-flags.md](lessons/feature-flags.md) — Fail closed
- [auth-verification.md](lessons/auth-verification.md) — Verify role before admin access
- [password-reset-rate-limiting.md](lessons/password-reset-rate-limiting.md) — Reset flows need rate limits
- [pii-log-redaction.md](lessons/pii-log-redaction.md) — Redact PII in logs
- [rls-triggers-are-not-enough.md](lessons/rls-triggers-are-not-enough.md) — Triggers are not enough for tenant isolation
- [double-query-pattern.md](lessons/double-query-pattern.md) — Avoid double queries for lookups

### Key Concepts

- [authz-boundaries.md](concepts/authz-boundaries.md) — Where authorization must happen
- [service-role-vs-user-session.md](concepts/service-role-vs-user-session.md) — Elevated server trust vs end-user sessions
- [tenant-isolation.md](concepts/tenant-isolation.md) — Tenant data separation
- [validation-boundary.md](concepts/validation-boundary.md) — Where raw input becomes trusted data
- [data-access-layer.md](concepts/data-access-layer.md) — Persistence boundary responsibilities

### Key Tools

- [api-route-patterns.md](tools/api-route-patterns.md) — Route validation, auth, error handling
- [server-actions-patterns.md](tools/server-actions-patterns.md) — Mutation boundary conventions
- [supabase-security-checklist.md](tools/supabase-security-checklist.md) — Supabase review checklist
- [middleware-auth-flow.md](tools/middleware-auth-flow.md) — Session refresh and timeout flow

### Key Domains

- [engineering/api-quality.md](domains/engineering/api-quality.md) — API quality expectations
- [engineering/security-posture.md](domains/engineering/security-posture.md) — Overall security posture
- [engineering/data-quality.md](domains/engineering/data-quality.md) — Type safety and query hygiene
- [engineering/rio-blueprint.md](domains/engineering/rio-blueprint.md) — Río architecture and implementation context

### Design System

- [nido-design-system.md](design/nido-design-system.md) — Brand colors, typography, spacing

## Raw Sources

Legacy documentation stored in `knowledge/raw/`:
- [build-logs/](raw/build-logs/) — 72 sprint logs
- [prds-archive/](raw/prds-archive/) — 13 PRD documents
- [requirements-archive/](raw/requirements-archive/) — 64 requirements
- [ideas-archive/](raw/ideas-archive/) — 7 original ideas

See [knowledge/raw/_manifest.md](raw/_manifest.md) for full inventory.

---

*Wiki compiled from legacy documentation during Phase 3 (April 2026)*