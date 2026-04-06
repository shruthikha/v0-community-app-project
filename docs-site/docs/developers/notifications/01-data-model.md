---
title: Data Model
sidebar_position: 1
---

# Notification Data Model

The core of the system is the `notifications` table, which uses polymorphic foreign keys to link to specific domain entities.

## Schema Overview (`notifications`)

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key. |
| `tenant_id` | `uuid` | Isolation boundary for the community. |
| `recipient_id` | `uuid` | The user receiving the notification. |
| `actor_id` | `uuid` | The user who triggered the notification (optional). |
| `type` | `NotificationType` | Enum defining the notification category. |
| `title` | `text` | Display title (pre-rendered or raw). |
| `message` | `text` | Specific content of the notification. |
| `is_read` | `boolean` | Tracks whether the user has viewed the notification. |
| `read_at` | `timestamp` | Time of first read. |
| `is_archived` | `boolean` | Tracks if the notification was moved to the archive. |
| `action_url` | `text` | Deep link to the relevant UI route. |
| `metadata` | `jsonb` | Additional context (e.g., specific item names). |
| `item_id` | `uuid` | Pointer to the polymorphic entity (Exchange Item, Event, etc.). |
| `item_type` | `text` | Discriminator (e.g., `exchange`, `event`, `request`). |

## Notification Types
The system supports over 50 granular types as defined in `types/notifications.ts`. Key categories include:
- **Exchange**: `exchange_request_created`, `exchange_request_confirmed`, `exchange_item_picked_up`.
- **Requests**: `request_status_updated`, `request_resident_reply`.
- **Community**: `announcement_published`, `event_invite_received`.

See the full list in `types/notifications.ts` for implementation details.
