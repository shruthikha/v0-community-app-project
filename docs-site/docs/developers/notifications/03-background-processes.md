---
title: Background Processes
sidebar_position: 3
---

# Background Processes & Triggers

Notifications are primarily **event-driven**. Triggers are embedded directly within domain-specific Server Actions to ensure consistency between state changes and alerts.

## Common Triggers

- **Exchange Transactions**: When a user clicks "Request to Borrow", the `createExchangeRequest` action calls `createNotification` for the lender.
- **Status Transitions**: When an admin or neighbor updates a Community Request status (e.g., to "In Progress"), `updateRequestStatus` triggers a notification for the original submitter.
- **Path Revalidation**: All notification actions trigger a `revalidatePath` for the dashboard and notifications page routes to ensure UI freshness across different devices.

## Event Sequencing
1. **Core Action**: A primary action (e.g., `confirmExchange`) is executed in a transaction.
2. **Alert Generation**: `createNotification` is called with the metadata payload.
3. **Revalidation**: `revalidatePath` ensures the server-side cache is busted.
4. **Client-side SWR**: The browser picks up the change on the next polling cycle.
