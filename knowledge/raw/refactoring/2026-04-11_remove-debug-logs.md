---
title: "Remove debug console.log statements"
status: open
created: 2026-04-11
updated: 2026-04-11
priority: medium
category: security
author: orchestrator/audit
---

# Remove debug console.log statements

## Finding

Debug logs expose internal state and PII in production:

```typescript
// identity-step.tsx:31-33
console.log('[IdentityStep] initialData:', initialData)  // PII exposure
console.log('[IdentityStep] birthCountry state:', birthCountry)

// profile-wizard-wrapper.tsx:34
console.log('[ProfileWizard] Tenant Slug:', tenantSlug)
```

## Files
- `components/onboarding/steps/identity-step.tsx`
- `components/onboarding/profile-wizard-wrapper.tsx`

## Recommendation

1. Remove all debug console.log statements before production
2. If debugging needed in dev, wrap in:
   ```typescript
   if (process.env.NODE_ENV === 'development') {
     console.log('[IdentityStep] initialData:', initialData)
   }
   ```

## Status

**Open** - Simple removal task