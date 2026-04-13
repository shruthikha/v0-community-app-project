# Backoffice Client-Side Mutation Risks

> Super-admin operations (tenant creation, deletion, feature flags) must run server-side with explicit authorization. Client-side mutations are bypassable.

## The Vulnerability

```typescript
// ❌ CLIENT-SIDE — bypassable by malicious user
async function handleDelete() {
  const supabase = createClient() // anon key
  // Check for neighborhoods/residents — CAN BE BYPASSED
  const { count } = await supabase.from("neighborhoods").select("*", { count: "exact" })
  if (count > 0) {
    alert("Cannot delete tenant with neighborhoods")
    return
  }
  // Delete tenant — RLS should block, but logic is client-side
  await supabase.from("tenants").delete().eq("id", tenantId)
}
```

## The Fix: Server Actions

```typescript
// ✅ SERVER-SIDE — explicit super_admin verification
"use server"
export async function deleteTenant(tenantId: string) {
  // Step 1: Authenticate
  const supabaseAuth = createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Step 2: Verify super_admin role
  const { data: userData } = await supabaseAuth
    .from("users").select("role").eq("id", user.id).single()
  if (userData?.role !== "super_admin") throw new Error("Forbidden")

  // Step 3: Server-side validation
  const { count: neighborhoodCount } = await supabase
    .from("neighborhoods").select("*", { count: "exact" }).eq("tenant_id", tenantId)
  if (neighborhoodCount && neighborhoodCount > 0) {
    throw new Error("Cannot delete tenant with neighborhoods")
  }

  // Step 4: Delete with admin client
  const supabase = createAdminClient()
  await supabase.from("tenants").delete().eq("id", tenantId)
}
```

## Extract requireSuperAdmin()

```typescript
// lib/super-admin.ts
export async function requireSuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: userData } = await supabase
    .from("users").select("role").eq("id", user.id).single()
  if (userData?.role !== "super_admin") throw new Error("Forbidden")

  return { user, userData }
}
```

## Other Risks Found

| Risk | File | Fix |
|------|------|-----|
| Tenant creation client-side | `create-tenant/page.tsx` | Move to server action |
| Seed API routes lack CSRF | `api/seed-*/route.ts` | Convert to server actions or add CSRF |
| Invite token never invalidated | `create-auth-user-action.ts` | Clear token after signup |
| Duplicate auth+role checks | Multiple server pages | Extract `requireSuperAdmin()` |
| `alert()` for user feedback | Multiple forms | Replace with toast |

## Checklist

- [ ] All tenant CRUD operations in server actions
- [ ] Explicit `requireSuperAdmin()` verification
- [ ] Server-side validation (not client-side)
- [ ] CSRF protection on any remaining API routes
- [ ] Invite tokens cleared after use
- [ ] Toast notifications instead of `alert()`
- [ ] No inline `createClient()` at component scope

## Related Patterns

- `patterns/admin-client-authorization.md` — Admin client patterns
- `patterns/backend-first-auth.md` — Defense-in-depth auth
