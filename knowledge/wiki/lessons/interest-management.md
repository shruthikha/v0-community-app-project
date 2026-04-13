---
title: Interest & Skill Management
description: Inline creation, derived filters, backend-first pattern
categories: [database, ux, backend-first]
sources: [log_2026-03-08_resident_interest_creation.md]
---

# Interest & Skill Management

## Inline Creation Pattern

Create interests from search dropdowns:

```typescript
const onMouseDown = (e: MouseEvent) => {
  e.preventDefault(); // Prevent focus collision with onBlur
  e.stopPropagation();
  
  if (isNewValue) {
    createInterest(value); // Immediate insert
  } else {
    selectInterest(value);
  }
};
```

⚠️ `onMouseDown` + `preventDefault` avoids focus collision with `onBlur`.

## Derived Filters

Derive filter options from resident data, not table query:

```typescript
// GOOD: Derive from data for user-generated content
const interests = residents.flatMap(r => r.interests);
const uniqueInterests = [...new Set(interests)].sort();

// This ensures user-created interests show up immediately
```

## Backend-First Pattern

Refactor client mutations to Server Actions:

```typescript
// BAD: Client-side Supabase mutation
const save = async () => {
  await supabase.from('interests').insert(...);
};

// GOOD: Server Action
'use server';
const save = async () => {
  const admin = createAdminClient();
  await admin.from('interests').insert(...);
};
```

## RLS Scoping

```sql
-- Tenant-scoped INSERT
CREATE POLICY "tenant_insert_interests" ON interests
FOR INSERT WITH CHECK (tenant_id = auth.jwt()->>'tenant_id');
```

---

## Related

- [backend-first-auth](../patterns/backend-first-auth.md)