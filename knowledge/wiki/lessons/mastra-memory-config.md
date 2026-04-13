---
title: Mastra Memory Configuration
description: Río AI conversation memory, token limiting, session timeouts
categories: [ai, mastra, memory]
sources: [log_2026-03-28_rio_memory_foundation.md, log_2026-03-28_rio_memory_config.md, log_2026-03-28_rio_memory_privacy.md]
---

# Mastra Memory Configuration

## Memory Architecture

Three-tier prompt composition:

```
Persona (Tier 1) → Community Context (Tier 2) → Resident Context (Tier 3 via BFF)
```

## Tier 3: Resident Context Injection

BFF injects via `x-resident-context` header:

```typescript
// Header must be Base64-encoded for Unicode/Emoji safety
const contextHeader = Buffer.from(
  JSON.stringify(residentProfile)
).toString('base64');

fetch('/ai/chat', {
  headers: { 'x-resident-context': contextHeader }
});
```

⚠️ HTTP headers cannot safely transport non-ASCII characters without encoding.

## TokenLimiter Pattern

Limit message history to 50k tokens:

```typescript
const limiter = new TokenLimiter({
  maxTokens: 50000,
  messages: thread.messages
});

// Iterative pruning for large messages
const pruned = limiter.slice(-5); // Last 5 messages
```

## Session Timeout

15-minute inactivity timeout with thread rotation:

```sql
-- Mastra's PostgresStore does NOT auto-update updated_at
-- Must call updateThread() explicitly
UPDATE mastra_threads 
SET updated_at = NOW() 
WHERE id = p_thread_id;
```

## Security: RAG Override Prevention

Client cannot force RAG if tenant has it disabled:

```typescript
// BFF must enforce tenant config, not client request
const ragEnabled = tenant.rio.rag && request.query.rag;

if (!ragEnabled) {
  // Remove RAG tool from agent tools
  agent = agent.removeTool('search_documents');
}
```

---

## Related

- [backend-first-auth](../patterns/backend-first-auth.md)
- [server-actions](../patterns/server-actions.md)