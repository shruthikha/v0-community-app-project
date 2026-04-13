---
title: "Add memoization to transaction card"
status: open
created: 2026-04-11
updated: 2026-04-11
priority: medium
category: performance
author: orchestrator/audit
---

# Add memoization to transaction card

## Finding

`transaction-card.tsx` recalculates derived state on every render:

```typescript
// These recalculate on every render
const getStatusBadge = () => { ... }
const getCategoryBadgeVariant = () => { ... }
const getProgressSteps = () => { ... }

// Also recalculated on every render
const otherPartyName = otherParty 
  ? `${otherParty.first_name} ${otherParty.last_name}` 
  : "Unknown"
const otherPartyInitials = otherParty 
  ? `${otherParty.first_name[0]}${otherParty.last_name[0]}` 
  : "?"
```

## Files
- `components/transactions/transaction-card.tsx`

## Recommendation

Wrap in useMemo/useCallback:

```typescript
const statusBadge = useMemo(() => getStatusBadge(), [status])
const categoryBadge = useMemo(() => getCategoryBadgeVariant(), [category])
const progressSteps = useMemo(() => getProgressSteps(), [status, dueDate])

const otherPartyName = useMemo(() => 
  otherParty ? `${otherParty.first_name} ${otherParty.last_name}` : "Unknown",
  [otherParty]
)
```

## Status

**Open** - Straightforward memoization task