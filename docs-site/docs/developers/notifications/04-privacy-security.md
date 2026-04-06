---
title: Privacy & Security
sidebar_position: 4
---

# Privacy & Security

The `notifications` system is strictly isolated at the database level to protect resident privacy.

## Row-Level Security (RLS)

The `notifications` table is protected by the following policies:

- **SELECT**: A user can ONLY see notifications where `recipient_id = auth.uid()`. This prevents any user from snooping on another's alerts.
- **UPDATE**: Users can only modify `is_read` or `is_archived` statuses for their own records.
- **INSERT/DELETE**: Primarily restricted to `service_role` or specific authorized Server Actions.

## Actor-Recipient Boundaries

While `actor_id` is stored to identify who triggered the event, the system ensures that sensitive metadata is never leaked into the `message` column for unauthorized recipients. The notification text is pre-computed at creation time in a secure server-side context.

## Action URL Validation

Action URLs are checked for validity and tenant scoping to ensure that a notification link doesn't accidentally redirect a user to an unauthorized tenant's dashboard.
