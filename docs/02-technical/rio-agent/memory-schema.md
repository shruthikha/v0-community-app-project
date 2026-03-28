# Río Agent: Memory Schema

Río utilizes Mastra's `PostgresStore` for persistent conversation memory. This data is stored in the `public` schema of the Supabase database.

## Core Tables

### `rio_threads`
Stores metadata for individual conversation sessions.
- **`id`**: Unique identifier (UUID).
- **`tenant_id`**: Multi-tenant isolation.
- **`user_id`**: Owner of the thread.
- **`last_active_at`**: Timestamp for ordering.

### `rio_messages`
Stores the actual message history linked to threads.
- **`id`**: Unique identifier.
- **`thread_id`**: Foreign key to `rio_threads`.
- **`role`**: `user`, `assistant`, or `tool`.
- **`content`**: The message text or tool calls.
- **`created_at`**: Timestamp for ordering.

## Isolation Logic
Tenant isolation is enforced via **PostgreSQL Row Level Security (RLS)**:
1. The BFF extracts the `tenantId` and `userId` from the authenticated JWT.
2. These are passed as headers (`x-tenant-id`, `x-user-id`) to the Rio Agent.
3. The Agent sets these in the Mastra session context.
4. The database enforces policies: `WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`.

## Row Level Security (RLS)
> [!IMPORTANT]
> As of Sprint 8, all `rio_*` tables have RLS enabled and hardened. This ensures a strict cryptographic boundary where users can never access threads or chunks belonging to another tenant, even if the application layer fails to pass the correct filters.
