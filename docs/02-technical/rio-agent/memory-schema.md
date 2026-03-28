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

## Mastra Memory Layers (Sprint 12)
Río utilizes Mastra's native memory orchestration, scoped via `resourceId = userId`:

1. **In-Session Context**: Standard message history (limited to last 20 messages per request).
2. **Working Memory**: A collection of learned facts about the resident (e.g., "likes tea", "preferred language is Spanish"). These are extracted by the LLM and persist across threads.
3. **Semantic Recall**: Vectorized message history allowing the agent to perform similarity searches over past conversations to surface long-term context.

## Isolation Logic
Tenant and User isolation is enforced via a combination of **Resource Scoping** and **PostgreSQL Row Level Security (RLS)**:
1. The BFF ensures `resourceId` passed to Mastra is always the authenticated `userId`.
2. Mastra scopes all `workingMemory` and `semanticRecall` operations to this `resourceId`.
3. Database level isolation is enforced via policies on `rio_threads` and `rio_messages` matching the `tenant_id` and `user_id`.
4. The database enforces policies: `WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`.

## Row Level Security (RLS)
> [!IMPORTANT]
> As of Sprint 8, all `rio_*` tables have RLS enabled and hardened. This ensures a strict cryptographic boundary where users can never access threads or chunks belonging to another tenant, even if the application layer fails to pass the correct filters.
