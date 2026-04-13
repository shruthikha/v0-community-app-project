---
title: Add error boundaries to prevent full page crashes
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: reliability
author: @orchestrator/audit
source: audit_2026-04-11_error_handling_crosscutting.md
---

# Add Error Boundaries

## Finding

Zero error boundaries exist in the entire application. No `error.tsx` files at route level, no `global-error.tsx` at root, no React Error Boundary class components. Any unhandled error in a client component crashes the entire React tree with no recovery path.

## Current State

- `error.tsx` files: 0
- `global-error.tsx`: 0
- React Error Boundary components: 0
- `loading.tsx` files: 0
- `not-found.tsx` files: 0

## Recommendation

1. **Add `app/global-error.tsx`** — Root-level error boundary for unrecoverable errors
2. **Add `app/t/[slug]/error.tsx`** — Tenant-scoped error boundary with recovery button
3. **Add `app/backoffice/error.tsx`** — Backoffice error boundary
4. **Add `app/t/[slug]/loading.tsx`** — Streaming fallback for tenant routes
5. **Add `app/not-found.tsx`** — Branded 404 page
6. **Consider `react-error-boundary`** for component-level boundaries around data-heavy widgets

## Impact

- **Reliability**: Single component errors won't crash entire pages
- **UX**: Users see friendly error messages with retry options
- **Debugging**: Error boundaries can capture and report context

## Effort

Medium — requires creating 5+ files and updating component structure for key widgets.
