---
title: N+1 flag count queries in events and exchange
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: performance
author: @investigator/audit
---

# N+1 Flag Count Queries in Events and Exchange

## Finding
Server actions in `app/actions/events.ts` and `app/actions/exchange-listings.ts` execute individual RPC calls for each item to get flag counts, resulting in N+1 query pattern. 50 events = 50 RPC calls.

## Files
- `app/actions/events.ts` (getEvents action)
- `app/actions/exchange-listings.ts` (getListings action)
- `lib/data/events.ts` (getEvents function)

## Recommendation
Create batch RPC function `get_event_flag_counts(p_event_ids uuid[], p_tenant_id uuid)` that returns counts for all IDs in a single call, then update server actions to use it.

## Status
**Open** - Documented in audit_2026-04-11_app_module.md