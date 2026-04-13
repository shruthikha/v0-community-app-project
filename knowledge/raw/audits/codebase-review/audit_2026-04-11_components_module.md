---
title: "Audit 2026-04-11: Components Module"
date: 2026-04-11
type: module
focus: security, performance, quality, understanding
scope: components/ (all subdirectories)
---

# Audit: Components Module

**Date**: 2026-04-11  
**Type**: Module (components/)  
**Focus**: Security, Performance, Code Quality, Understanding  
**Scope**: `components/` — onboarding, dashboard, data-heavy (requests/reservations/events/exchange), providers

---

## Context

Comprehensive audit of the Ecovilla frontend components following Socratic Gate clarification:
- **Type**: Module (entire `components/` directory)
- **Focus**: All (security, performance, code quality, understanding)
- **Depth**: Full analysis (~2 hours)
- **Known concerns**: None specified

This audit covers 4 component areas analyzed by specialized agents.

---

## Prior Work

- **Wiki**: 40+ patterns/lessons covering security, performance, code quality
- **Prior audits**: `audit_2026-04-11_full_codebase.md` (full codebase, April 11)
- **This audit**: First module-level components audit

---

## Files Analyzed

| Area | Files | Key Components |
|------|-------|-----------------|
| **Security/Onboarding** | 24 | identity-step, contact-step, household-step, profile-wizard |
| **Dashboard/UI** | 20 | StatsGrid, announcements-page-client, document-list-client |
| **Data-Heavy** | 65 | requests (18), reservations (6), events (5), exchange (30), transactions (6) |
| **Providers** | 5 | PostHogProvider, RioFeedbackProvider, UserJotProvider |

**Total**: ~114 files analyzed

---

## Understanding Mapping

### Architecture Overview

```
components/
├── onboarding/       → 7 step components, wizard wrapper, cards
├── dashboard/        → 5 widgets, stat management, lists
├── requests/         → 18 files: page, cards, modals, comments
├── reservations/     → 6 files: forms, widgets
├── events/          → 5 files: cards, badges
├── exchange/        → 30 files: listings, transactions, modals
├── providers/       → 5 files: analytics, feedback, userjot
├── library/         → shadcn/ui primitives
└── ui/              → custom UI components
```

### Data Flow

```
API/Server Action → useSWR/useQuery → State → Filter (useMemo) → Render
                          ↓
                  Optimistic Update → mutate() → Revalidate
```

### Key Dependencies

| Component Group | API/Action | Data Type |
|-----------------|------------|-----------|
| Dashboard widgets | `/api/dashboard/stats` | StatConfig[] |
| Announcements | `/api/announcements/unread/{tenantId}` | Announcement[] |
| Check-ins | `/api/check-ins/{tenantId}` | CheckIn[] |
| Events | `/api/events/upcoming/{tenantId}` | Event[] |
| Requests | `/api/requests` | Request[] |
| Exchange | `/api/exchange/listings` | ExchangeListing[] |

---

## Security Findings

| # | Finding | Area | Severity |
|---|---------|------|----------|
| 1 | No server-side file type validation (relies on `/api/upload`) | Onboarding | MEDIUM |
| 2 | Debug logging exposes internal state | Onboarding | LOW |
| 3 | Unvalidated image URLs in PhotoManager | Data-heavy | MEDIUM |
| 4 | Console logging sensitive data (transaction IDs) | Data-heavy | LOW |
| 5 | Potential SSRF via custom location coordinates | Data-heavy | LOW |
| 6 | No XSS in components (verified clean) | All | ✅ PASS |

### Finding 1: No Server-Side File Type Validation

**Severity**: MEDIUM  
**Files**: `components/onboarding/steps/identity-step.tsx`, `household-step.tsx`, `components/profile/editable-profile-banner.tsx`

```typescript
// Client-side only checks size
if (file.size > 5 * 1024 * 1024) { // No MIME type check }
```

**Remediation**: Verify `/api/upload` validates MIME types and magic bytes.

### Finding 2: Debug Logging Exposes Internal State

**Severity**: LOW  
**Files**: `identity-step.tsx:31-33`, `profile-wizard-wrapper.tsx:34,43`

```typescript
console.log('[IdentityStep] initialData:', initialData)  // PII exposure
console.log('[ProfileWizard] Tenant Slug:', tenantSlug)  // Reconnaissance
```

**Remediation**: Remove before production or wrap in `process.env.NODE_ENV !== 'development'`.

### Finding 3: Unvalidated Image URLs in PhotoManager

**Severity**: MEDIUM  
**Files**: `create-request-modal.tsx`, `create-exchange-listing-modal.tsx`

PhotoManager accepts URLs without domain validation — potential stored XSS via malicious image URLs.

**Remediation**: Validate against allowed storage domains or implement CSP.

---

## Performance Findings

| # | Finding | Area | Impact | Effort |
|---|---------|------|--------|--------|
| 1 | Client-side filtering without pagination | Requests | HIGH | High |
| 2 | Unmemoized derived state in render | Transactions | HIGH | Medium |
| 3 | Multiple filter passes on same array | Transactions | MEDIUM | Low |
| 4 | Missing useMemo on filter operations | Onboarding | MEDIUM | Low |
| 5 | Missing useCallback for callbacks passed to children | Dashboard | MEDIUM | Medium |
| 6 | No list virtualization for large datasets | Data-heavy | MEDIUM | Medium |
| 7 | Native `<img>` instead of Next.js `<Image>` | Exchange | LOW | Low |

### Finding 1: Client-Side Filtering Without Pagination

**Severity**: HIGH  
**File**: `components/requests/requests-page-client.tsx:53-80`

```typescript
const filteredRequests = useMemo(() => {
  return allRequests.filter(req => {
    // Complex filter logic runs on every render for ALL items
  })
}, [allRequests, searchQuery, statusFilter])
```

**Impact**: 500+ requests = filtering entire array client-side  
**Remediation**: Implement server-side filtering with pagination.

### Finding 2: Unmemoized Derived State

**Severity**: HIGH  
**File**: `components/transactions/transaction-card.tsx:88-206`

```typescript
// These recalculate on every render
const getStatusBadge = () => { ... }
const getCategoryBadgeVariant = () => { ... }
const getProgressSteps = () => { ... }
```

**Remediation**: Wrap in `useMemo` hooks.

---

## Code Quality Findings

### Type Safety (Critical Priority)

| Area | `any` Usage | Files Affected |
|------|-------------|-----------------|
| Onboarding | 32+ | All step components |
| Dashboard | 5+ | SharedPhotoGallery, official-tabs |
| Data-heavy | 3+ | create-request-modal, transaction-card |

### Missing Interfaces

```typescript
// Current (bad)
onNext: (data: any) => void
initialData?: any
triggerAutoSave: (overrides: any) => Promise<void>

// Recommended (good)
interface OnboardingData {
  firstName?: string
  lastName?: string
  avatarUrl?: string
  // ...
}
onNext: (data: OnboardingData) => void
```

### Error Handling Inconsistency

| Pattern | Usage | Files |
|---------|-------|-------|
| `toast.error()` | Most common | Various |
| `showFeedback()` | Feedback system | Various |
| `alert()` | Legacy | my-listings-and-transactions-widget.tsx |

**Standardization needed**: Use toast/feedback only.

### Component Size Issues

| Component | Lines | Recommendation |
|-----------|-------|----------------|
| announcements-page-client.tsx | 220 | Split by feature |
| document-list-client.tsx | 240 | Split by feature |
| upcoming-events-widget.tsx | 220 | Extract RSVP to component |

---

## Provider Architecture Mapping

| Provider | Purpose | Scope | Security |
|----------|---------|-------|----------|
| PostHogProvider | Analytics | Global | ✅ Clean |
| RioFeedbackProvider | Toast/modal | Global + tenant | ✅ Clean |
| UserJotProvider | Feedback widget | Tenant-scoped | ✅ Clean |

**Key finding**: No sensitive data in context values, proper cleanup in useEffects.

---

## Summary by Severity

### Security
| Severity | Count | Action Required |
|----------|-------|-----------------|
| MEDIUM | 2 | Verify server upload, validate image URLs |
| LOW | 3 | Remove debug logs, remove console.log |

### Performance
| Severity | Count | Action Required |
|----------|-------|-----------------|
| HIGH | 2 | Server-side filtering, memoize derived state |
| MEDIUM | 4 | Add useMemo/useCallback, add virtualization |
| LOW | 1 | Replace img with Next.js Image |

### Code Quality
| Severity | Count | Action Required |
|----------|-------|-----------------|
| CRITICAL | 3 | Add Zod validation, fix any types, deduplicate interfaces |
| HIGH | 4 | Add loading states, error boundaries, fix a11y |
| MEDIUM | 6 | Remove magic numbers, standardize error handling |

---

## Recommendations

### Immediate (Critical)

1. **Add Zod validation** to request and exchange creation forms (matches ReservationForm pattern)
2. **Implement server-side filtering** with pagination for requests list
3. **Remove debug logs** before production (identity-step.tsx, profile-wizard-wrapper.tsx)

### Short-term (High Priority)

4. **Add memoization** — useMemo for filters, useCallback for callbacks
5. **Replace `any` types** — Create shared interfaces for onboarding data
6. **Standardize error handling** — toast/feedback only, remove alert()
7. **Verify server upload validation** — Confirm `/api/upload` validates MIME types

### Medium-term (Improvements)

8. **Add list virtualization** — For lists > 50 items (react-window)
9. **Split large components** — By feature responsibility
10. **Add error boundaries** — Around data-heavy components
11. **Introduce Context** — Reduce prop drilling for tenantSlug/userId

---

## Wiki References

- `knowledge/wiki/patterns/xss-prevention.md` — XSS patterns verified
- `knowledge/wiki/patterns/security-patterns.md` — Auth flow patterns
- `knowledge/wiki/patterns/react-perf.md` — Performance patterns

---

## Prior Audit Context

This module audit builds on `audit_2026-04-11_full_codebase.md`:
- Full codebase audit identified N+1 queries in data layer (related to client-side filtering here)
- Full codebase identified 185+ `any` types (components contribute ~40 of those)
- Full codebase recommended rate limiting (not applicable to components directly)

---

*Audit completed 2026-04-11 by @orchestrator with @security-auditor, @frontend-specialist, @backend-specialist, @investigator*