---
title: Upload endpoint missing authentication
status: open
created: 2026-04-11
updated: 2026-04-11
effort: medium
category: security
module: app/api/upload/route.ts
---

# Upload endpoint missing authentication

## Finding
`POST /api/upload` has no authentication check. Any unauthenticated request can upload files to Supabase Storage. This was flagged in `requirements_2026-02-14_profile_picture_cropping.md` but never implemented.

## Files
- `app/api/upload/route.ts`
- `app/api/upload/delete/route.ts`

## Suggested fix
Add session verification via `createClient()` + `getUser()` at the start of both handlers. Reject unauthenticated requests with 401. Alternatively, wrap with `withAuth()` from `lib/api/middleware.ts` which also includes rate limiting.

## Related
- GitHub Issue: #293
- Audit: `knowledge/raw/audits/audit_2026-04-11_upload-api.md` (Finding C1/C2)
