---
title: "Audit 2026-04-11: Lib Directory Module Review"
date: 2026-04-11
type: module
focus: security, performance, quality, understanding
scope: lib/ directory
---

# Audit: Lib Directory Module Review

**Date**: 2026-04-11  
**Type**: Module (lib/ directory)  
**Focus**: Security, Performance, Code Quality, Understanding  
**Scope**: Entire `lib/` directory (60+ files)

---

## Context

This module-level audit focuses specifically on the `lib/` directory, which serves as the core shared library for the Ecovilla Community Platform:

- **Data Layer**: Database access functions (residents, events, families, exchange, check-ins)
- **Supabase Clients**: Server and browser clients, middleware, admin utilities
- **API Utilities**: Middleware, error classes, response helpers
- **Validation**: Zod schemas for input validation
- **Utilities**: Privacy, geolocation, i18n, analytics, hooks
- **Security**: Rate limiting, sanitization, upload security

This audit complements the prior `app/` directory audit and extends findings to the shared library layer.

---

## Prior Work

- **Full Codebase Audit** (2026-04-11): Found 5 security findings, 8 performance issues, type safety concerns
- **App Module Audit** (2026-04-11): Detailed security, performance, and code quality findings
- **Wiki Patterns**: 11 patterns including `supabase-multi-tenancy.md`, `security-patterns.md`, `backend-first-auth.md`

---

## Understanding Mapping

### Architecture - Lib Directory

| Layer | Files | Purpose |
|-------|-------|---------|
| **Data Access** | `lib/data/*.ts` | Database queries with RLS |
| **Supabase** | `lib/supabase/*.ts` | Client initialization |
| **API** | `lib/api/*.ts` | Route middleware, errors |
| **Validation** | `lib/validation/*.ts` | Zod schemas |
| **Security** | `lib/rate-limit.ts`, `lib/sanitize-html.ts` | Rate limiting, XSS prevention |
| **i18n** | `lib/i18n/*.ts|json` | Translations |
| **Utilities** | `lib/privacy-utils.ts`, `lib/geojson-parser.ts` | Feature utilities |
| **Location** | `lib/location-utils.ts`, `lib/geolocate.ts` | Geolocation |
| **Dashboard** | `lib/dashboard/*.ts` | Stats calculations |

### Entry Points

| Entry Point | File | Public APIs |
|------------|------|------------|
| **Data Layer** | `lib/data/index.ts` | `getResidents()`, `getEvents()`, `getFamilies()`, `getExchangeListings()`, `getCheckIns()` |
| **Supabase Server** | `lib/supabase/server.ts` | `createClient()`, `createServerClient()` |
| **Supabase Browser** | `lib/supabase/client.ts` | `createClient()`, `createBrowserClient()` |
| **API Middleware** | `lib/api/middleware.ts` | `withAuth()`, `withTenantIsolation()`, `withRole()` |
| **API Errors** | `lib/api/errors.ts` | `APIError`, `AuthError`, `ForbiddenError`, etc. |
| **Validation** | `lib/validation/schemas.ts` | `residentSchema`, `eventSchema`, `locationSchema`, `exchangeSchema` |
| **Rate Limiting** | `lib/rate-limit.ts` | `rateLimit()` |
| **Privacy** | `lib/privacy-utils.ts` | `applyPrivacyFilter()`, `filterPrivateData()` |

### Data Flow

```
API Route / Server Action
    ├── lib/api/middleware.ts (withAuth, withTenantIsolation, withRole)
    │       └── lib/supabase/server.ts (createClient)
    │
    ├── lib/data/*.ts (getResidents, getEvents, etc.)
    │       └── lib/supabase/server.ts
    │           └── Supabase (RLS)
    │
    └── lib/privacy-utils.ts (applyPrivacyFilter)
            └── Response to client
```

### Key Dependencies

- **@supabase/ssr**: Server and browser client creation
- **@upstash/ratelimit**: Rate limiting
- **zod**: Input validation
- **react**: `cache()` for memoization

### Module Organization

```
lib/
├── ai/                    # AI configuration, injection filter
├── api/                   # API middleware, errors, response helpers
├── data/                  # Database access layer (core)
│   ├── residents.ts        # Resident queries
│   ├── events.ts          # Event queries
│   ├── families.ts        # Family queries
│   ├── exchange.ts       # Exchange listing queries
│   ├── check-ins.ts     # Check-in queries
│   ├── locations.ts     # Location queries
│   └── index.ts         # Re-exports
├── supabase/              # Supabase clients
│   ├── server.ts        # Server client
│   ├── client.ts        # Browser client
│   ├── admin.ts        # Admin client
│   ├── middleware.ts   # Session management
│   └── middleware.test.ts
├── validation/            # Zod schemas
├── utils/                 # Utility functions
├── hooks/                # React hooks
├── i18n/                # Translations
├── dashboard/            # Dashboard stats
├── design-system/        # Design system constants
└── *.ts                 # Top-level utilities
```

---

## Security Findings

| # | Finding | File | Severity |
|---|---------|------|----------|
| 1 | Debug console.log statements in production | Multiple files | HIGH |
| 2 | SameSite: "lax" cookie (not "strict") | `lib/supabase/middleware.ts:121` | MEDIUM |
| 3 | Rate limiting fails open (no enforcement) | `lib/rate-limit.ts:31-36` | MEDIUM |
| 4 | Debug logging with PII potential | `lib/data/residents.ts:158-184` | LOW |
| 5 | Console stack traces may leak info | `lib/*.ts` | LOW |

### Finding 1: Debug Console Statements in Production

**Severity**: HIGH  
**Files** (56 instances across lib/):

- `lib/supabase/middleware.ts`: Session debug logs
- `lib/data/residents.ts`: `[DEBUG]` statements with user IDs
- `lib/data/events.ts`: Error logging
- `lib/coordinate-transformer.ts`: Conversion debug logs
- `lib/location-utils.ts`: Location debug logs
- `lib/dashboard/stats-config.ts`: Unknown persona log

```typescript
// lib/data/residents.ts:158-184
console.log('[DEBUG] getResidentById called:', { userId, options })
console.log('[DEBUG] User tenant lookup:', { userId, userData, userError })
console.log('[DEBUG] No tenant_id found for user, returning null')
console.log('[DEBUG] getResidentById results:', {
    userId,
    tenantId: userData.tenant_id,
    foundCount: residents.length,
    resident: residents[0] ? { id: residents[0].id, name: `${residents[0].first_name} ${residents[0].last_name}` } : null
})
```

**Remediation**: Remove all debug console statements, or use a structured logger that respects LOG_LEVEL env var.

### Finding 2: SameSite Cookie Not Strict

**Severity**: MEDIUM  
**File**: `lib/supabase/middleware.ts:121`

```typescript
// Current: sameSite: "lax"
response.cookies.set("last-active", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",  // Should be "strict" for max security
    maxAge: 2 * 60 * 60,
    path: "/",
})
```

**Remediation**: Consider `sameSite: "strict"` for auth cookies to prevent CSRF.

### Finding 3: Rate Limiting Fails Open

**Severity**: MEDIUM  
**File**: `lib/rate-limit.ts:31-36`

```typescript
// Current: Fails open - allows requests when Redis is unavailable
if (!redis) {
    if (process.env.NODE_ENV === "production") {
        console.warn("Rate limiting disabled: UPSTASH_REDIS_REST_URL not set");
    }
    return { success: true, limit, remaining: limit, reset: Date.now() };
}
```

**Impact**: If Redis becomes unavailable, rate limiting is bypassed entirely in production.

**Remediation**:
1. Fail closed in production (deny requests)
2. Add monitoring/alerting when rate limiting degrades
3. Consider a circuit breaker pattern

### Finding 4: PII in Debug Logs

**Severity**: LOW (but concerning)  
**File**: `lib/data/residents.ts:158-184`

The debug logs include user IDs and names, which could expose PII in server logs.

---

## Performance Findings

| # | Finding | File | Impact | Effort |
|---|---------|------|--------|--------|
| 1 | N+1 flag counts in events | `lib/data/events.ts:265-276` | HIGH | Medium |
| 2 | Double-query pattern | `lib/data/events.ts:381-393` | MEDIUM | Low |
| 3 | Unbounded queries | `lib/data/*.ts` | MEDIUM | Low |
| 4 | Missing caching on heavy operations | `lib/data/residents.ts:154-188` | MEDIUM | Medium |
| 5 | No query-timeout on Supabase | Multiple files | MEDIUM | Low |

### Finding 1: N+1 Pattern for Flag Counts

**Severity**: HIGH  
**File**: `lib/data/events.ts:265-276`

```typescript
// N+1 pattern - makes one RPC call per event
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
    flagCounts.forEach((f) => flagCountMap.set(f.eventId, f.count))
}
```

**Impact**: 100 events = 100 RPC calls.

**Remediation**: Create a batch RPC that accepts an array of event IDs.

### Finding 2: Double Query Pattern in getEventById

**Severity**: MEDIUM  
**File**: `lib/data/events.ts:375-394`

```typescript
// getEventById first queries tenant_id, then calls getEvents with filters
export async function getEventById(
    eventId: string,
    options: GetEventsOptions = {},
): Promise<EventWithRelations | null> {
    const supabase = await createServerClient()

    // First query: get tenant_id
    const { data: event } = await supabase.from("events").select("tenant_id").eq("id", eventId).single()

    if (!event) {
        return null
    }

    // Second query: calls getEvents which rebuilds the query
    const events = await getEvents(event.tenant_id, {
        ...options,
        startDate: undefined,
        endDate: undefined
    })

    return events.find((e) => e.id === eventId) || null
}
```

**Remediation**: Accept optional tenant_id in getEvents to avoid the double query.

### Finding 3: Unbounded Queries

**Severity**: MEDIUM  
**Files**: `lib/data/residents.ts`, `lib/data/events.ts`, etc.

Some queries don't have `limit` applied, which could lead to OOM in large tenants.

**Remediation**: Add default limits to all list queries.

---

## Code Quality Findings

### Type Safety Issues

| Category | Count | Example |
|----------|-------|---------|
| `any` type usage | 60+ | `event: any`, `resident: any`, `location: any` |
| Untyped API responses | 3+ | Missing inferred types |
| Weak index signatures | 3 | `[key: string]: any` |

### `any` Type Distribution

```
lib/data/resident-requests.ts:      11 instances
lib/data/exchange.ts:               6 instances
lib/data/events.ts:              4 instances
lib/data/locations.ts:            14 instances
lib/geojson-parser.ts:          14 instances
lib/coordinate-transformer.ts:  4 instances
lib/data/check-ins.ts:           4 instances
lib/data/residents.ts:            1 instance
lib/privacy-utils.ts:          1 instance
lib/utils/filter-expired-checkins.ts: 1 instance
```

### Example: Type Safety Gaps

```typescript
// lib/data/residents.ts:127
return residents.map((resident: any) => {
    const base: ResidentWithRelations = {
        id: resident.id,
        first_name: resident.first_name,
        // ... rest of properties
    }
    return base
})

// lib/geojson-parser.ts:60
export function validateGeoJSON(data: any): ValidationResult {
    // ... function body
}
```

### Inconsistent Error Handling

**Pattern 1**: Console.error then return empty
```typescript
// lib/data/residents.ts:112
console.error("[get-residents] Error fetching residents:", error)
return []
```

**Pattern 2**: Console.error with full error details
```typescript
// lib/data/events.ts:226
console.error("[get-events] Error fetching events:", error)
return []
```

**Pattern 3**: Throw errors
```typescript
// lib/api/middleware.ts:90
throw new Error('Authentication failed')
```

### Testing Coverage (lib/)

| Area | Coverage | Test Files |
|------|----------|-----------|
| `lib/ai/*` | Good | `injection-filter.test.ts` |
| `lib/api/*` | Medium | `public-rate-limit.test.ts` |
| `lib/supabase/*` | Medium | `middleware.test.ts` |
| `lib/privacy/*` | Some | `privacy-utils.test.ts` |
| `lib/geojson/*` | Some | `geojson-parser.test.ts` |
| `lib/validation/*` | Some | `access-request-schema.test.ts` |
| `lib/data/*` | **None** | — |

**Critical gap**: No tests for data access functions.

---

## Recommendations

### Immediate (Critical)

| # | Action | File |
|---|--------|------|
| 1 | Remove all debug console.log statements | `lib/data/residents.ts`, `lib/coordinate-transformer.ts`, etc. |
| 2 | Fix N+1 flag count queries (batch RPC) | `lib/data/events.ts` |
| 3 | Add TypeScript interfaces replacing `any` | `lib/data/*.ts` |

### Short-term (High Priority)

| # | Action | File |
|---|--------|------|
| 4 | Set `sameSite: "strict"` for auth cookies | `lib/supabase/middleware.ts` |
| 5 | Fix rate limiting fail-open in production | `lib/rate-limit.ts` |
| 6 | Add default limits to all list queries | `lib/data/*.ts` |
| 7 | Add query timeout to Supabase clients | `lib/supabase/*.ts` |
| 8 | Remove PII from debug logs | `lib/data/residents.ts` |

### Medium-term (Improvements)

| # | Action | File |
|---|--------|------|
| 9 | Add tests to `lib/data/*` | Test coverage gap |
| 10 | Consolidate error handling patterns | `lib/data/*.ts`, `lib/api/*.ts` |
| 11 | Add structured logging | Replace console.* throughout |
| 12 | Add request tracing | `lib/api/middleware.ts` |

---

## Next Steps

1. **Create GitHub issues** for critical findings
2. **Verify** N+1 patterns in other data files (not just events)
3. **Remove** all debug console statements
4. **Add** TypeScript types replacing `any`
5. **Schedule** follow-up after fixes applied

---

## Wiki References

- `knowledge/wiki/patterns/supabase-multi-tenancy.md` — tenant_id mandate
- `knowledge/wiki/patterns/security-patterns.md` — security patterns
- `knowledge/wiki/patterns/backend-first-auth.md` — auth patterns

---

*Audit completed: 2026-04-11*