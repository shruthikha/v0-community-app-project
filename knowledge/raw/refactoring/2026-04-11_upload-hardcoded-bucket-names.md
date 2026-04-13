---
title: Bucket names hardcoded across upload module
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: tech-debt
module: app/api/upload/route.ts
---

# Bucket names hardcoded across upload module

## Finding

The strings `"photos"` and `"documents"` are hardcoded in multiple places:
- `app/api/upload/route.ts:40` — bucket inference logic
- `lib/supabase-storage.ts:12` — default parameter
- `lib/supabase-storage.ts:52` — default parameter
- `lib/supabase-storage-client.ts:12` — default parameter

This creates maintenance burden and risk of typos.

## Files
- `app/api/upload/route.ts`
- `lib/supabase-storage.ts`
- `lib/supabase-storage-client.ts`

## Suggested fix

Create a shared constant or enum:

```typescript
// lib/storage-constants.ts
export const STORAGE_BUCKETS = {
  PHOTOS: "photos" as const,
  DOCUMENTS: "documents" as const,
} as const

export type BucketName = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS]
```
