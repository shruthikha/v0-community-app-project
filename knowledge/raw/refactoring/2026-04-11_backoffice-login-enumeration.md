---
title: Backoffice login queries users by email instead of ID
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: security
author: /audit
---

# Backoffice Login Queries Users by Email Instead of ID

## Finding
The backoffice login flow (`app/backoffice/login/page.tsx`) queries the users table by email:
```typescript
.eq("email", email)
```

This creates an email enumeration vulnerability and differs from the tenant login which queries by `authData.user.id`.

## Files
- `app/backoffice/login/page.tsx` (lines 36-43)

## Recommendation
Query users table by `authData.user.id` instead of email, matching the tenant login pattern:
```typescript
.eq("id", authData.user.id)
```

## Status
**Open** - Critical security finding, should be fixed immediately