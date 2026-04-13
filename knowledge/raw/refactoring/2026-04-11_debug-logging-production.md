---
title: Debug logging persists in production login code
status: open
created: 2026-04-11
updated: 2026-04-11
priority: medium
category: security
author: /audit
---

# Debug Logging Persists in Production Login Code

## Finding
The tenant login form (`app/t/[slug]/login/login-form.tsx`) contains debug logging that persists in production:
```typescript
if (process.env.NODE_ENV !== "production") {
  console.log("[v0] Login check - ID:", authData.user.id, "Tenant:", tenant.id, "Role: resident")
  console.log("[v0] Login check result:", { residentData, residentError })
}
```

This logs PII in non-production environments and creates unnecessary logging in any build.

## Files
- `app/t/[slug]/login/login-form.tsx` (lines 131-139)

## Recommendation
Remove debug logging before production, or use a dedicated debug utility that can be disabled at build time.

## Status
**Open** - Medium priority, should be cleaned up