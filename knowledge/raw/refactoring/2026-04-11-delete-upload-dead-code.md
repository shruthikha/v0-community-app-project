---
title: Delete upload endpoint is dead code
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: tech-debt
module: app/api/upload/delete/route.ts
---

# Delete upload endpoint is dead code

## Finding
No component calls `/api/upload/delete`. `photo-manager.tsx` removes photos client-side only. The endpoint exists but is unused — increasing attack surface for no benefit.

## Files
- `app/api/upload/delete/route.ts`

## Suggested fix
Two options:
1. Wire it up: Update components to call delete endpoint when removing photos
2. Remove it: Delete the endpoint to reduce attack surface

## Related
- GitHub Issue: #301
- Audit: `knowledge/raw/audits/audit_2026-04-11_upload-api.md` (Finding H3)
