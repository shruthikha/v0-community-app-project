---
title: Photos bucket missing creation migration
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: tech-debt
module: supabase/migrations/
---

# Photos bucket missing creation migration

## Finding
RLS policies for the `photos` bucket exist in `20260321000004_fix_storage_rls.sql`, but no migration creates the bucket itself. It was likely created manually in the Supabase dashboard. New environments won't have it.

## Files
- `supabase/migrations/` — missing migration

## Suggested fix
Add idempotent migration:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;
```

## Related
- GitHub Issue: #297
- Audit: `knowledge/raw/audits/audit_2026-04-11_upload-api.md` (Finding C4)
