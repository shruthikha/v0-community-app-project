---
title: API Cross-Cutting Audit
date: 2026-04-11
type: cross-cutting
focus: security, performance, quality, understanding
scope: API routes, server actions, data layer, auth integration
---

# Audit: API Cross-Cutting

**Date**: 2026-04-11  
**Type**: Cross-cutting  
**Focus**: Security, Performance, Code Quality, Understanding  
**Scope**: API routes (`app/api/`), Server Actions (`app/actions/`), Data Layer (`lib/data/`), Auth Integration

---

## Context

Comprehensive audit of the API layer across the Ecovilla Community Platform. This audit examines the cross-cutting concerns of API architecture including REST endpoints, server actions, authentication patterns, data access patterns, and security enforcement.

---

## Prior Work

### Wiki Patterns (Relevant)
- **Wiki reference:** `knowledge/wiki/patterns/server-actions.md` — Zod mandate, input types, cache invalidation
- **Wiki reference:** `knowledge/wiki/patterns/security-patterns.md` — Service role verification, BFF-first security, PII redaction
- **Wiki reference:** `knowledge/wiki/documentation-gaps.md` — Notes API docs are missing

### Existing Audits
- `audit_2026-04-11_auth_crosscutting.md` — Prior auth audit completed
- `audit_2026-04-11_data_flow_crosscutting.md` — Prior data flow audit

---

## Findings

### Critical

| Finding | File | Recommendation |
|---------|------|---------------|
| **Missing Auth Verification in API Route** | `app/api/v1/access-request/route.ts` | Uses `createAdminClient` but only checks session, doesn't verify user role before granting elevated access |
| **Missing Auth Verification in API Route** | `app/api/v1/lots/route.ts` | Uses `createAdminClient` for full table access without role verification |
| **Missing Zod Validation in Server Actions** | `app/actions/events.ts` | createEvent has no Zod schema - manual validation only |
| **Missing Zod Validation in Server Actions** | `app/actions/profile.ts` | updateProfileAction lacks Zod schema validation |
| **PII Exposure in AI Chat Logs** | `app/api/v1/ai/chat/route.ts` | Logs user IDs directly in error messages |

### High

| Finding | File | Recommendation |
|---------|------|---------------|
| **Inconsistent Error Responses** | `app/api/v1/events/route.ts` | Mixes custom response format with `errorResponse` helper - should standardize |
| **Incomplete Implementation** | `app/api/v1/residents/route.ts` | POST endpoint throws "not yet implemented" - remove or implement |
| **Incomplete Implementation** | `app/api/v1/locations/route.ts` | POST endpoint throws "not yet implemented" - remove or implement |
| **Missing Rate Limiting** | `app/actions/` | Server actions have no rate limiting - vulnerable to abuse |
| **No Input Sanitization** | `app/api/v1/ai/memories/route.ts` | Accepts user content without sanitization before storing |

### Medium

| Finding | File | Recommendation |
|---------|------|---------------|
| **Inconsistent Pagination** | API routes | Some use `getPaginationParams`, others don't enforce limits |
| **Missing Type Safety** | `lib/data/` | Return types sometimes use `any` |
| **Cache Inconsistency** | Server actions | Not all use `revalidatePath` after mutations |
| **Hardcoded Error Messages** | API routes | Should externalize for i18n support |

### Low

| Finding | File | Recommendation |
|---------|------|---------------|
| **Missing Request Validation** | `app/api/v1/ai/chat/route.ts` | Doesn't validate message structure before sending to AI |
| **No API Versioning** | All API routes | Should use `/api/v1/` consistently |
| **Inconsistent Naming** | API routes | Some use camelCase, others use snake_case in responses |

---

## Understanding Mapping

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                           │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Next.js Middleware (auth)                       │
│                  - Session refresh                                 │
│                  - 2-hour timeout                                   │
│                  - Remember-me grace period                        │
└─────────────────────────────────────────────────────────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  API Routes      │  │   Server Actions │  │  Server Comps    │
│  app/api/        │  │   app/actions/   │  │  Direct calls    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API Middleware Layer                            │
│  - withAuth() - authentication check                               │
│  - withTenantIsolation() - tenant context                         │
│  - withRole() - role-based access                                  │
└─────────────────────────────────────────────────────────────────────┘
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Supabase Client Layer                            │
│  - createServerClient() - SSR with session                        │
│  - createAdminClient() - service role (bypasses RLS)               │
└─────────────────────────────────────────────────────────────────────┘
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Data Access Layer                                │
│  lib/data/*.ts - type-safe database queries                        │
└─────────────────────────────────────────────────────────────────────┘
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Supabase Database                                │
│  - RLS policies enforced (for non-admin)                          │
│  - Tenant isolation via tenant_id                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### API Routes Inventory

**v1 API Routes (40 endpoints):**
- `/api/v1/ai/` — Chat, threads, memories, ingest, health checks
- `/api/v1/events/` — CRUD + RSVP
- `/api/v1/locations/` — CRUD
- `/api/v1/residents/` — CRUD (POST not implemented)
- `/api/v1/notifications/` — CRUD + read status
- `/api/v1/exchange/` — Listings and transactions
- `/api/v1/access-request/` — Submission endpoint

**Non-v1 API Routes:**
- `/api/dashboard/` — Stats and priority
- `/api/link-resident/` — Admin linking
- `/api/upload/` — File uploads
- `/api/cron/` — Scheduled jobs

### Server Actions Inventory

**32 Server Actions:**
- Auth: `auth-actions.ts` (Zod validated)
- Profile: `profile.ts` (needs Zod)
- Events: `events.ts` (needs Zod)
- Locations: `locations.ts`
- Families: `families.ts`
- Reservations: `reservations.ts`
- Notifications: `notifications.ts`
- Documents: `documents.ts` (Zod validated)
- Exchange: `exchange-listings.ts`, `exchange-transactions.ts`
- And more...

### Middleware Stack

| Middleware | Purpose | Usage |
|------------|---------|-------|
| `withAuth` | Verify user authentication | All protected API routes |
| `withTenantIsolation` | Add tenant context + verify access | All v1 endpoints |
| `withRole` | Role-based authorization | Admin-only endpoints |
| Rate limiting | 10 req/10s per user | Built into `withAuth` |

### Security Flow

1. **AI Chat (`/api/v1/ai/chat`)** — Most comprehensive security:
   - User auth verification
   - Tenant context validation (compares JWT vs DB)
   - Super admin bypass
   - Feature flag checking (Rio enabled)
   - Profile enrichment for context
   - Timeout handling (30s total, 15s per attempt)

2. **Standard API Routes** — Good but inconsistent:
   - All use `withTenantIsolation`
   - Some use admin client without additional verification

3. **Server Actions** — Security gaps:
   - Many use `createAdminClient` directly
   - Auth check varies by action

---

## Recommendations

### Immediate (This Sprint)

- [ ] **Add Zod validation to `app/actions/events.ts`** — Follow pattern from `auth-actions.ts`
- [ ] **Add Zod validation to `app/actions/profile.ts`** — Follow pattern from `auth-actions.ts`
- [ ] **Fix auth verification in `app/api/v1/access-request/route.ts`** — Verify user role before admin operations
- [ ] **Fix auth verification in `app/api/v1/lots/route.ts`** — Verify user role before admin operations
- [ ] **Redact user IDs in logs** — Replace direct logging with hash or redact

### Short-term (Next Sprint)

- [ ] **Implement POST endpoints** — Complete `residents` and `locations` or remove stubs
- [ ] **Add rate limiting to server actions** — Use same pattern as API middleware
- [ ] **Standardize error response format** — Pick one pattern and enforce
- [ ] **Add input sanitization** — Before storing in vector memory

### Long-term (Backlog)

- [ ] **Create API documentation** — Document all v1 endpoints (noted in wiki gaps)
- [ ] **Add API versioning strategy** — Plan for v2
- [ ] **Type-safe data layer** — Remove `any` from lib/data/
- [ ] **Add request validation middleware** — Centralize validation

---

## Performance Notes

1. **AI Chat Stream** — Well-optimized with:
   - TransformStream for SSE format conversion
   - 2 retries with exponential backoff
   - Timeout guards (30s total, 15s per attempt)
   - Buffer management for chunked responses

2. **Database Queries** — Data layer is properly abstracted:
   - Type-safe queries via lib/data/
   - Pagination support
   - Tenant isolation in queries

3. **Middleware Overhead** — Each API request hits:
   - Session refresh (Supabase)
   - Rate limiting check
   - Tenant verification
   - Role check

---

## Code Quality Assessment

| Aspect | Grade | Notes |
|--------|-------|-------|
| Security | B- | Good patterns, some gaps in server actions |
| Consistency | C+ | Mixed patterns, some incomplete implementations |
| Type Safety | B | Good TypeScript usage, some `any` leaks |
| Error Handling | B | Standardized but not everywhere |
| Documentation | D | API docs missing |
| Testing | B- | Some tests exist for critical paths |

---

*Audit completed: 2026-04-11*
*Next audit recommended: Q2 2026 (6 months)*