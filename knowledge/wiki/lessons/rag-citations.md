---
title: RAG Citations Protocol
description: RAG tool with citations, SSE streaming, error handling
categories: [ai, rag, citations]
sources: [log_2026-03-22_sprint11_branch3.md]
---

# RAG Citations Protocol

## RAG Tool Implementation

Strict tenant isolation in SQL:

```typescript
const tool = {
  name: 'search_documents',
  description: 'Search community documents',
  execute: async ({ query, tenantId }) => {
    // CRITICAL: Always filter by tenant_id
    const { data } = await pool.query(`
      SELECT content, metadata->>'source' as source
      FROM rio_document_chunks
      WHERE tenant_id = $1 AND content ILIKE $2
      LIMIT 10
    `, [tenantId, `%${query}%`]);
    
    return data.map(chunk => ({
      content: chunk.content,
      citation: chunk.source
    }));
  }
};
```

## Citations Protocol

### BFF → Agent Header

Forward citations via SSE:

```typescript
// Use data-citations for AI SDK compatibility
m.parts.push({
  type: 'data-citations',
  data: citations
});
```

### UI Citation Extraction

Extract from `m.parts` (not `m.annotations`):

```typescript
const citations = m.parts
  .filter(p => p.type === 'data-citations')
  .map(p => p.data);
```

### Citation Formatting

Regex for combined citations `[1, 4]`:

```typescript
const formatMessage = (text) => {
  return text.replace(/\[(\d+(?:,\s*\d+)*)\]/g, 
    (_, nums) => `[${nums}]`
  );
};
```

---

## Security: RAG Override Prevention

Tool-level enforcement (not just BFF):

```typescript
if (!ragEnabled) {
  // Remove tool before sending to agent
  agent = agent.removeTool('search_documents');
}
```

Never trust client-provided `rag` flag.

---

## Related

- [rls-security-hardening](./rls-security-hardening.md)