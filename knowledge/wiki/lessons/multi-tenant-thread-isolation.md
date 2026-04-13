---
title: Multi-Tenant Thread Isolation
description: Thread-level isolation, user-level vs tenant-level, Memory API
categories: [ai, mastra, security]
sources: [log_2026-03-17_169-multi-tenant-thread-isolation.md]
---

# Multi-Tenant Thread Isolation

## Isolation Levels

### User-Level (Strict)

Threads must be resident-specific:

```typescript
// Thread ID includes both tenant and user
const threadId = `${tenantId}-${userId}-${conversationId}`;
```

### Tenant-Level (Shared)

For group channels where residents share threads:

```typescript
const threadId = `${tenantId}-shared-${channelId}`;
```

## ThreadStore Abstraction

```typescript
class ThreadStore {
  async create(options: { tenantId: string; userId: string }) {
    const thread = await this.mastra.memory.createThread({
      metadata: { tenantId: options.tenantId, userId: options.userId }
    });
    return thread;
  }
}
```

## RLS Metadata Enforcement

Database trigger to sync metadata:

```sql
CREATE TRIGGER sync_mastra_metadata_to_columns
BEFORE INSERT OR UPDATE ON mastra_threads
FOR EACH ROW
EXECUTE FUNCTION inherit_row_metadata();
```

## Security Patterns

1. **Ownership Check**: Verify `tenantId` and `userId` match before allowing access
2. **Frontend Cache**: Scope localStorage keys by `userId` to prevent PII leaks
3. **Communal Thread Anti-Pattern**: Residents should NOT share thread history unless explicitly designed as a "Public Group Channel"

---

## Related

- [mastra-memory-config](./mastra-memory-config.md)