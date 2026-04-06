# Data Model: Requests

The Requests feature is built on two primary tables in the `public` schema: `resident_requests` and `comments`. These tables ensure tenant isolation and support a multi-step lifecycle with integrated community visibility.

## resident_requests Table

This is the core table representing a ticket or request submitted by a resident.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (gen_random_uuid). |
| `tenant_id` | UUID | Foreign Key to `tenants.id`. Mandatory for isolation. |
| `created_by` | UUID | Foreign Key to `users.id`. NULL if submitted anonymously. |
| `original_submitter_id` | UUID | Foreign Key to `users.id`. Always tracks the actual user. |
| `title` | TEXT | Brief summary of the issue. |
| `description` | TEXT | Detailed description of the request. |
| `request_type` | request_type | Enum: `maintenance`, `safety`, `complaint`, `question`, `account_access`, `other`. |
| `status` | request_status | Enum: `pending`, `in_progress`, `resolved`, `rejected`. |
| `priority` | request_priority | Enum: `normal`, `urgent`, `emergency`. |
| `location_type` | TEXT | `community`, `custom`, or NULL. |
| `location_id` | UUID | Foreign Key to `locations.id` (if `community`). |
| `is_anonymous` | BOOLEAN | If true, hides the creator's identity from other residents. |
| `is_public` | BOOLEAN | If true, other residents in the tenant can view and comment. |
| `images` | TEXT[] | Array of Supabase Storage URLs. |
| `admin_internal_notes` | TEXT | Notes only visible to admins. |
| `rejection_reason` | TEXT | Reason provided to resident if request is rejected. |

## comments Table

The comments table supports conversation threads for individual requests.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key. |
| `tenant_id` | UUID | Foreign Key to `tenants.id`. |
| `resident_request_id` | UUID | Foreign Key to `resident_requests.id`. |
| `author_id` | UUID | Foreign Key to `users.id` (Author of the comment). |
| `content` | TEXT | The message body. |
| `created_at` | TIMESTAMPTZ| Auto-populated. |

## Row-Level Security (RLS)

### resident_requests
*   **Select**:
    *   Admins can see all requests in their tenant.
    *   Residents can see their own requests (`original_submitter_id = auth.uid()`).
    *   Residents can see public requests in their tenant (`is_public = true`).
*   **Insert**: Authenticated users can insert into their own tenant.
*   **Update**: Only admins can update status and internal notes. Creators can update content (if allowed by business logic).

### comments
*   **Select**: Users can see comments if they are an admin, the request creator, or if the request is public.
*   **Insert**: Allowed if the user can view the request.
