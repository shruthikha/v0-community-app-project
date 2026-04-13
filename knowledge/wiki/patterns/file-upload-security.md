# File Upload Security Pattern

> File uploads are a high-value attack surface. Every upload endpoint must enforce authentication, tenant isolation, and content validation.

## Core Requirements

1. **Authentication** — verify user session before processing
2. **Tenant isolation** — path must include `tenant_id` prefix
3. **Content validation** — magic bytes, not just MIME type
4. **Rate limiting** — prevent storage abuse
5. **Input validation** — Zod schema for parameters
6. **Error sanitization** — don't leak internal details

## Authentication

```typescript
// ❌ NO AUTH — anyone can upload
export async function POST(request: Request) {
  const formData = await request.formData()
  // ...process upload
}

// ✅ AUTH REQUIRED
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // ...process upload
}
```

## Tenant Isolation via Path Prefix

```typescript
// ❌ WRONG — no tenant prefix, breaks RLS
const path = `${year}/${month}/${uuid}-${filename}`

// ✅ CORRECT — matches RLS policy expectations
const path = `${tenantId}/${year}/${month}/${uuid}-${filename}`
```

**Critical:** Server-side path must match client-side path pattern. RLS policies check `(storage.foldername(name))[1] == tenant_id`.

## Magic Byte Validation

```typescript
// ❌ WEAK — client-controlled MIME type
if (!ALLOWED_TYPES.includes(file.type)) {
  return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
}

// ✅ STRONG — verify file signature
import { fileTypeFromBuffer } from "file-type"

const buffer = Buffer.from(await file.arrayBuffer())
const detected = await fileTypeFromBuffer(buffer)
if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
  return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
}
```

### Common Magic Bytes

| Format | Magic Bytes |
|--------|-------------|
| JPEG | `FF D8 FF` |
| PNG | `89 50 4E 47` |
| GIF | `47 49 46 38` |
| PDF | `25 50 44 46` |
| WebP | `52 49 46 46 ... 57 45 42 50` |

## Database-Level File Size Limits

```sql
-- Set bucket-level limits
INSERT INTO storage.buckets (id, name, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);
```

## Rate Limiting

```typescript
import { withPublicRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const rateLimit = await withPublicRateLimit("upload", userId, 10, "1m")
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  // ...process upload
}
```

## Error Sanitization

```typescript
// ❌ LEAKS internal details
catch (error: any) {
  return NextResponse.json({ error: error.message }, { status: 500 })
}

// ✅ SAFE
catch (error: unknown) {
  console.error("[upload]", error)
  return NextResponse.json({ error: "Upload failed" }, { status: 500 })
}
```

## Bucket Name Constants

```typescript
// lib/constants.ts
export const STORAGE_BUCKETS = {
  PHOTOS: "photos",
  DOCUMENTS: "documents",
  AVATARS: "avatars",
} as const

// Usage
const bucket = isDocument ? STORAGE_BUCKETS.DOCUMENTS : STORAGE_BUCKETS.PHOTOS
```

## Checklist

- [ ] Authentication required on upload and delete endpoints
- [ ] Tenant ID prefix in upload path
- [ ] Magic byte validation (not just MIME type)
- [ ] Database-level file size limits on all buckets
- [ ] Rate limiting on upload endpoints
- [ ] Zod validation for upload parameters
- [ ] Error responses sanitized
- [ ] Bucket names extracted to constants
- [ ] Dead code endpoints removed (e.g., unused delete route)

## Related Patterns

- `patterns/supabase-multi-tenancy.md` — Tenant isolation patterns
- `tools/supabase-security-checklist.md` — Security verification
- `lessons/supabase-storage-rls.md` — Storage RLS patterns
