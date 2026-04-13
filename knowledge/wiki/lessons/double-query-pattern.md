---
title: Avoid Double Queries for Single-Record Lookups
---

# Avoid Double Queries for Single-Record Lookups

If you already need a record's tenant or owner context, avoid querying once to find the scope and again to fetch the actual record list.

## Why it matters

This pattern wastes round trips, complicates caching, and often causes avoidable in-memory filtering. It also makes the code harder to reason about because the real lookup path is split across multiple calls.

## Pattern

- Fetch the target row directly when possible.
- If scope is needed, pass it through the lower-level data function instead of rebuilding the query.
- Prefer a dedicated single-record query over fetching a whole collection and filtering in memory.

## Related files

- `lib/data/events.ts`
- `lib/data/residents.ts`
- `knowledge/wiki/patterns/react-perf.md`

## Notes

This is a performance and maintainability smell, especially in high-traffic data access paths.