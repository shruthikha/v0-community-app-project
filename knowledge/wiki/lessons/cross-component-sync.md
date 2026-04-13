---
title: Cross-Component Sync (Event Bus)
description: CustomEvent for state sync, RSVP synchronization across surfaces
categories: [state-management, events, sync]
sources: [log_2026-02-11_issue_81.md, log_2026-02-07_event_series_detachment.md]
---

# Cross-Component Sync Pattern

## CustomEvent for Multi-Surface Sync

When multiple components show the same entity, local state causes desync:

```typescript
// Dispatch event on RSVP change
window.dispatchEvent(new CustomEvent('rio-checkin-rsvp-sync', {
  detail: { checkInId, status, userId }
}));

// Listen in each component
window.addEventListener('rio-checkin-rsvp-sync', (e) => {
  const { checkInId, status } = e.detail;
  refreshData();
});
```

## Unique Event Naming

Use unique names to prevent collisions:

```typescript
// Good: Specific naming
'rio-checkin-rsvp-sync'
'rio-series-rsvp-sync'

// Bad: Generic names cause collisions
'rsvp-sync'
'sync'
```

## RSVP 3-Button Grouping

3-button groups overflow on mobile card footers:

```typescript
// BAD: Inline buttons overflow
<div className="flex gap-2">
  <JoinButton /><MaybeButton /><DeclineButton />
</div>

// GOOD: Dedicated row
<div className="flex flex-col">
  <LocationInfo />
  <div className="flex gap-2">
    <JoinButton /><MaybeButton />
  </div>
</div>
```

---

## Related

- [series-events](./series-events.md)