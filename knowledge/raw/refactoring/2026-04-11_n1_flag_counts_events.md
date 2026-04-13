---
title: N+1 Query in Event Flag Counts
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: performance
author: orchestrator/audit
---

# N+1 Query in Event Flag Counts

## Finding
When `enrichWithFlagCount` is enabled, `getEvents()` makes one RPC call per event to fetch flag counts. For 50 events, this triggers 50 sequential RPC calls.

## Files
- `lib/data/events.ts:180-195`

## Recommendation
Create a batch RPC `get_event_flag_counts(p_event_ids uuid[], p_tenant_id uuid)` that returns counts for all events in a single call.

## Status
**Open** - High priority performance fix needed