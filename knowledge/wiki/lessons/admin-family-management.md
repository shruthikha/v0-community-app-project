---
title: Admin Family Management
description: Family by lot, server actions for RLS, unlink vs delete
categories: [database, admin, rls]
sources: [log_2026-02-12_issue_72.md]
---

# Admin Family Management

## Auto-Select Family by Lot

Admin can auto-select based on lot assignment:

```typescript
// Server action
const getFamilyByLot = async (lotId: string) => {
  const { data } = await supabase
    .from('families')
    .select('*, members!family_id(*)')
    .eq('lot_id', lotId)
    .single();
  return data;
};
```

## Unlink vs Delete

"Override" means unlink family from lot, NOT delete:

```typescript
// Unlink: Clear lot association
const unlinkFamily = async (familyId: string) => {
  await supabase
    .from('families')
    .update({ lot_id: null })
    .eq('id', familyId);
};
```

## Server Action for RLS

Client-side updates fail RLS. Use server action:

```typescript
'use server';
const addExistingFamilyMember = async (familyId: string, userId: string) => {
  const admin = createAdminClient();
  await admin.from('family_members').insert({...});
};
```

## RLS Recursion Bug

Users table RLS can cause infinite recursion:

```sql
-- Fix: Use simple IS NOT NULL check instead of subquery
CREATE POLICY "users_select" ON users
FOR SELECT USING (auth.uid() IS NOT NULL);
```

---

## Related

- [server-actions](../patterns/server-actions.md)