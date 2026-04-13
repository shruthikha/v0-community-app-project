---
title: Exchange Constraints
description: DB check constraints vs TypeScript enum alignment
categories: [database, types, validation]
sources: [requirements_2026-02-14_exchange_listings_constraints_fix.md]
---

# Exchange Constraints

## The Mismatch Problem

TypeScript allows values that PostgreSQL rejects:

| Field | TypeScript | Database | Gap |
|-------|-----------|----------|-----|
| `condition` | 9 values | 5 values | `like_new`, `good`, `fair`, `poor` |
| `pricing_type` | 4 values | 3 values | `negotiable` |

## Fix: Narrow TypeScript to Match DB

```typescript
// Before: Too permissive
type ExchangeCondition = 'new' | 'like_new' | 'good' | 'fair' | ...

// After: Match database constraints
type ExchangeCondition = 'new' | 'slightly_used' | 'used' | 'slightly_damaged' | 'maintenance';

type ExchangePricingType = 'free' | 'fixed_price' | 'pay_what_you_want';
```

## Why This Direction

- Database constraints are the source of truth
- Prevents "check constraint violation" errors on edits
- UI narrowing is safer than DB widening

---

## Related

- [zod-validation](../lessons/zod-validation.md)