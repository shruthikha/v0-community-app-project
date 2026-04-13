# Refactoring Opportunity: Move tenant CRUD to server actions

**Date**: 2026-04-11
**Source**: Audit `audit_2026-04-11_backoffice_module.md` (Findings H2, H3)
**Severity**: High (security)

## Problem

Tenant creation, editing, and deletion all happen client-side using the anon-key Supabase client:

- `app/backoffice/dashboard/create-tenant/page.tsx` — creates tenants and admin users
- `app/backoffice/dashboard/tenants/[id]/edit/edit-tenant-form.tsx` — edits tenants, manages admins, deletes tenants

While RLS policies should prevent unauthorized access, the business logic (checking for related data before deletion, validating inputs, generating slugs) runs in the browser and can be bypassed.

## Recommendation

Create server actions for each mutation:

```typescript
// app/actions/tenant-actions.ts
"use server"

import { requireSuperAdmin } from "@/lib/auth/require-super-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const CreateTenantSchema = z.object({
  name: z.string().min(1).max(100),
  maxNeighborhoods: z.number().int().min(1),
  address: z.string().nullable(),
  adminName: z.string().optional(),
  adminEmail: z.string().email().optional(),
})

export async function createTenantAction(rawInput: unknown) {
  await requireSuperAdmin()
  const input = CreateTenantSchema.parse(rawInput)
  // ... creation logic
}

export async function deleteTenantAction(tenantId: string) {
  await requireSuperAdmin()
  // ... deletion logic with related data checks
}
```

## Benefits
- Server-side authorization on every mutation
- Zod validation on all inputs
- Cannot be bypassed by manipulating browser requests
- Consistent error handling

## Risk
Medium. Requires careful migration to ensure existing flows continue working. Should be done incrementally (one action at a time).

## Dependencies
- `requireSuperAdmin()` utility (see `2026-04-11_extract-require-super-admin.md`)
- Zod validation schemas
