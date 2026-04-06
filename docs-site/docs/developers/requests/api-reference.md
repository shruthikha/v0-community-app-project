# API Reference: Requests

The Requests feature primarily uses React Server Actions located in `app/actions/resident-requests.ts`. These actions handle the business logic, database mutations, and revalidation.

## Core Server Actions

### `createResidentRequest`
Submits a new request to the community.
*   **Parameters**: `tenantId`, `tenantSlug`, `data: CreateRequestData`.
*   **Logic**:
    *   Inserts into `resident_requests`.
    *   Sets initial status to `pending`.
    *   Calculates `is_public` based on `request_type` (Maintenance/Safety default to true).
    *   Revalidates dashboard and admin request paths.

### `updateRequestStatus`
(Admin Only) Updates the status of an existing request.
*   **Parameters**: `requestId`, `tenantId`, `tenantSlug`, `status: RequestStatus`, `reason?`.
*   **Logic**:
    *   Verifies user is an admin.
    *   Updates `status`, `updated_at`, and optionally `resolved_at`/`resolved_by`.
    *   Triggers a notification to the original submitter.

### `addRequestComment`
Adds a comment to a request thread.
*   **Parameters**: `requestId`, `tenantId`, `tenantSlug`, `content`.
*   **Logic**:
    *   Verifies authorization (Admin, Creator, or Public request).
    *   Inserts into `comments`.
    *   Triggers notifications based on the actor's role (Resident reply -> Admin; Admin reply -> Resident).

### `reopenResidentRequest`
(Admin Only) Moves a resolved/rejected request back to `in_progress`.
*   **Parameters**: `requestId`, `tenantId`, `tenantSlug`.

## Data Fetching (Utility)

Located in `lib/data/resident-requests.ts`:

### `getResidentRequests`
Fetch a list of requests with optional enrichment.
*   **Options**:
    *   `enrichWithCreator`: Includes user profile details.
    *   `enrichWithLocation`: Includes location map data.
    *   `enrichWithComments`: Includes all comments in the thread.
    *   `isPublic`: Filter by visibility.

## Hooks & Context

*   `useCreateRequest`: Utility hook for managing the creation wizard state.
*   `useRequestFilters`: Client-side hook for filtering the request list by type, status, and priority.
