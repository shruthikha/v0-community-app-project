---
title: Upload path missing tenant_id prefix
status: in-progress
created: 2026-04-11
updated: 2026-04-12
effort: medium
category: security
module: lib/supabase-storage.ts
related_spec: docs/specs/residential-lot-images/spec.md
---

# Upload path missing tenant_id prefix

## Finding
Server-side `uploadFile()` stores files as `year/month/uuid-filename` without tenant_id prefix. RLS policies expect first folder to be tenant_id. This breaks tenant isolation and may cause uploads to be rejected by RLS.

Client-side `uploadFileClient()` correctly uses `tenantId/year/month/uuid-filename` — server-side should match.

## Files
- `lib/supabase-storage.ts` (line 20)

## Suggested fix
Add `tenantId` parameter to `uploadFile()`. Change path to `tenantId/year/month/uuid-filename`. Extract tenant_id from authenticated user context.

## Status Update (2026-04-12)
**In progress** — This gap will be addressed by the Residential Lot Images spec:
- `docs/specs/residential-lot-images/spec.md`

The spec includes:
1. Modify uploadFile() to add tenantId parameter
2. Add RLS "Legacy Mode" policy for existing files without prefix
3. Add storage RLS policy allowing residents to manage their own lot's photos

## Related
- GitHub Issue: #66
- Audit: `knowledge/raw/audits/audit_2026-04-11_upload-api.md` (Finding C3)
