---
title: Security & Privacy
sidebar_label: Security
---

# Official Documents Security

Security is enforced at the database level via Row Level Security (RLS) and at the storage level via private bucket isolation.

## Row Level Security

### `public.documents`

| Operation | Requirement | Policy Logic |
| :--- | :--- | :--- |
| **SELECT** | Authenticated | `(status = 'published' AND tenant_id = current_tenant) OR (role IN ('admin', 'tenant_admin', 'super_admin'))` |
| **INSERT** | Admin | `role IN ('admin', 'tenant_admin', 'super_admin')` |
| **UPDATE** | Admin | `role IN ('admin', 'tenant_admin', 'super_admin')` |
| **DELETE** | Admin | `role IN ('admin', 'tenant_admin', 'super_admin')` |

### `public.document_reads`

| Operation | Requirement | Policy Logic |
| :--- | :--- | :--- |
| **SELECT** | Self or Admin | `auth.uid() = user_id OR (role IN ('admin', 'tenant_admin', 'super_admin'))` |
| **INSERT** | Self | `auth.uid() = user_id` |

---

## Storage Security

All PDF files and document attachments are stored in the `documents` Supabase Storage bucket.

- **Bucket Privacy**: The bucket is set to `private`. Direct public access is disabled.
- **Access Control**: RLS policies on `storage.objects` ensure only authenticated residents of the specific tenant can read the files.
- **Signed URLs**: The frontend generates time-bound signed URLs (1-hour expiry) to display PDFs within the browser iframe safely.

### Signed URL Generation
The logic resides in `app/t/[slug]/dashboard/official/[id]/page.tsx`:

```typescript
const { data: signedData } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600); // 1-hour expiry for session stability
```

## Data Isolation

Multi-tenancy is strictly enforced via `tenant_id` on every document and read-tracking record. No cross-tenant document leakage is possible under the current RLS architecture.
