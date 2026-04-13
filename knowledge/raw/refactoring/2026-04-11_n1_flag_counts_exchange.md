---
title: N+1 Query in Exchange Listing Flag Counts
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: performance
author: orchestrator/audit
---

# N+1 Query in Exchange Listing Flag Counts

## Finding
When `enrichWithFlagCount` is enabled, `getExchangeListings()` makes one RPC call per listing to fetch flag counts. Same pattern as events.

## Files
- `lib/data/exchange.ts:150-165`

## Recommendation
Create a batch RPC `get_exchange_flag_counts(p_listing_ids uuid[], p_tenant_id uuid)` that returns counts for all listings in a single call.

## Status
**Open** - High priority performance fix needed