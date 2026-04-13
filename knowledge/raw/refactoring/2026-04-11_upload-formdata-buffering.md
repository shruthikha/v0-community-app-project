---
title: Upload endpoint buffers entire FormData in memory
status: open
created: 2026-04-11
updated: 2026-04-11
effort: medium
category: performance
module: app/api/upload/route.ts
---

# Upload endpoint buffers entire FormData in memory

## Finding

The `POST /api/upload` handler uses `await request.formData()` which buffers the entire request body in memory before processing. For files near the 10MB limit, this consumes significant server memory per concurrent request.

## Files
- `app/api/upload/route.ts:6`

## Suggested fix

For future scalability, consider streaming the file upload instead of buffering. Next.js Route Handlers support streaming via `request.body` as a ReadableStream. This would allow processing the file in chunks and uploading to Supabase Storage incrementally.

Alternatively, if streaming is too complex for the current use case, at minimum add a concurrency limiter to prevent memory exhaustion under load.
