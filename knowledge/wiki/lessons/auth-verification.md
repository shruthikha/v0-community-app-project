---
title: Auth Verification Before Admin Access
---

# Auth Verification Before Admin Access

When an endpoint or action uses an elevated Supabase client such as `createAdminClient` or a service role key, the request must still verify the caller's role first.

## Why it matters

A valid session alone is not sufficient for privileged operations. If a handler uses service-role access without checking whether the user is allowed to perform the action, it can bypass RLS and grant access too broadly.

## Pattern

1. Verify the current user session.
2. Load the user's profile or role.
3. Reject the request unless the caller has the expected privilege.
4. Only then use the admin client.

## Example

```ts
if (!profile?.is_tenant_admin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

const admin = createAdminClient()
```

## Related cases

- `app/api/v1/access-request/route.ts`
- `app/api/v1/lots/route.ts`
- Backoffice login and invite flows

## Notes

Service-role access bypasses RLS, so authorization must happen before the elevated client is used.