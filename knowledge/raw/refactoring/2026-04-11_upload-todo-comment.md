---
title: Upload route has unresolved TODO comment
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: tech-debt
module: app/api/upload/route.ts
---

# Upload route has unresolved TODO comment

## Finding

Line 18 of `app/api/upload/route.ts` contains: `// TODO: Pass type preference from client if needed.`

This TODO has been in production code without resolution. The current logic infers bucket from MIME type, which is fragile (a PDF uploaded via photo manager would go to documents bucket unexpectedly).

## Files
- `app/api/upload/route.ts:18`

## Suggested fix

Either:
1. Implement the type preference by accepting a `type` field in FormData (`"image"` or `"document"`)
2. Remove the TODO and document the current behavior as intentional
3. Make bucket selection explicit via a required FormData field
