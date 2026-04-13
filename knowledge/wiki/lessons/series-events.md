---
title: Event Series RSVP
description: Series vs occurrence RSVPs, scope propagation, bulk upsert
categories: [database, events, rsvp]
sources: [log_2026-02-07_issue_63_series_rsvp_fix.md, log_2026-02-07_event_series_detachment.md]
---

# Event Series RSVP

## Scope Types

```typescript
type RsvpScope = 'this' | 'future' | 'all';

const rsvpToEvent = async (eventId: string, scope: RsvpScope) => {
  if (scope === 'this') {
    await addRsvp(eventId);
  }
  
  if (scope === 'future' || scope === 'all') {
    // Bulk upsert to prevent N+1
    const events = await getFutureEvents(eventId);
    await supabase.from('event_rsvps').upsert(
      events.map(e => ({ event_id: e.id, ... }))
    );
  }
};
```

## Priority Feed Filtering

Whitelist approach — only show interacted events:

```typescript
// Only show RSVPs or Saved events
const getPriorityEvents = async (userId: string) => {
  return db.event_rsvps.find({
    user_id: userId,
    or: [{ status: 'yes' }, { status: 'saved' }]
  });
};
```

## Event Bus Sync

Cross-component communication for real-time updates:

```typescript
// Dispatch sync event
window.dispatchEvent(new CustomEvent('rio-series-rsvp-sync', {
  detail: { eventId, status }
}));

// Listen in widgets
window.addEventListener('rio-series-rsvp-sync', (e) => {
  refreshData();
});
```

---

## Related

- [server-actions](../patterns/server-actions.md)