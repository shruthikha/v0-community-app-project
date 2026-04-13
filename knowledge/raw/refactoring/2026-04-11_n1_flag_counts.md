---
title: Fix N+1 pattern for flag counts in events
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: performance
author: investigator/audit
---

# Fix N+1 pattern for flag counts in events

## Finding
Event data queries use N+1 pattern when enriching with flag counts. Each event triggers a separate RPC call.

## Files
- `lib/data/events.ts:265-276`

## Current Implementation
```typescript
if (enrichWithFlagCount) {
    const flagCounts = await Promise.all(
        eventIds.map(async (eventId: string) => {
            const { data: count } = await supabase.rpc("get_event_flag_count", {
                p_event_id: eventId,
                p_tenant_id: tenantId,
            })
            return { eventId, count: count ?? 0 }
        })
    )
    flagCounts.forEach((f) => flagCountMap.set(f.eventId, f.count))
}
```

## Impact
100 events = 100 RPC calls (one per event)

## Recommendation
Create a batch RPC that accepts an array of event_ids and returns counts for all at once.

## Status
**Open** - Needs new batch RPC function + updated data layer