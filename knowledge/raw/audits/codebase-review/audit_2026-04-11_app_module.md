---
title: "Audit 2026-04-11: App Directory Module Review"
date: 2026-04-11
type: module
focus: security, performance, quality, understanding
scope: app/ directory (actions, api, pages)
---

# Audit: App Directory Module Review

**Date**: 2026-04-11  
**Type**: Module (app/ directory)  
**Focus**: Security, Performance, Code Quality, Understanding  
**Scope**: `app/actions/`, `app/api/`, `app/t/[slug]/` pages, `app/backoffice/`

---

## Context

Following the full codebase audit, this module-level audit focuses specifically on the Next.js application layer:
- **Server Actions**: 28 files in `app/actions/`
- **API Routes**: 25+ routes in `app/api/`
- **Pages**: Tenant-scoped pages under `app/t/[slug]/`
- **Backoffice**: Super-admin interface in `app/backoffice/`

This audit verifies and extends findings from the prior full codebase review, with specific focus on patterns within the `app/` directory.

---

## Prior Work

- **Full Codebase Audit** (2026-04-11): Found 5 security findings, 8 performance issues, type safety concerns
- **Wiki Patterns**: 11 patterns available including `server-actions.md`, `security-patterns.md`, `backend-first-auth.md`
- **Build Logs**: 72+ sprint logs with implementation context

---

## Understanding Mapping

### Architecture - App Directory

| Layer | Files | Purpose |
|-------|-------|---------|
| **Server Actions** | 28 files in `app/actions/` | Mutation handlers (create, update, delete) |
| **API Routes** | 25+ routes in `app/api/` | REST endpoints (`/api/v1/*`) |
| **Tenant Pages** | `app/t/[slug]/*` | User-facing pages (dashboard, events, etc.) |
| **Backoffice** | `app/backoffice/*` | Super-admin interface |
| **Auth** | `app/auth/*` | Password confirmation flow |

### Entry Points

| Entry Point | Path | Handler |
|-------------|------|---------|
| **REST API** | `/api/v1/*` | Route handlers in `app/api/v1/` |
| **Server Actions** | Direct import | Actions in `app/actions/*.ts` |
| **Pages** | `/t/[slug]/*` | Next.js pages in `app/t/[slug]/` |
| **Cron Jobs** | `/api/cron/*` | Scheduled tasks |

### Data Flow

```
Client Component
    ├── Server Action (useActionState) → app/actions/*.ts
    │       └── lib/data/* → Supabase (RLS)
    │
    ├── API Fetch → app/api/v1/*.ts
    │       └── lib/data/* → Supabase (RLS)
    │
    └── Page Navigation → app/t/[slug]/*/page.tsx
            └── Server Components → lib/data/*
```

### Key Dependencies

- **Data Layer**: `lib/data/*.ts` (residents, events, families, exchange)
- **API Utilities**: `lib/api/middleware.ts`, `lib/api/response.ts`
- **Supabase**: `lib/supabase/server.ts`, `lib/supabase/client.ts`
- **Validation**: `lib/validation/schemas.ts`

---

## Security Findings

| # | Finding | File | Severity |
|---|---------|------|----------|
| 1 | No rate limiting on password reset | `app/actions/auth-actions.ts` | HIGH |
| 2 | Weak sameSite cookie (last-active) | `lib/supabase/middleware.ts` | MEDIUM |
| 3 | Missing explicit CSRF on server actions | `app/actions/*.ts` | MEDIUM |
| 4 | No input sanitization in API body parsing | `app/api/v1/*.ts` | MEDIUM |
| 5 | Inconsistent error responses leak info | Multiple API routes | LOW |

### Finding 1: No Rate Limiting on Password Reset

**Severity**: HIGH  
**File**: `app/actions/auth-actions.ts:63-145`

The `resetPassword()` action has anti-enumeration protection (returns `success: true` always), but lacks application-level rate limiting:

```typescript
// Current: No rate limit check
export async function resetPassword(email: string, tenantSlug: string) {
    // ... sends reset email without rate limiting
}
```

**Remediation**: Add rate limiting using Supabase or custom Redis-based limiting.

### Finding 4: Raw JSON Body Parsing

**Severity**: MEDIUM  
**Files**: `app/api/v1/residents/route.ts`, `app/api/v1/events/route.ts`

```typescript
// No validation before JSON parse
const body = await request.json()
```

**Remediation**: Add early validation or use Zod middleware.

---

## Performance Findings

| # | Finding | File | Impact | Effort |
|---|---------|------|--------|--------|
| 1 | N+1 flag counts in events | `app/actions/events.ts` | HIGH | Medium |
| 2 | N+1 flag counts in exchange | `app/actions/exchange-listings.ts` | HIGH | Medium |
| 3 | Double query getEventById | `lib/data/events.ts` | MEDIUM | Low |
| 4 | Unoptimized dashboard stats | `app/api/dashboard/stats/route.ts` | HIGH | High |
| 5 | Missing composite index on events | Database | HIGH | Low |
| 6 | Large bundle (shadcn/ui full) | `app/` | MEDIUM | High |

### Finding 1: N+1 Pattern in Server Actions

```typescript
// app/actions/events.ts - Flag count enrichment
if (enrichWithFlagCount) {
    const flagCounts = await Promise.all(
        eventIds.map(async (eventId: string) => {
            const { data: count } = await supabase.rpc("get_event_flag_count", {
                p_event_id: eventId,
                p_tenant_id: tenantId,
            })
            return { eventId, count: count ?? 0 }
        })
    )
}
```

**Impact**: 50 events = 50 RPC calls.

---

## Code Quality Findings

### Type Safety Issues

| Category | Count | Example |
|----------|-------|---------|
| `any` in data layer | 185+ | `resident: any`, `family: any` |
| Missing exports | 5 | `GetResidentsFilter`, `EventCreate` |
| Untyped API responses | 3+ | `as any` in routes |

### Inconsistent Error Handling

**3 patterns observed in `app/` directory:**

1. **Server Actions**: `{ success: true }` on failure (anti-enumeration)
   ```typescript
   // app/actions/auth-actions.ts
   return { success: true } // Always returns success
   ```

2. **API Routes**: `NextResponse.json({ error })`
   ```typescript
   // app/api/v1/residents/route.ts
   return errorResponse(error)
   ```

3. **Some Actions**: `throw new Error()`
   ```typescript
   throw new ValidationError('Insufficient permissions')
   ```

### Testing Coverage (app/)

| Area | Coverage |
|------|----------|
| `app/actions/` | Minimal (3 test files) |
| `app/api/v1/` | Minimal (gate.test.ts) |
| `app/t/[slug]/` components | Some storybooks |

**Critical gap**: No tests for business logic in server actions.

---

## Recommendations

### Immediate (Critical)

| # | Action | File |
|---|--------|------|
| 1 | Add rate limiting to password reset | `app/actions/auth-actions.ts` |
| 2 | Fix N+1 flag count queries (batch RPC) | `app/actions/events.ts` |
| 3 | Add composite index (tenant_id, status, start_date) | Database |

### Short-term (High Priority)

| # | Action | File |
|---|--------|------|
| 4 | Fix double-query patterns | `lib/data/events.ts` |
| 5 | Add TypeScript interfaces to data layer | `lib/data/*.ts` |
| 6 | Standardize error handling | `app/actions/`, `app/api/` |
| 7 | Add input validation middleware | `app/api/v1/*.ts` |

### Medium-term (Improvements)

| # | Action |
|---|--------|
| 8 | Add tests to `app/actions/` |
| 9 | Add Zod validation to all API POST bodies |
| 10 | Consider `sameSite: "strict"` for auth cookies |
| 11 | Lazy load shadcn/ui components |

---

## Next Steps

1. **Create GitHub issues** for critical findings
2. **Verify** N+1 patterns in action files (not just data layer)
3. **Add** input validation to API routes
4. **Schedule** follow-up after fixes applied

---

*Audit completed: 2026-04-11*