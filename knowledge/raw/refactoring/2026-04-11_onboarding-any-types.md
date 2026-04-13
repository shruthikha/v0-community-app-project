---
title: "Replace any types in onboarding components"
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: readability
author: orchestrator/audit
---

# Replace any types in onboarding components

## Finding

32+ `any` type usages across onboarding step components obscure data shapes:

```typescript
interface IdentityStepProps {
  onNext: (data: any) => void  // Should be typed
  onSave?: (data: any, silent?: boolean) => Promise<void>
  initialData?: any  // Should be a proper interface
}
```

## Files
- `components/onboarding/steps/identity-step.tsx`
- `components/onboarding/steps/contact-step.tsx`
- `components/onboarding/steps/household-step.tsx`
- `components/onboarding/steps/journey-step.tsx`
- `components/onboarding/steps/roots-step.tsx`
- `components/onboarding/steps/skills-step.tsx`
- `components/onboarding/profile-wizard.tsx`

## Recommendation

Create shared interfaces:

```typescript
interface OnboardingData {
  firstName?: string
  lastName?: string
  avatarUrl?: string
  about?: string
  birthday?: string
  birthCountry?: string
  currentCountry?: string
  // ... other fields
}

interface StepProps {
  onNext: (data: OnboardingData) => void
  onSave?: (data: Partial<OnboardingData>, silent?: boolean) => Promise<void>
  initialData?: OnboardingData & {
    userId?: string
    tenantId?: string
    familyUnitId?: string
    lotId?: string
  }
}
```

## Status

**Open** - TypeScript interface creation needed