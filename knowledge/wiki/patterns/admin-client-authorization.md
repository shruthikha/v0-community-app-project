---
title: Admin Client Authorization Pattern
---

# Admin Client Authorization Pattern

When code uses an elevated Supabase client, authorization must happen before the elevated client is created or used.

## Why it matters

Service-role access bypasses RLS. That is useful for privileged backend workflows, but dangerous if the request was not already verified.

## Pattern

1. Authenticate the caller.
2. Load the caller's role or ownership context.
3. Reject unauthorized requests immediately.
4. Only then create and use the admin client.

## Example

```ts
if (!profile?.is_tenant_admin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

const supabase = createAdminClient()
```

## Related files

- `app/api/v1/access-request/route.ts`
- `app/api/v1/lots/route.ts`
- `app/actions/onboarding.ts`
- `knowledge/wiki/patterns/backend-first-auth.md`
- `knowledge/wiki/patterns/security-patterns.md`
