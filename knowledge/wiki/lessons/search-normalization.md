---
title: Search Normalization & Ranking
description: Lot search normalization, prefix matching, stable sorting for UX
categories: [search, ux, data]
sources: [log_2026-03-12_lot_search_admin_rejection.md, log_2026-02-22_113-exchange-listing-constraints.md]
---

# Search Normalization & Ranking

## Lot Search Normalization

Strip spaces and dashes for consistent matching:

```typescript
const normalize = (input: string) => 
  input.replace(/[\s-]/g, '').toUpperCase();
```

## Prefix Matching

D 1 should rank before D 401:

```typescript
const rank = (lot: string, query: string) => {
  const normalized = normalize(lot);
  const q = normalize(query);
  
  // Exact prefix match gets highest score
  if (normalized.startsWith(q)) return 0;
  // Contains gets lower score
  if (normalized.includes(q)) return 1;
  return 2;
};
```

## Natural Sorting

A-F grouping uses natural sort:

```typescript
const naturalSort = (a: string, b: string) => {
  return a.localeCompare(b, undefined, { numeric: true });
};
```

## Enum Runtime Validation

Narrow TypeScript types but validate at runtime:

```typescript
const VALID_CONDITIONS = ['new', 'used_good', 'used_fair'] as const;

const validate = (value: string) => {
  if (!VALID_CONDITIONS.includes(value as any)) {
    return null; // Fail gracefully
  }
  return value;
};
```

Key: DB is source of truth. Type narrowing catches compile errors, runtime validation catches data drift.

---

## Related

- [zod-validation](./zod-validation.md)