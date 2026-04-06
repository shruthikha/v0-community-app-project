# Security & Privacy Implementation

The profile system implements multi-layered security to ensure tenant isolation and resident data sovereignty.

## Tenant Isolation (RLS)

All profile-related tables employ **Row Level Security (RLS)** in PostgreSQL.

- **Policy**: `tenant_id = current_setting('app.current_tenant')::uuid`
- **Scope**: Residents and Admins can only view or modify records belonging to their authenticated tenant.

## Privacy Masking Logic

Visibility is determined by the resident's specific privacy choices, persisted in the `user_privacy_settings` table.

### Neighbor Directory Filters
When a resident queries the directory, the application layer (or a database view) masks fields based on the target user's settings:

1. **Visibility Logic**: Individual boolean flags per field (e.g., `show_email`, `show_phone`, `show_bio`).
2. **Persistence**: Stored in the `privacy_settings` JSONB column of the `users` table.

### Río AI Access
Río's access to profile data is filtered through the `privacy_settings` at the embedding stage. Data marked as "private" is excluded from the context window during RAG (Retrieval Augmented Generation) operations.

## Thread Separation
Río maintains distinct chat threads per `user_id` and `tenant_id`.

- **Logic**: Threads are partitioned in the vector store using metadata filters.
- **Privacy**: Profiling data from one resident never cross-pollinates into the Río assistant interactions of another resident, even within the same Household, unless specifically shared.

## Admin Oversight vs. Resident Privacy
While Admins have broad access to directory info for management, sensitive personal data (Interests, Journey details) is primarily resident-facing. Admins primarily manage the "Identity" layer (Email, Role, Lot) rather than the "Personal" layer.
