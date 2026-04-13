---
title: Create standardized error handling pattern and wiki documentation
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: architecture
author: @orchestrator/audit
source: audit_2026-04-11_error_handling_crosscutting.md
---

# Standardized Error Handling Pattern

## Finding

The codebase has 3+ coexisting error handling patterns across server actions, API routes, data layer, and UI components. No wiki documentation exists for the standard pattern (explicitly listed in `knowledge/wiki/documentation-gaps.md`).

## Current State

- **Server actions**: Mix of `throw new Error()`, `return { success: false, error }`, and no try/catch
- **API routes**: v1 uses `errorResponse()`/`successResponse()` (good), legacy uses inline `NextResponse.json({ error })`
- **Data layer**: All 7 files swallow errors and return `[]`/`null` — callers can't distinguish "no data" from "DB down"
- **UI components**: 24 `alert()` calls, dual toast systems (shadcn + sonner), ~8 silent failures

## Recommendation

1. **Create `knowledge/wiki/patterns/standardized-error-handling.md`** documenting:
   - Server action error contract: `{ success: boolean, error?: string, data?: T }` with generic messages only
   - API route pattern: Always use `errorResponse()`/`successResponse()` from `lib/api/response.ts`
   - Data layer pattern: Return `Result<T, E>` or explicit `{ data, error }` tuples
   - UI pattern: Single toast system (recommend sonner), no `alert()`, error boundaries

2. **Create `lib/errors/sanitize-error.ts`** helper:
   ```typescript
   export function sanitizeError(error: unknown): string {
     // Log full error server-side
     console.error('[sanitized]', error)
     // Return generic message to client
     return 'An unexpected error occurred. Please try again.'
   }
   ```

3. **Migrate in phases**:
   - Phase 1: Fix critical leakage (C1 — ~80 instances of error.message exposure)
   - Phase 2: Add error boundaries (C5)
   - Phase 3: Consolidate toast systems (H6)
   - Phase 4: Fix data layer error swallowing (H3)

## Impact

- **Security**: Eliminates schema enumeration via error messages
- **Quality**: Single pattern reduces cognitive load and bugs
- **UX**: Consistent error feedback across the app

## Related

- Existing: `knowledge/raw/refactoring/2026-04-11_error_handling_patterns.md` (superseded by this)
- Existing: `knowledge/raw/refactoring/2026-04-11_upload-error-leakage.md` (subset of C1)
- Wiki gap: `knowledge/wiki/documentation-gaps.md` — explicitly lists this missing pattern
