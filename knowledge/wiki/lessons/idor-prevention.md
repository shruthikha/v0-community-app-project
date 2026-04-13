# IDOR Prevention in Server Actions

> Server actions that accept user-controlled IDs must verify the caller has permission to access that resource.

## The Vulnerability

```typescript
// ❌ VULNERABLE — accepts userId without verification
export async function updateBasicInfo(userId: string, data: {...}) {
  const supabase = createAdminClient()  // Bypasses RLS
  await supabase.from("users").update(data).eq("id", userId)
}
```

Any authenticated user can call this with any `userId` — including admin accounts.

## The Fix

```typescript
// ✅ SECURE — verify caller identity first
export async function updateBasicInfo(userId: string, data: {...}) {
  // Step 1: Authenticate
  const supabaseAuth = createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Step 2: Verify ownership
  if (user.id !== userId) throw new Error("Forbidden")

  // Step 3: Proceed with admin client
  const supabase = createAdminClient()
  await supabase.from("users").update(data).eq("id", userId)
}
```

## Reference Implementation

`app/actions/profile.ts` is the canonical secure pattern:
1. Authenticate with `createClient()`
2. Verify `user.id === userId`
3. Only then use `createAdminClient()`

## Affected Files (as of 2026-04-11)

| File | Status |
|------|--------|
| `app/actions/onboarding.ts` | ❌ No auth verification |
| `app/actions/interests.ts` | ❌ No auth verification |
| `app/actions/profile.ts` | ✅ Reference implementation |

## Server Actions With No Auth Checks

These files have no authentication at all:
- `interests.ts`
- `tenant-features.ts`
- `event-categories.ts`
- `exchange-history.ts`
- `neighborhoods.ts`
- `neighbor-lists.ts`

## Checklist

- [ ] Authenticate caller before any admin client usage
- [ ] Verify `user.id === userId` for user-scoped operations
- [ ] Verify tenant membership for tenant-scoped operations
- [ ] Verify role for admin-scoped operations
- [ ] Never accept `userId` as the sole authorization check

## Related Patterns

- `patterns/backend-first-auth.md` — Defense-in-depth auth
- `patterns/admin-client-authorization.md` — Admin client patterns
- `concepts/authz-boundaries.md` — Authorization boundaries
