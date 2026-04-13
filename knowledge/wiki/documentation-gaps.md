---
title: Documentation Gaps
---

# Documentation Gaps

Living list of missing or outdated documentation. Items are added when discovered during audits, implementation, or review.

## Active Gaps

### From Original Audits (2026-04-11)

- [ ] **`docs/dev/architecture/api.md`** — New API endpoints not documented (from audit 2026-04-11) - CONFIRMED in API cross-cutting audit
- [ ] **`docs/user/guides/events.md`** — Event features (recurring events, series management) need user-facing documentation
- [ ] **`CODEBASE.md`** — Stale (says Next.js 14, actual is 16.1.7) — needs update
- [ ] **`lib/api/`** — API middleware and response patterns not documented

### From Retro Coverage Analysis (2026-04-11)

- [ ] **`knowledge/wiki/lessons/auth-enumeration.md`** — No wiki lesson on auth enumeration patterns (backoffice login queries by email)
- [ ] **`knowledge/wiki/lessons/storage-bucket-least-privilege.md`** — No wiki lesson on storage bucket access control (authenticated SELECT gap)
- [ ] **`knowledge/wiki/lessons/schema-not-null-enforcement.md`** — No wiki lesson on NOT NULL constraints for tenant_id columns
- [ ] **`knowledge/wiki/lessons/trigger-vs-constraint.md`** — No wiki lesson on trigger vs CHECK constraint tradeoffs (Río tables)
- [ ] **`knowledge/wiki/patterns/react-memoization-checklist.md`** — No wiki pattern on React memoization for data-heavy components

### Resolved Gaps (2026-04-11 Retro)

- [x] **`knowledge/wiki/patterns/standardized-error-handling.md`** — Created during retro
- [x] **`knowledge/wiki/patterns/error-boundaries.md`** — Created during retro
- [x] **`knowledge/wiki/patterns/data-layer-error-handling.md`** — Created during retro
- [x] **`knowledge/wiki/patterns/cron-endpoint-security.md`** — Created during retro
- [x] **`knowledge/wiki/patterns/build-config-security.md`** — Created during retro
- [x] **`knowledge/wiki/patterns/dependency-pinning.md`** — Created during retro
- [x] **`knowledge/wiki/patterns/file-upload-security.md`** — Created during retro
- [x] **`knowledge/wiki/patterns/i18n-security.md`** — Created during retro
- [x] **`knowledge/wiki/patterns/i18n-performance.md`** — Created during retro
- [x] **`knowledge/wiki/patterns/map-component-architecture.md`** — Created during retro
- [x] **`knowledge/wiki/lessons/cron-rls-mismatch.md`** — Created during retro
- [x] **`knowledge/wiki/lessons/idor-prevention.md`** — Created during retro
- [x] **`knowledge/wiki/lessons/toctou-race-conditions.md`** — Created during retro
- [x] **`knowledge/wiki/lessons/rls-policy-review-checklist.md`** — Created during retro
- [x] **`knowledge/wiki/lessons/magic-byte-validation.md`** — Created during retro
- [x] **`knowledge/wiki/lessons/backoffice-client-side-mutations.md`** — Created during retro

---

*Last updated: 2026-04-11 (Retro compilation — 16 gaps resolved)*
