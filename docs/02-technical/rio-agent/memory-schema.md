# Río Agent: Memory Schema

Río utilizes Mastra's `PostgresStore` for persistent conversation memory. This data is stored in the `public` schema of the Supabase database.

## Core Tables (Mastra v1.x)

### `mastra_threads`
Stores metadata for individual conversation sessions.
- **`id`**: Unique identifier (UUID).
- **`resourceId`**: Mapped to **`userId`** for strict resident-level isolation.
- **`metadata`**: JSONB column storing our `tenantId`, `userId`, and the auto-generated `title`.
- **`updated_at`**: Timestamp for ordering and "Active Thread" lookup.

### `mastra_messages`
Stores the actual message history linked to threads.
- **`id`**: Unique identifier.
- **`thread_id`**: Foreign key to `mastra_threads`.
- **`role`**: `user`, `assistant`, or `tool`.
- **`content`**: The message text or tool calls.
- **`createdAt`**: Timestamp for ordering.

### `mastra_observational_memory`
Stores the **Semantic Recall** vector embeddings. 
- Uses the `pgvector` extension to enable cross-session context recall based on similarity thresholds (0.75).

## Mastra Memory Layers (Sprint 12)
Río utilizes Mastra's native memory orchestration, scoped via `resourceId = userId`:

1. **In-Session Context**: Standard message history (limited to last 10 messages per request).
2. **Working Memory**: A collection of learned facts about the resident (e.g., "likes tea", "preferred language is Spanish"). These are extracted by the LLM and persist across threads.
3. **Semantic Recall**: Vectorized message history allowing the agent to perform similarity searches over past conversations to surface long-term context.

## Historical Data Pruning (Privacy Enforcement)
To prevent "Ghost Memories" and ensure GDPR compliance, Río implements an automated pruning mechanism when facts are deleted:

1. **Working Memory**: The specific fact is removed from the YAML-like block in `mastra_threads.metadata` or the equivalent `workingMemory` persistent state.
2. **Chat History Redaction**: The `redactHistoricalFact` utility performs a case-insensitive `regexp_replace` across all messages in `mastra_messages` belonging to the user. **Security**: User-provided facts are escaped for regex metacharacters before insertion to prevent POSIX injection.
3. **Semantic Erasure**: Corresponding vectorized chunks are deleted from the `memory_messages` vector table. **Performance**: Queries use indexed `resource_id` and `resourceId` metadata for high-speed cleanup.

## Isolation Logic
Tenant and User isolation is enforced via a combination of **Resource Scoping** and **PostgreSQL Row Level Security (RLS)**:
1. The BFF ensures `resourceId` passed to Mastra is always the authenticated `userId`.
2. Mastra scopes all `workingMemory` and `semanticRecall` operations to this `resourceId`.
3. Database level isolation is enforced via policies on `mastra_threads` and `mastra_messages` matching the `app.current_tenant` and `app.current_user` session variables.
4. The database enforces policies: `WHERE tenant_id = current_setting('app.current_tenant', true)::uuid`.

## Row Level Security (RLS)
> [!IMPORTANT]
> All `mastra_*` tables in the Supabase instance have RLS enabled and hardened. This ensures a strict cryptographic boundary where users can never access threads belonging to another tenant or another resident, even if the application layer fails.
