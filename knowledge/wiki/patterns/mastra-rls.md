---
source: nido_patterns
imported_date: 2026-04-08
---

# Mastra + RLS Patterns

## Framework-RLS Session Initialization

Frameworks (Mastra) manage their own DB connections which lack session context for RLS:

```typescript
// packages/rio-agent/src/lib/init-rls.ts
import pg from 'pg';

export async function initRls(pool: pg.Pool, tenantId: string, userId: string) {
  const client = await pool.connect();
  await client.query('SET LOCAL app.current_tenant = $1', [tenantId]);
  await client.query('SET LOCAL app.current_user = $1', [userId]);
  return client;
}
```

## RLS Connection Pool Affinity

The `pool.query()` shorthand may use different connections. Use dedicated client:

```typescript
// ✅ CORRECT: Dedicated client
const client = await pool.connect();
await client.query('SET LOCAL app.current_tenant = $1', [tenantId]);
const result = await client.query('SELECT * FROM table');
client.release();

// ❌ WRONG: Shortcut may use different connection
await pool.query('SET LOCAL app.current_tenant = $1', [tenantId]);
// RLS context lost on next query
```

## Metadata Trigger Pattern

For Mastra tables, use metadata triggers to inherit tenant_id:

```sql
-- Trigger to inherit tenant_id from thread to messages
CREATE OR REPLACE FUNCTION set_thread_tenant()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tenant_id := (SELECT tenant_id FROM mastra_threads WHERE id = NEW.thread_id);
  NEW.user_id := (SELECT user_id FROM mastra_threads WHERE id = NEW.thread_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_thread_tenant
BEFORE INSERT ON mastra_messages
FOR EACH ROW EXECUTE FUNCTION set_thread_tenant();
```

## UUID Casting in Triggers

Handle null/malformed metadata safely:

```sql
-- Safe casting with exception handling
CREATE OR REPLACE FUNCTION safe_cast_uuid()
RETURNS TRIGGER AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  tenant_uuid := NULL;
  BEGIN
    tenant_uuid := (NEW.metadata->>'tenantId')::uuid;
  EXCEPTION WHEN OTHERS THEN
    tenant_uuid := NULL;
  END;
  NEW.tenant_id := tenant_uuid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```