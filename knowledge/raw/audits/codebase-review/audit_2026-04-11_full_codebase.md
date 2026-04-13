---
title: "Audit 2026-04-11: Full Codebase Review"
date: 2026-04-11
type: top-level
focus: security, performance, quality, understanding
scope: entire codebase
---

# Audit: Full Codebase Review

**Date**: 2026-04-11  
**Type**: Top-level  
**Focus**: Security, Performance, Code Quality, Understanding  
**Scope**: Entire Ecovilla codebase (app/, lib/, components/, supabase/)

---

## Context

Comprehensive audit of the Ecovilla Community Platform following Socratic Gate clarification:
- **Type**: Top-level (whole codebase)
- **Focus**: All (security, performance, code quality, understanding)
- **Depth**: Full analysis (~2 hours)
- **Known concerns**: None specified

This is the first formal audit of the codebase. No prior audits exist.

---

## Prior Work

- **Wiki**: 11 patterns, 5 lessons, tool-specific guidance available
- **Build logs**: 72+ sprint logs in `knowledge/raw/build-logs/`
- **No prior audits**: `knowledge/raw/audits/` was empty

---

## Understanding Mapping

### Architecture Overview

| Layer | Technology | Key Files |
|-------|------------|-----------|
| **Frontend** | Next.js 16.1.7, React 19, shadcn/ui | `app/`, `components/` |
| **Backend** | Next.js API routes + Server Actions | `app/api/`, `app/actions/` |
| **Database** | Supabase (PostgreSQL + RLS) | `supabase/migrations/` |
| **Auth** | Supabase SSR via `@supabase/ssr` | `lib/supabase/middleware.ts` |
| **AI** | Río (RAG), Mastra (agents) | `packages/rio-agent/`, `lib/ai/` |

### Entry Points

| Entry Point | Path | Purpose |
|-------------|------|---------|
| **Auth** | `lib/supabase/middleware.ts` | Session refresh, timeout enforcement |
| **API** | `app/api/v1/` | REST API endpoints |
| **Server Actions** | `app/actions/*.ts` | Mutation handlers |
| **Pages** | `app/t/[slug]/` | Tenant-scoped pages |

### Data Flow

```
User Request → Middleware (auth) → Route/Action → Data Layer → Supabase (RLS)
                    ↓
            92 tables, RLS enforced, tenant_id isolation
```

### Key Dependencies

- **Supabase client**: `lib/supabase/server.ts`, `lib/supabase/client.ts`
- **Data layer**: `lib/data/*.ts` (11 files)
- **Components**: `components/` (~100+ files)
- **Storage**: Path-prefixed per tenant via `lib/supabase-storage.ts`

---

## Security Findings

| # | Finding | File | Severity |
|---|---------|------|----------|
| 1 | No rate limiting on password reset | `app/actions/auth-actions.ts` | HIGH |
| 2 | Weak sameSite cookie configuration | `lib/supabase/middleware.ts` | MEDIUM |
| 3 | Missing explicit CSRF protection | `app/actions/*.ts` | HIGH (low priority) |
| 4 | RLS policies need verification | `supabase/migrations/` | MEDIUM |
| 5 | No email enumeration prevention test | `app/actions/auth-actions.ts` | MEDIUM |

### Finding 1: No Rate Limiting on Password Reset

**Severity**: HIGH  
**File**: `app/actions/auth-actions.ts:63-145`

Attackers can abuse `resetPassword()` for email enumeration or exhaust Supabase's auth rate limit.

**Remediation**: Add application-level rate limiting:
```typescript
import { rateLimit } from "@/lib/rate-limit"

export async function resetPassword(email: string, tenantSlug: string) {
    const rateCheck = await rateLimit(`reset:${tenantSlug}`, 3, "1 m")
    if (!rateCheck.success) {
        return { success: true } // Fail silently
    }
    // ... rest
}
```

### Finding 2: Weak SameSite Cookie Configuration

**Severity**: MEDIUM  
**File**: `lib/supabase/middleware.ts:118-125`

```typescript
response.cookies.set("last-active", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",  // Should be "strict" for auth cookies
    maxAge: 2 * 60 * 60,
    path: "/",
})
```

**Status**: Acceptable risk — Next.js has built-in CSRF protection.

### Finding 3: Missing Explicit CSRF Protection

**Severity**: HIGH (low priority)  
**Files**: `app/actions/*.ts`

No explicit CSRF token validation in server actions, but:
- Next.js enforces same-origin policy
- Actions only respond to POST
- Supabase JWT via cookies

**Remediation**: Add origin validation for defense-in-depth.

---

## Performance Findings

| # | Finding | File | Impact | Effort |
|---|---------|------|--------|--------|
| 1 | N+1 flag counts (events) | `lib/data/events.ts` | HIGH | Medium |
| 2 | N+1 flag counts (exchange) | `lib/data/exchange.ts` | HIGH | Medium |
| 3 | Double query getEventById | `lib/data/events.ts` | MEDIUM | Low |
| 4 | Double query getResidentById | `lib/data/residents.ts` | MEDIUM | Low |
| 5 | Dashboard N sequential queries | `app/api/dashboard/stats/route.ts` | HIGH | High |
| 6 | Client-side check-in filtering | `app/api/dashboard/stats/route.ts` | HIGH | Medium |
| 7 | Missing composite index events | Database | HIGH | Low |
| 8 | Missing select() clauses | Multiple files | MEDIUM | Low |

### N+1 Query Pattern (Finding 1)

```typescript
// lib/data/events.ts:180-195
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

**Impact**: 50 events = 50 RPC calls. Should use batch RPC.

**Remediation**: Create `get_event_flag_counts(p_event_ids uuid[], p_tenant_id uuid)`.

### Double Query Pattern (Finding 3)

```typescript
// lib/data/events.ts:250-265
export async function getEventById(eventId: string) {
    const { data: event } = await supabase.from("events").select("tenant_id").eq("id", eventId).single()
    if (!event) return null
    
    const events = await getEvents(event.tenant_id, { ...options, startDate: undefined, endDate: undefined })
    return events.find((e) => e.id === eventId) || null
}
```

**Impact**: Two DB calls when one suffices. Fetches all events, filters in memory.

**Remediation**: Create dedicated `getEventByIdQuery` with direct ID lookup.

### Missing Composite Index (Finding 7)

**Query pattern**:
```typescript
query = supabase.from("events").select(...)
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .gte("start_date", startDate)
    .lte("start_date", endDate)
```

**Current index**: `idx_events_tenant_date` on `(tenant_id, start_date DESC)`  
**Missing**: Index on `(tenant_id, status, start_date DESC)`

---

## Code Quality Findings

### Type Safety (HIGH Priority)

| Category | Count | Example |
|----------|-------|---------|
| `any` types in data layer | 185+ | `resident: any`, `family: any` |
| Missing interface exports | 5 | `GetResidentsFilter`, `EventCreate` |
| Untyped props in components | 3+ | Form handlers |

**Priority files**: `lib/data/residents.ts`, `lib/data/families.ts`, `lib/data/exchange.ts`

### Error Handling (MEDIUM Priority)

**3 different patterns**:
1. `{ success: boolean, error?: string }` — Most common
2. `throw new Error()` — Some validation paths
3. `NextResponse.json()` — API routes

**Inconsistency**: Server actions return `{ success: true }` even on failure (for security), but API routes throw.

### Testing Coverage (HIGH Priority)

- `lib/data/`: 0 tests
- `app/actions/`: Minimal tests
- Components: Some have tests, most don't

**Critical business logic untested**: Data layer (residents, families, events, exchange)

---

## Database Architecture

### Schema Summary

| Domain | Tables | Purpose |
|--------|--------|---------|
| **Core** | tenants, users | Multi-tenancy |
| **Locations** | locations, neighborhoods, lots | Geographic hierarchy |
| **Events** | events, event_rsvps, event_images | Community events |
| **Exchange** | exchange_listings, exchange_transactions | Marketplace |
| **Río** | rio_documents, rio_embeddings | AI/RAG |
| **Mastra** | mastra_* (20+ tables) | Agent framework |

**Total**: 92 tables with RLS enabled

### Tenant Isolation

- `tenant_id` column on all user-facing tables
- RLS policies enforce `tenant_id = auth.jwt() ->> tenant_id`
- Storage path-prefixed per tenant
- 3-tier roles: super_admin, tenant_admin, resident

---

## Recommendations

### Immediate (Critical)

| # | Action | Priority |
|---|--------|----------|
| 1 | Add rate limiting to password reset | HIGH |
| 2 | Fix N+1 flag count queries | HIGH |
| 3 | Add composite index on events (tenant_id, status, start_date) | HIGH |
| 4 | Fix client-side check-in filtering | HIGH |

### Short-term (High Priority)

| # | Action | Priority |
|---|--------|----------|
| 5 | Fix all double-query patterns (getEventById, getResidentById, etc.) | MEDIUM |
| 6 | Add TypeScript interfaces to data layer (remove `any`) | MEDIUM |
| 7 | Add total count to paginated endpoints | MEDIUM |
| 8 | Standardize error handling pattern | MEDIUM |

### Medium-term (Improvements)

| # | Action | Priority |
|---|--------|----------|
| 9 | Add explicit `select()` clauses (fetch specific columns) | LOW |
| 10 | Add tests to `lib/data/*.ts` | LOW |
| 11 | Consider `sameSite: "strict"` for auth cookies | LOW |
| 12 | Add caching to frequently-called actions | LOW |

---

## Next Steps

1. **Create GitHub issues** for critical findings (rate limiting, N+1 queries)
2. **Prioritize** fixes based on impact/effort matrix above
3. **Add tests** to data layer before refactoring
4. **Schedule** follow-up audit after fixes applied