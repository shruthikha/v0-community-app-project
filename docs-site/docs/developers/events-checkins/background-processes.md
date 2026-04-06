# Background Processes & Logic

This document covers the automated workflows that maintain the state of the Events and Check-ins systems.

---

## 🔄 Event Recurrence Engine

The system uses a parent-child architecture (`ADR-013`) to handle repeating events.

### Generation Workflow
1.  **Rule Initialization**: When a user creates a series, the `recurrence_rule` (RRULE) is stored on the master record.
2.  **Pre-generation**: A background task (or triggered hook) generates instance records in the `events` table.
3.  **Synchronization**: Updates to a master record optionally propagate to all children that haven't been "detached".

### The Detachment Logic
Detachment is a safeguard that triggers when a resident edits a **single occurrence** of a series.
- **Trigger**: `detachEventOccurrence(eventId)`
- **Action**: 
    - Sets `parent_event_id` to `NULL`.
    - Sets `recurrence_rule` to `NULL`.
    - The instance becomes a standalone "one-off" event, preserving its specific changes while leaving the rest of the series intact.

---

## 📍 Check-in Ephemerality

Check-ins are designed to be temporary beacons. 

### Lifecycle Management
1.  **Activation**: Beacons appear on the map at `start_time`.
2.  **Pulsating State**: When `currentTime > (end_time - 15 minutes)`, the Mapbox component triggers a pulsating CSS animation on the marker.
3.  **Expiration**: Check-ins are filtered out at the query level when `currentTime > (start_time + duration_minutes)`. No background job is required to update states.

---

## 🗺️ Spatial Distribution (Jitter)

To prevent beacon stacking in high-density areas (like the Clubhouse), the system employs a circular distribution algorithm.
- **Library**: `turf.js`
- **Logic**: If multiple check-ins share identical coordinates, they are distributed in a ring with a small random offset (jitter), ensuring all residents' beacons remain clickable.
