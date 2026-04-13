---
title: "Audit 2026-04-11: Data Flow Cross-Cutting Review"
date: 2026-04-11
type: cross-cutting
focus: security, performance, code quality, understanding
scope: Data flow across lib/data/, app/actions/, app/api/v1/, lib/supabase/
---

# Audit: Data Flow Cross-Cutting Review

**Date**: 2026-04-11  
**Type**: Cross-cutting (Data Flow)  
**Focus**: Security, Performance, Code Quality, Understanding  
**Scope**: `lib/data/`, `app/actions/`, `app/api/v1/`, `lib/supabase/`

---

## Context

This cross-cutting audit examines data flow across the entire system:
- **Database Layer**: Supabase with RLS policies
- **Data Access Layer**: `lib/data/` functions
- **Server Actions**: `app/actions/` for mutations
- **API Routes**: `app/api/v1/` REST endpoints
- **Supabase Clients**: server, browser, admin clients

**Wiki Reference**: 
- `knowledge/wiki/patterns/supabase-multi-tenancy.md` — tenant_id mandate
- `knowledge/wiki/patterns/security-patterns.md` — service role verification
- `knowledge/wiki/patterns/backend-first-auth.md` — auth patterns

---

## Prior Work

- **Supabase Module Audit** (2026-04-11): Found 2 CRITICAL, 5 HIGH, 4 MEDIUM security issues
- **Lib Module Audit** (2026-04-11): Found N+1 queries, debug logging with PII, type safety gaps
- **Full Codebase Audit** (2026-04-11): Comprehensive findings across all modules
- **Wiki Patterns**: 11 patterns available for reference

---

## Understanding Mapping

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  - React Components                                             │
│  - useQuery/useMutation                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Server Actions / API Calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Server Actions (app/actions/)              │   │
│  │  - createEvent, updateProfileAction, rsvpToEvent       │   │
│  │  - Some have auth verification, some don't             │   │
│  └────────────────────┬──────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼──────────────────────────────────────┐   │
│  │              API Routes (app/api/v1/)                    │   │
│  │  - withTenantIsolation middleware                        │   │
│  │  - withAuth, withRole middleware                          │   │
│  └────────────────────┬──────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼──────────────────────────────────────┐   │
│  │              Data Layer (lib/data/)                      │   │
│  │  - getResidents, getEvents, getFamilies                 │   │
│  │  - getExchangeListings, getCheckIns                      │   │
│  └────────────────────┬──────────────────────────────────────┘   │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SUPABASE (RLS + Database)                       │
│  - RLS enforces tenant isolation                               │
│  - Service role bypasses RLS                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Entry Points

| Entry Point | File | Public APIs | Auth Model |
|-------------|------|-------------|------------|
| **Data Layer** | `lib/data/index.ts` | getResidents(), getEvents(), getFamilies(), getExchangeListings(), getCheckIns() | RLS via server client |
| **Server Actions** | `app/actions/*.ts` | createEvent(), updateProfileAction(), rsvpToEvent() | Mixed - some verify, some don't |
| **API Middleware** | `lib/api/middleware.ts` | withAuth(), withTenantIsolation(), withRole() | JWT + tenant check |
| **Admin Client** | `lib/supabase/admin.ts` | createAdminClient() | Service role (bypasses RLS) |

### Key Dependencies

- **@supabase/ssr**: Server and browser client creation
- **@supabase/supabase-js**: Admin client (service role)
- **@upstash/ratelimit**: API rate limiting
- **zod**: Input validation in API routes

---

## Findings Summary

### Critical (3)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| C1 | Admin client used without authorization verification | `app/actions/onboarding.ts`, `app/actions/interests.ts`, multiple API routes | IDOR vulnerability - any user can modify any user's data |
| C2 | No authorization check on server actions accepting userId | `app/actions/onboarding.ts:updateBasicInfo()`, `app/actions/profile.ts:updateProfileAction()` (partially fixed) | Vertical privilege escalation |
| C3 | Missing tenant_id validation on data layer insertions | `app/actions/onboarding.ts`, `app/actions/interests.ts` | Cross-tenant data contamination |

### High (6)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| H1 | N+1 query pattern for event flag counts | `lib/data/events.ts:265-276` | Performance - 100 events = 100 RPC calls |
| H2 | Debug console.log statements leaking PII | `lib/data/residents.ts:158-184` | Privacy violation in production logs |
| H3 | Rate limiting fails open in production | `lib/rate-limit.ts:31-36` | DOS vulnerability if Redis fails |
| H4 | Double-query pattern in getEventById | `lib/data/events.ts:375-393` | Performance - unnecessary round trips |
| H5 | Missing input validation on server actions | `app/actions/events.ts`, `app/actions/families.ts` | SQL injection risk (mitigated by Supabase) |
| H6 | SameSite cookie not "strict" | `lib/supabase/middleware.ts:121` | CSRF vulnerability |

### Medium (5)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| M1 | Heavy use of `any` type in data layer | `lib/data/residents.ts:127`, `lib/data/events.ts:350+` | Type safety concerns |
| M2 | No tests for data layer functions | `lib/data/*.ts` | Regression risk |
| M3 | Unbounded queries without default limits | `lib/data/*.ts` | Memory issues with large datasets |
| M4 | Inconsistent error handling patterns | Multiple files | Debugging difficulty |
| M5 | Missing query timeout on Supabase clients | `lib/supabase/server.ts` | Infinite hangs on slow queries |

### Low (3)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| L1 | Duplicate privacy tables in schema | `privacy_settings` vs `user_privacy_settings` | Schema confusion |
| L2 | Migration files left in place after cleanup | `20260318000000_OUTDATED_*` | Code clutter |
| L3 | Debug console statements throughout lib/ | 56+ instances | Performance + privacy |

---

## Detailed Findings

### C1: Admin Client Without Authorization (CRITICAL - REQUIRES IMMEDIATE FIX)

**Files Affected**:
- `app/actions/onboarding.ts` — functions: `updateBasicInfo`, `updateContactInfo`, `updateJourney`, `completeOnboarding`
- `app/actions/interests.ts` — all functions using admin client
- `app/t/[slug]/invite/[token]/validate-invite-action.ts`
- `app/t/[slug]/invite/[token]/create-auth-user-action.ts`
- `app/backoffice/invite/[token]/create-auth-user-action.ts`

**Pattern - VULNERABLE**:
```typescript
// app/actions/onboarding.ts:4-18
export async function updateBasicInfo(userId: string, data: {...}) {
    const supabase = createAdminClient()  // ← NO auth verification
    await supabase.from("users").update({...}).eq("id", userId)
}
```

**Contrast - CORRECT** (from `app/actions/profile.ts:18-31`):
```typescript
export async function updateProfileAction(userId: string, data: ProfileUpdateData) {
    // 0. Backend-First Security: Verify caller identity
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized: Please log in to update your profile.")
    }

    if (user.id !== userId) {
        throw new Error("Forbidden: You do not have permission to modify this profile.")
    }

    const supabase = createAdminClient()  // ← Only now is it safe
}
```

**Impact**: Any authenticated user can modify any other user's profile data by passing their user ID.

**Recommendation**: Add authorization check to ALL admin client operations. See `app/actions/profile.ts` as the reference implementation.

---

### H1: N+1 Pattern for Flag Counts (HIGH)

**Location**: `lib/data/events.ts:265-276`

```typescript
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

**Impact**: Loading 100 events requires 100 separate RPC calls.

**Recommendation**: Create a batch RPC that accepts an array of event IDs.

---

### H2: Debug Logging with PII (HIGH)

**Location**: `lib/data/residents.ts:158-184`

```typescript
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

**Impact**: User IDs and names logged to server output - potential PII exposure.

**Recommendation**: Remove all debug console statements or use a structured logger respecting LOG_LEVEL.

---

### H3: Rate Limiting Fails Open (HIGH)

**Location**: `lib/rate-limit.ts:31-36`

```typescript
if (!redis) {
    if (process.env.NODE_ENV === "production") {
        console.warn("Rate limiting disabled: UPSTASH_REDIS_REST_URL not set");
    }
    return { success: true, limit, remaining: limit, reset: Date.now() };  // ← Allows all requests
}
```

**Impact**: If Redis becomes unavailable, ALL rate limiting is bypassed.

**Recommendation**: Fail closed in production - deny requests when rate limiting degrades.

---

## Security Findings

### IDOR Vulnerabilities

| Vulnerability | Server Action | Impact |
|---------------|---------------|--------|
| Profile modification | `updateBasicInfo(userId)` in onboarding.ts | Any user can modify any user's basic info |
| Contact info update | `updateContactInfo(userId)` in onboarding.ts | Any user can modify any user's contact info |
| Journey stage update | `updateJourney(userId)` in onboarding.ts | Any user can modify any user's journey |
| Interests update | `updateInterests(userId, interestIds)` | Any user can modify any user's interests |
| Skills update | `updateSkills(userId, skills)` | Any user can modify any user's skills |

### Input Validation Gaps

| Area | Finding | Risk |
|------|---------|------|
| Server Actions | No Zod validation on input parameters | Type confusion attacks |
| API Routes | Some routes validate (access-request), others don't | Inconsistent security |
| Data Layer | No validation - trusts caller | Depends on caller validation |

---

## Performance Findings

### Query Patterns

| Pattern | Location | Issue | Recommendation |
|---------|----------|-------|-----------------|
| N+1 RPC calls | `lib/data/events.ts:265` | 100 events = 100 calls | Batch RPC |
| Double query | `lib/data/events.ts:375` | tenant lookup then full query | Accept tenantId param |
| Unbounded | `lib/data/residents.ts` | No limit on list queries | Add default limits |
| Missing cache | `lib/data/families.ts` | No caching on repeated calls | Add React cache() |

### Client Configuration

| Setting | Current | Recommendation |
|---------|---------|----------------|
| Query timeout | None | Add 30s timeout |
| Retry policy | Default | Configure explicit retries |
| Connection pool | Default | Monitor in production |

---

## Code Quality Findings

### Type Safety

| Area | Issues | Count |
|------|--------|-------|
| Data layer mappings | `any` type in map functions | 60+ |
| Event interface | Missing properties | 3 |
| Response types | Untyped | 5 |

### Test Coverage

| Area | Coverage | Notes |
|------|----------|-------|
| lib/data/* | NONE | Critical gap |
| lib/api/middleware | Some | Has tests |
| lib/supabase/* | Some | middleware tested |
| Server actions | None | Direct integration only |

---

## Recommendations

### Immediate (This Sprint)

- [ ] **Fix C1**: Add auth verification to all admin client operations in `app/actions/onboarding.ts` and `app/actions/interests.ts`
- [ ] **Fix H2**: Remove debug console.log statements from `lib/data/residents.ts`
- [ ] **Fix H3**: Make rate limiting fail-closed in production

### Short-term (Next Sprint)

- [ ] **Fix H1**: Create batch RPC for flag counts in events
- [ ] **Fix H4**: Optimize getEventById to accept tenantId
- [ ] Add Zod validation to server actions
- [ ] Add default limits to all list queries

### Medium-term (Backlog)

- [ ] Add tests to `lib/data/` functions
- [ ] Replace `any` types with proper interfaces
- [ ] Add query timeout to Supabase clients
- [ ] Set `sameSite: "strict"` for auth cookies
- [ ] Consolidate error handling patterns

---

## Files Analyzed

### Data Layer
- `lib/data/index.ts` — Exports
- `lib/data/residents.ts` — 188 lines
- `lib/data/events.ts` — 450+ lines
- `lib/data/families.ts` — 135 lines
- `lib/data/exchange.ts` — 250+ lines
- `lib/data/check-ins.ts` — Not read (deduced from index)

### Server Actions
- `app/actions/onboarding.ts` — VULNERABLE
- `app/actions/profile.ts` — SECURE (reference)
- `app/actions/events.ts` — 700+ lines
- `app/actions/interests.ts` — VULNERABLE
- `app/actions/families.ts` — Multiple functions
- `app/actions/exchange-listings.ts` — Multiple functions

### API Routes
- `app/api/v1/residents/route.ts` — Uses middleware
- `app/api/v1/access-request/route.ts` — Good validation
- `app/api/v1/check-ins/route.ts` — Uses middleware

### Supabase Clients
- `lib/supabase/server.ts` — 33 lines
- `lib/supabase/admin.ts` — 30 lines (service role)
- `lib/supabase/client.ts` — 7 lines

### Middleware & Validation
- `lib/api/middleware.ts` — Auth/tenant isolation
- `lib/validation/schemas.ts` — Zod schemas
- `lib/rate-limit.ts` — Rate limiting

---

## Conclusion

| Category | Assessment |
|----------|------------|
| **Security** | CRITICAL: Admin client authorization missing in multiple places |
| **Performance** | HIGH: N+1 patterns, double queries |
| **Code Quality** | MEDIUM: Type safety gaps, no tests for data layer |
| **Data Flow** | Well-structured but inconsistent enforcement |

**Priority**: Fix admin client authorization in onboarding.ts and interests.ts immediately - this is an active vulnerability.

---

*Audit completed: 2026-04-11*