---
title: Database Column Strictness
description: NOT NULL constraints, upsert patterns, column mismatches
categories: [database, schema, supabase]
sources: [log_2026-03-21_rio_settings_page.md]
---

# Database Column Strictness

## NOT NULL Constraints

Always check NOT NULL constraints before partial updates:

```sql
-- Table definition
ALTER TABLE table_name 
ALTER COLUMN column_name SET NOT NULL;
```

When performing upserts, fetch existing required fields:

```typescript
const existing = await supabase
  .from('rio_configurations')
  .select('required_field')
  .eq('tenant_id', tenantId)
  .single();

await supabase
  .from('rio_configurations')
  .upsert({
    ...existing.data,  // Preserve required fields
    ...newData
  });
```

## Column Name Mismatches

Common pitfall: Code uses `prompt_persona` but DB has `prompt_tone`:

```sql
-- Always verify column names via list_tables before writing
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'rio_configurations';
```

## Lessons from Production

1. **Upsert Requirements**: Always check `NOT NULL` constraints on tables when performing partial updates
2. **Idempotency**: For long-running processes (AI ingestion), server-side RPC that checks current state BEFORE updating prevents race conditions
3. **RLS + NOT NULL**: Ensure RLS policies don't conflict with NOT NULL constraints (e.g., super_admin null tenant_id)

---

## Related

- [supabase-multi-tenancy](../patterns/supabase-multi-tenancy.md)