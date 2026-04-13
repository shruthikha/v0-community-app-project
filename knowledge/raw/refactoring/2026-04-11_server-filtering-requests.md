---
title: "Server-side filtering for requests list"
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: performance
author: orchestrator/audit
---

# Server-side filtering for requests list

## Finding

`requests-page-client.tsx` filters all requests client-side with useMemo:

```typescript
const filteredRequests = useMemo(() => {
  return allRequests.filter(req => {
    // Complex filter logic runs on entire dataset
  })
}, [allRequests, searchQuery, statusFilter])
```

For large datasets (500+ requests), this causes performance issues.

## Files
- `components/requests/requests-page-client.tsx`

## Recommendation

Implement server-side filtering with pagination:

1. Add query params to API: `?search=&status=&page=1&limit=20`
2. Move filter logic to server action or API route
3. Return paginated results with total count

This matches the pattern already used in other parts of the codebase.

## Status

**Open** - Backend API changes required