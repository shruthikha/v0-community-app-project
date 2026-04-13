---
source: nido_patterns
imported_date: 2026-04-08
---

# Supabase Concurrency Patterns

## Atomic Updates (CRITICAL)

For inventory and critical resources, use atomic updates to prevent race conditions:

```sql
-- ✅ CORRECT: Atomic decrement
UPDATE items SET quantity = quantity - 1 WHERE id = $1 AND quantity > 0

-- ❌ WRONG: Check-then-set (TOCTOU race condition)
SELECT quantity FROM items WHERE id = $1  -- then decrement in code
```

## Atomic Upsert

Prevent race conditions with ON CONFLICT:

```sql
INSERT INTO documents (id, status, ...)
VALUES ($1, 'processing', ...)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
WHERE documents.status <> 'processing'
RETURNING *;
```

## Foreign Key CASCADE

Default to `ON UPDATE CASCADE` for all Foreign Keys:

```sql
ALTER TABLE example ADD CONSTRAINT fk_user
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE SET NULL ON UPDATE CASCADE;
```