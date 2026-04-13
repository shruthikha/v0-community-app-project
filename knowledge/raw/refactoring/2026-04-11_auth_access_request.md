---
title: Add auth verification to access-request API
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: security
author: @investigator/audit
---

# Add auth verification to access-request API

## Finding
`app/api/v1/access-request/route.ts` uses `createAdminClient` (service role) but only checks session, doesn't verify user role before granting elevated access.

## Files
- `app/api/v1/access-request/route.ts`

## Recommendation
Add role verification before using admin client. Follow pattern in `security-patterns.md`:
```typescript
// Verify user first, then check role
if (!profile?.is_tenant_admin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## Status
**Open** - Security gap per wiki pattern `security-patterns.md`