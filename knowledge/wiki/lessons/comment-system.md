---
title: Comment System & Conversation
description: Threaded comments, RLS vs server action auth, reopen workflow
categories: [database, ux, backend-first]
sources: [log_2026-03-08_reply_to_admin.md]
---

# Comment System & Conversation

## Table Schema

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_request_id UUID REFERENCES resident_requests(id),
  author_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## RLS vs Server Action Auth

When RLS becomes complex, use server action with admin client:

```typescript
// Server action with manual auth checks
'use server';
const addComment = async (requestId: string, content: string) => {
  const auth = await getAuth();
  
  // Manual authorization (more control than complex RLS)
  if (!isAuthorized(auth, requestId)) {
    throw new Error('Not authorized');
  }
  
  const admin = createAdminClient();
  await admin.from('comments').insert({...});
};
```

## Reopen Workflow

```typescript
// Standalone action for cleaner state management
'use server';
const reopenRequest = async (requestId: string) => {
  const admin = createAdminClient();
  
  await admin
    .from('resident_requests')
    .update({ status: 'pending', resolved_at: null })
    .eq('id', requestId);
};
```

## Key Patterns

1. **Explicit FKs** over polymorphic tables for clarity
2. **Backend-first** when RLS gets complex
3. **Standalone actions** for state transitions (not overloading updates)
4. **RLS defense-in-depth** — both policy + server action checks

---

## Related

- [server-actions](../patterns/server-actions.md)