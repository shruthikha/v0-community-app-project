# Standardized Error Handling Pattern

> Three coexisting error response shapes across the codebase create confusion and inconsistent user experiences.

## Current State

The codebase has **3 different error handling patterns**:

### Pattern 1: Server Action Success Object
```typescript
// Most common — used in auth-actions.ts
return { success: true }
return { success: false, error: "Something went wrong" }
```

### Pattern 2: Throw Error
```typescript
// Used in validation paths
throw new ValidationError("Insufficient permissions")
throw new Error("User not found")
```

### Pattern 3: API Response
```typescript
// Used in API routes
return NextResponse.json({ error: "Not found" }, { status: 404 })
return errorResponse(new APIError("Internal error", 500))
```

## The Problem

- Callers can't predict return shapes
- Error details leak to clients (80+ instances of `error.message` exposure)
- 24 `alert()` calls instead of toast notifications
- Dual toast systems (shadcn `useToast` + `sonner`)
- Data layer swallows errors and returns `[]`

## Error Sanitization Helper

```typescript
// lib/error-sanitization.ts

/**
 * Sanitize errors for client responses.
 * Never expose internal details, stack traces, or DB schema.
 */
export function sanitizeError(error: unknown, fallback = "An unexpected error occurred"): string {
  if (error instanceof Error) {
    // Only expose known, safe error types
    if (error.name === "ValidationError" || error.name === "AuthError") {
      return error.message
    }
    // Log full error server-side
    console.error("[sanitizeError] Internal error:", error)
    return fallback
  }
  return fallback
}

/**
 * Log error with full details (server-side only).
 */
export function logError(context: string, error: unknown, metadata?: Record<string, unknown>) {
  console.error(`[${context}]`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...metadata,
  })
}
```

## Standardized Return Contract

### Read Operations
```typescript
interface Result<T> {
  data: T | null
  error: string | null
}

// Usage
const result = await getEvents(tenantId)
if (result.error) {
  // Handle error — caller knows it's an error, not "no data"
}
```

### Write Operations
```typescript
interface MutationResult {
  success: boolean
  error?: string
  data?: unknown
}

// Usage
const result = await createEvent(data)
if (!result.success) {
  toast.error(result.error ?? "Failed to create event")
}
```

## Alert Replacement

Replace all `alert()` calls with toast:

```typescript
// ❌ BEFORE
alert("Tenant created successfully")
alert("Failed to delete tenant")

// ✅ AFTER
import { toast } from "sonner"
toast.success("Tenant created successfully")
toast.error("Failed to delete tenant")
```

## Consolidate Toast Systems

The codebase uses both `useToast` (shadcn) and `sonner`. Standardize on one:

```typescript
// Recommended: sonner (simpler API, better positioning)
import { toast } from "sonner"

toast.success("Saved")
toast.error("Failed to save")
toast.warning("Check your input")
toast.info("Processing...")
```

## Existing Infrastructure (Use It)

The codebase already has well-designed error infrastructure:

- `lib/api/errors.ts` — Custom error classes (used by 11 files)
- `lib/api/response.ts` — Response helpers (used by 14 files)

**Extend these** rather than creating new patterns.

## Checklist

- [ ] Define consistent return contract for read/write operations
- [ ] Create `sanitizeError()` helper
- [ ] Replace all `alert()` calls with toast
- [ ] Consolidate to single toast system
- [ ] Add error boundaries at route level
- [ ] Destructure `{ data, error }` on all Supabase queries
- [ ] Log full errors server-side, return sanitized messages to client

## Related Patterns

- `patterns/error-boundaries.md` — Error boundary placement
- `patterns/data-layer-error-handling.md` — Data layer error contracts
- `tools/server-actions-patterns.md` — Server action patterns
