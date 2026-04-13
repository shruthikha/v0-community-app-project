# Magic Byte File Validation

> MIME types from `file.type` are client-controlled and easily spoofed. Always verify file signatures.

## The Problem

```typescript
// ❌ WEAK — browser sets file.type, easily spoofed
if (file.type !== "image/jpeg") {
  return { error: "Invalid file type" }
}
```

An attacker can rename `malicious.exe` to `malicious.jpg` and the browser will report `file.type === "image/jpeg"`.

## The Fix: Magic Byte Validation

```typescript
import { fileTypeFromBuffer } from "file-type"

export async function validateFileMagic(file: File, allowedMimes: string[]) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const detected = await fileTypeFromBuffer(buffer)

  if (!detected) {
    return { valid: false, error: "Could not detect file type" }
  }

  if (!allowedMimes.includes(detected.mime)) {
    return { valid: false, error: `File type ${detected.mime} not allowed` }
  }

  return { valid: true, detectedType: detected.mime }
}
```

## Common Magic Bytes

| Format | Magic Bytes (hex) | MIME Type |
|--------|-------------------|-----------|
| JPEG | `FF D8 FF` | `image/jpeg` |
| PNG | `89 50 4E 47 0D 0A 1A 0A` | `image/png` |
| GIF | `47 49 46 38` | `image/gif` |
| WebP | `52 49 46 46 ... 57 45 42 50` | `image/webp` |
| PDF | `25 50 44 46 2D` | `application/pdf` |
| DOCX | `50 4B 03 04` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| XLSX | `50 4B 03 04` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

## Database-Level Protection

```sql
-- Set bucket-level limits as defense-in-depth
ALTER TABLE storage.buckets
  ADD COLUMN file_size_limit BIGINT DEFAULT 10485760,
  ADD COLUMN allowed_mime_types TEXT[];

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'photos';
```

## Defense-in-Depth Layers

1. **Client-side** — `file.type` check (UX only, not security)
2. **Server-side** — Magic byte validation (primary security)
3. **Database-level** — `allowed_mime_types` on bucket (defense-in-depth)
4. **Storage RLS** — Tenant-scoped path prefix (isolation)

## Related Patterns

- `patterns/file-upload-security.md` — Full upload security patterns
- `lessons/supabase-storage-rls.md` — Storage RLS patterns
