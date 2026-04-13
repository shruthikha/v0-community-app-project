---
name: migration-safety
description: Pre-flight checks and gates for Supabase database migrations. Ensures staging-first verification, rollback plans, and safe dev-to-prod flow. Use when any work touches supabase/migrations/ or when /ship runs.
---

# Migration Safety

Database migrations are the highest-risk operation in Nido. This skill enforces gates that prevent data loss and downtime.

## When to Use

- Any PR that adds/modifies files in `supabase/migrations/`
- During `/implement` when a plan includes migration tasks
- During `/ship` (always — migration check is mandatory)
- When `devops-engineer` agent handles deployment

## Pre-Flight Checklist

Before merging any migration:

- [ ] **Migration file exists** in `supabase/migrations/` with descriptive name
- [ ] **RLS enabled** on all new tables (`ALTER TABLE x ENABLE ROW LEVEL SECURITY`)
- [ ] **tenant_id present** on all user-facing tables
- [ ] **Rollback script exists** — can this migration be reversed?
- [ ] **Zero-downtime compatible** — no locking operations on large tables
- [ ] **Staging tested** — migration applied cleanly to staging environment
- [ ] **Staging smoke test** — key queries work after migration on staging

## Rollback Strategy

Every migration must have a documented rollback:

```markdown
### Rollback Plan: {migration-name}

**Reverse migration:**
```sql
-- Undo the change
DROP TABLE IF EXISTS new_table;
-- or
ALTER TABLE events DROP COLUMN IF EXISTS new_column;
```

**Data recovery:**
- If data was transformed: [how to restore]
- If data was deleted: [backup location / point-in-time recovery]

**Estimated rollback time:** [X minutes]
```

## Zero-Downtime Migration Pattern

For schema changes on tables with existing data:

```sql
-- Step 1: Add column as NULLABLE (no lock)
ALTER TABLE events ADD COLUMN new_status TEXT;

-- Step 2: Backfill in batches (no lock)
UPDATE events SET new_status = status WHERE id IN (
  SELECT id FROM events WHERE new_status IS NULL LIMIT 1000
);

-- Step 3: Add NOT NULL constraint (brief lock)
ALTER TABLE events ALTER COLUMN new_status SET NOT NULL;

-- Step 4: Swap (brief lock)
ALTER TABLE events RENAME COLUMN status TO old_status;
ALTER TABLE events RENAME COLUMN new_status TO status;

-- Step 5: Drop old column (next deploy)
ALTER TABLE events DROP COLUMN old_status;
```

**Never** combine steps 1-5 in a single migration. Steps 4-5 should be separate migrations.

## Staging-First Flow

```
1. Developer creates migration in `supabase/migrations/`
2. PR opened → migration-safety checklist verified
3. Merge to main
4. GitHub Action: migration-apply.yml
   a. Detect new migrations
   b. Apply to staging
   c. Run smoke tests on staging
   d. If staging passes → apply to production
   e. If staging fails → STOP, notify, don't touch production
5. Post-deploy verification
```

## Dangerous Operations (REQUIRE MANUAL APPROVAL)

These operations cannot be automated safely:

- `DROP TABLE` on tables with data
- `ALTER COLUMN` that changes type with existing data
- Any migration that transforms data (not just schema)
- Removing columns that application code still references

For these: the migration-apply action should **pause and request manual approval** before applying to production.

## Integration with Workflows

### /implement
If the plan touches `supabase/migrations/`:
- Run this skill's pre-flight checklist before marking the task complete
- Include rollback script as a plan task

### /ship
Always run:
1. Check if PR has migration files
2. If yes: verify pre-flight checklist is complete
3. Verify staging application was successful
4. Include migration status in release notes

## Reference

- Full migration playbook: `docs/dev/migration-playbook.md`
- Supabase conventions: `knowledge/wiki/tools/supabase-nido.md`
- GitHub Action: `.github/workflows/migration-apply.yml`
