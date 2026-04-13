---
title: N+1 query pattern for event flag counts
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: performance
author: investigator/audit
---

# N+1 Query Pattern for Event Flag Counts

## Finding

In `lib/data/events.ts:265-276`, when `enrichWithFlagCount` is enabled, the code makes one RPC call per event:

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
}
```

**Impact**: Loading 100 events requires 100 separate RPC calls.

## Files

- `lib/data/events.ts` (lines 265-276)
- `lib/data/exchange.ts` (similar pattern with flag counts)

## Recommendation

Create a batch RPC that accepts an array of event IDs and returns counts for all:

```sql
CREATE OR REPLACE FUNCTION get_event_flag_counts(
    p_event_ids UUID[],
    p_tenant_id UUID
) RETURNS TABLE(event_id UUID, flag_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ef.event_id,
        COUNT(ef.*)::BIGINT
    FROM event_flags ef
    JOIN events e ON e.id = ef.event_id
    WHERE ef.event_id = ANY(p_event_ids)
      AND e.tenant_id = p_tenant_id
    GROUP BY ef.event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Status

**Open** - Pending implementation of batch RPC

---