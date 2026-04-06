---
title: API & Server Actions
sidebar_position: 2
---

# API & Server Actions

The notification system provides a set of Server Actions and a dedicated API endpoint for management and real-time updates.

## Core Server Actions (`app/actions/notifications.ts`)

- **`getNotifications(tenantId, options)`**: Fetches notifications with polymorphic joins. It automatically resolves related data for Exchange items, Events, and more to provide a complete UI context.
- **`createNotification(data)`**: The internal centralized helper for spawning new alerts. It handles the mapping of polymorphic keys.
- **`markAsRead(notificationId)`**: Atomically updates `is_read` and `read_at`.
- **`archiveNotification(notificationId)`**: Moves a notification to the archived state, removing it from the primary stream.
- **`getUnreadCount(tenantId)`**: Returns the count of unread notifications for the active user.

## API Endpoint (`app/api/notifications/[tenantId]/route.ts`)

A dedicated GET route supports client-side polling and SWR integration, ensuring the notification bell stays in sync during an active session.

### Example Fetch (Client-side)
```typescript
const { data: notifications } = useSWR(
  `/api/notifications/${tenantId}`,
  fetcher,
  { refreshInterval: 30000 }
);
```

## UI Components
- **`NotificationsClient`**: Main dashboard view with tabbed filtering.
- **`NotificationCard`**: Generic renderer for simple alerts.
- **`ExchangeNotificationCard`**: Specialized renderer for interactive exchange requests.
