---
title: Upload route uses error:any in catch blocks
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: readability
module: app/api/upload/route.ts
---

# Upload route uses error:any in catch blocks

## Finding

Both `app/api/upload/route.ts:45` and `app/api/upload/delete/route.ts:18` use `error: any` in their catch blocks, violating the codebase prohibition on `any` types.

## Files
- `app/api/upload/route.ts:45`
- `app/api/upload/delete/route.ts:18`

## Suggested fix

Replace `error: any` with proper error typing:

```typescript
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error"
  console.error("[v0] Upload error:", message)
  return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
}
```
