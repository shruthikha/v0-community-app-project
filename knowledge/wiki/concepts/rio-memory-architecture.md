---
title: Río Memory Architecture
description: Working memory, semantic recall, thread management
categories: [ai, memory, architecture]
sources: [requirements_2026-03-26_rio_memory_foundation.md, requirements_2026-03-28_rio_mastra_memory_config.md, requirements_2026-03-28_rio_conversation_continuity.md]
---

# Río Memory Architecture

## Three Memory Layers

| Layer | Type | Scope | Description |
|-------|------|-------|------------|
| **Working Memory** | Active | `userId` | Facts learned during current conversation |
| **Semantic Recall** | Passive | `userId` | Vector retrieval from past threads |
| **Profile Injection** | Static | `userId` | Known facts from user profile |

## Thread Management

### Server-Authoritative Threads

```typescript
// BFF: Create thread server-side
const thread = await fetch('/api/v1/ai/threads/new', {
  headers: { 'x-user-id': userId }
});

// Client: Use server-provided ID
const threadId = thread.id;
```

### Session Timeout

- **15-minute inactivity** → new thread created
- **Multi-tab sync** → localStorage listener
- **Device continuity** → TTL-based validation

## Memory Configuration

```typescript
const memoryConfig = {
  lastMessages: 10,
  workingMemory: { enabled: true, scope: 'resource' },
  semanticRecall: { enabled: true, topK: 5, threshold: 0.75 }
};
```

## Resource Scoping

**CRITICAL**: `resourceId` MUST be `userId`, not `tenantId`:

```typescript
// BAD: Shared memory
resourceId: 'rio-chat'

// GOOD: User-scoped
resourceId: userId
```

---

## Related

- [mastra-memory-config](../lessons/mastra-memory-config.md)
- [3-tier-prompt](./3-tier-prompt.md)