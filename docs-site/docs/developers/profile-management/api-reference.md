# API Reference: Profiles & Families

This document outlines the primary Server Actions and API patterns used to manage resident profiles and household structures.

## Profile Management

Profiles are updated using discrete Server Actions that ensure field-level validation and audit trails.

### `updateProfileAction`
Updates the authenticated user's profile information using an atomic batch update.

- **Payload**: `ProfileUpdateData` object.
- **Behavior**: Performs a single transaction to update all provided profile fields. This is an explicit update, not a field-level auto-save.
- **Validation**: Enforces tenant-specific constraints and unique email checks.

### `updatePrivacySettings`
Manages absolute visibility toggles for the resident's profile.

- **Structure**: A flat set of 15 boolean flags (e.g., `show_email`, `show_phone`, `show_bio`).
- **Visibility Levels**: Binary visibility (`hidden` vs `visible`) per individual field.

### `manageRíoMemory`
Handles fact-level sovereignty for the AI assistant.

- **`updateFact`**: Adjusts a specific memory card.
- **`deleteFact`**: Removes a specific semantic memory.
- **`wipeAllMemories`**: Performs a hard delete of all resident-associated vector data.

## Household & Family Management

### `createFamilyUnit`
Initializes a new household unit including members and pets in a single operation.

- **Inputs**: `tenantId` (string), `data` (`CreateFamilyUnitData` object).
- **Data Object**: Includes `familyName`, `members` array (with `first_name`, `last_name`, `email`, etc.), and `pets` array.
- **Note**: Only Admins can create new family units from the dashboard.

### `addFamilyMember`
Adds a resident or pet to an existing `family_unit`.

- **Active vs Passive**: If an `email` is provided, an invitation is generated. If `email` is omitted, the record is created as a **Passive Account**.
- **Role mapping**: Links the new member to the parent unit via `family_unit_id`.

## Access Requests

### `createAccessRequest`
Public action used on the login/landing page.

- **Fields**: `full_name`, `email`, `neighborhood_id`, `lot_description`.
- **Process**: Stores the request in `access_requests` with a `pending` status for admin review.

### `approveAccessRequest`
Administrative action marking a request as `approved`.
- **Behavior**: Approval redirects the admin to the pre-filled resident creation form.

### `inviteResident`
Triggers the onboarding email for a resident with a `created` status.
- **Logic**: Generates a secure, one-time-use JWT token for the `Set Password` workflow.
