# Security & Privacy: Requests

The Requests system implements a multi-layered security model using Supabase Row-Level Security (RLS) to enforce tenant isolation and protect resident privacy while enabling community transparency.

## Tenant Isolation

Every record in `resident_requests` and `comments` must have a valid `tenant_id`.
*   **Enforcement**: All server actions verify that the `tenantId` parameter matches the user's authenticated session before performing operations.
*   **RLS**: Policies on both tables include `(tenant_id = (select auth.uid_tenant_id()))` (or equivalent auth helper).

## Request Privacy Levels

The system supports three visibility states for requests:

### 1. Private (Default for Complaints)
*   **Visibility**: Accessible only by the creator and community admins.
*   **Logic**: `is_public` is set to `false`.
*   **Security**: RLS allows access only if `auth.uid() = original_submitter_id` OR the user has the `admin` role.

### 2. Public (Default for Maintenance/Safety)
*   **Visibility**: All residents in the same tenant can view the title, description, photos, and public thread.
*   **Logic**: `is_public` is set to `true`.
*   **Security**: RLS allows `SELECT` access to anyone in the same `tenant_id`.

### 3. Anonymous
*   **Visibility**: Identity of the creator is hidden from other residents.
*   **Logic**: `is_anonymous` is set to `true`.
*   **Implementation**: In the UI, the `created_by` relationship is masked. In the database, the `original_submitter_id` remains for administrative follow-up, but the `created_by` field (used for public display) may be NULL or ignored.

## Comment Security

Comments inherit the visibility of their parent request.
*   **Viewing**: RLS for `comments` checks:
    ```sql
    exists (
      select 1 from resident_requests 
      where resident_requests.id = resident_request_id 
      and (is_public = true or original_submitter_id = auth.uid() or is_admin())
    )
    ```
*   **Posting**: Residents can only post to:
    1.  Their own requests.
    2.  Public requests in their tenant.
    3.  Requests where they are specifically tagged (Future implementation).

## Data Protection

*   **Internal Notes**: The `admin_internal_notes` field is excluded from all resident-facing API responses and client-side queries.
*   **Media**: Images uploaded to the `requests` storage bucket use RLS that mimics the parent request's visibility logic.
