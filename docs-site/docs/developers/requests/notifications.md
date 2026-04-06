# Notifications & Background Logic: Requests

The Requests feature utilizes the central notification system to keep residents and admins synchronized throughout the request lifecycle.

## Notification Triggers

### 1. Request Status Change
*   **Trigger**: `updateRequestStatus` or `reopenResidentRequest`.
*   **Type**: `request_status_changed`.
*   **Recipient**: The `original_submitter_id` (the resident who created the request).
*   **Actor**: The Admin who performed the update.

### 2. Admin Reply
*   **Trigger**: `addRequestComment` (performed by an Admin on a non-owned request).
*   **Type**: `request_admin_reply`.
*   **Recipient**: The `original_submitter_id`.
*   **Logic**: Provides a direct link to the request detail page on the resident dashboard.

### 3. Resident Reply
*   **Trigger**: `addRequestComment` (performed by the Creator).
*   **Type**: `request_resident_reply`.
*   **Recipient**: All Admins in the tenant.
*   **Logic**: Alerts community management that a resident has provided feedback or more information.

### 4. Community Interaction
*   **Trigger**: `addRequestComment` (performed by a third party on a public request).
*   **Recipient**: Both the original Creator and all Admins.
*   **Type**: `request_resident_reply`.

## Path Revalidation

To ensure UI consistency across Resident and Admin dashboards, the following paths are revalidated upon any mutation:

```typescript
revalidatePath(`/t/${tenantSlug}/dashboard/requests`)
revalidatePath(`/t/${tenantSlug}/dashboard/requests/${requestId}`)
revalidatePath(`/t/${tenantSlug}/admin/requests`)
revalidatePath(`/t/${tenantSlug}/admin/requests/${requestId}`)
```

## Scheduled Tasks (Future)
*   **Stale Request Alerts**: Potential for a background cron job to flag `pending` requests older than 48 hours for admin attention.
