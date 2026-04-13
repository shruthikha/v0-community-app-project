---
title: Batch RPC Counts Pattern
---

# Batch RPC Counts Pattern

If a UI or action needs counts for many records, batch the database call rather than issuing one RPC per row.

## Why it matters

Per-row count enrichment creates an N+1 pattern that scales poorly as the number of records grows. A batch RPC keeps the request count flat and simplifies performance tuning.

## Pattern

- Accept an array of IDs in a single RPC.
- Return a mapping from ID to count.
- Use it for count enrichment in list views or dashboards.

## Related files

- `app/actions/events.ts`
- `app/actions/exchange-listings.ts`
- `lib/data/events.ts`
- `lib/data/exchange.ts`

## Notes

Use batch counts whenever the caller already has a list of IDs and only needs summary data.