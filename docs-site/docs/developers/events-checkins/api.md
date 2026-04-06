# Events & Check-ins API Reference

> [!IMPORTANT]
> The current implementation uses **Next.js Server Actions** for all event and check-in operations. Dedicated RESTful API endpoints are planned for the future to support external integrations.

---

## 🗓️ Events Actions
Located in `app/actions/events.ts`.

### Create/Update Event
- **Action**: `upsertEvent`
- **Logic**: Handles visibility scoping, image uploads to Supabase Storage, and recurrence rule initialization.
- **Detachment**: If a single instance of a recurring event is edited, the `detachEventOccurrence` helper is invoked to break the link with the parent series.

### RSVP Management
- **Action**: `rsvpToEvent`
- **Logic**: Manages `event_rsvps` records. Validates against RSVP deadlines and maximum attendee limits (if set).

### Flagging
- **Action**: `flagEvent`
- **Logic**: Increments flag count and notifies admins. Check for existing flags to prevent duplicate reporting from the same resident.

---

## 📍 Check-ins API (`app/actions/check-ins.ts`)

### Create Check-in
- **Action**: `createCheckIn`
- **Logic**: Validates start time (max 1 hour in future) and duration (up to 8 hours). Calculates `end_time` for ephemeral management.

### Responses
- **Action**: `respondToCheckIn`
- **Logic**: Allows other residents to mark themselves as "Going" or "Maybe" to a check-in, fostering spontaneous group activities.

---

## 🔍 Visibility Filters
Most GET actions utilize `applyVisibilityFilter` to ensure residents only see content relevant to their community, neighborhood, or private invitations.
