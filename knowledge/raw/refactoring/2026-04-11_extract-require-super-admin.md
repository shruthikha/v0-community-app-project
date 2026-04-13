# Refactoring Opportunity: Extract requireSuperAdmin() utility

**Date**: 2026-04-11
**Source**: Audit `audit_2026-04-11_backoffice_module.md` (Finding M2)
**Severity**: Medium (code quality)

## Problem

Four server pages in the backoffice module repeat the same 10-line auth + role check pattern:

```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  redirect("/backoffice/login")
}
const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()
if (userError || userData?.role !== "super_admin") {
  redirect("/backoffice/login")
}
```

Files affected:
- `app/backoffice/dashboard/layout.tsx`
- `app/backoffice/dashboard/page.tsx`
- `app/backoffice/dashboard/tenants/[id]/page.tsx`
- `app/backoffice/dashboard/tenants/[id]/features/page.tsx`

## Recommendation

Create a shared server utility:

```typescript
// lib/auth/require-super-admin.ts
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/backoffice/login")
  }
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()
  if (userError || userData?.role !== "super_admin") {
    redirect("/backoffice/login")
  }
  return { user, userData }
}
```

Then each page becomes:
```typescript
const { user, userData } = await requireSuperAdmin()
```

## Benefits
- DRY principle
- Single point of change if auth logic needs updating
- Consistent error handling
- Easier to add logging/telemetry

## Risk
Low. Pure extraction, no behavior change.
