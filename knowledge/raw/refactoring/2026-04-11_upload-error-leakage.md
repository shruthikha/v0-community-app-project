---
title: Upload route leaks internal error details to client
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: security
module: app/api/upload/route.ts
---

# Upload route leaks internal error details to client

## Finding

The error handler in `app/api/upload/route.ts:47` returns `error.message` directly to the client. Supabase errors may contain internal paths, bucket names, SQL details, or other information that should not be exposed to end users.

## Files
- `app/api/upload/route.ts:47`
- `app/api/upload/delete/route.ts:20`

## Suggested fix

Return a generic error message to the client and log the full error server-side only:

```typescript
return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
```
