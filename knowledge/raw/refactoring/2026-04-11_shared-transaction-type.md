---
title: "Create shared Transaction interface"
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: readability
author: orchestrator/audit
---

# Create shared Transaction interface

## Finding

Duplicate Transaction interface in two files:

```typescript
// transactions-view.tsx
interface Transaction { id: string; ... }

// transaction-card.tsx  
interface Transaction { id: string; ... }  // Duplicate!
```

## Files
- `components/transactions/transactions-view.tsx`
- `components/transactions/transaction-card.tsx`

## Recommendation

Create shared type in `@/types/transactions.ts`:

```typescript
export interface Transaction {
  id: string
  listing_id: string
  borrower_id: string
  lender_id: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  // ... other fields
}
```

Import from single source in both files.

## Status

**Open** - Type extraction task