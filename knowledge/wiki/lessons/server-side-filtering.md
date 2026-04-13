---
title: Server-Side Data Filtering
description: Privacy filtering on server, admin override, backend-first pattern
categories: [privacy, security, backend-first]
sources: [log_2026-02-09_issue_75_pii_leak_prevention.md]
---

# Server-Side Data Filtering

## Privacy Filtering Pattern

Filter sensitive data on the server before sending to client:

```typescript
// Server Component (page.tsx)
const residents = await getResidents();
const filteredResidents = residents.map(r => {
  if (!canViewPrivateData(r, viewer)) {
    return {
      ...r,
      email: undefined,
      phone: undefined,
    };
  }
  return r;
});
```

## Admin Override Pattern

Tenant admins can view all profiles:

```typescript
const canViewPrivateData = (viewer: User, target: Resident) => {
  if (viewer.isTenantAdmin && viewer.tenant_id === target.tenant_id) {
    return true;
  }
  return viewer.id === target.id; // Self
};
```

## Key Patterns

1. **Filter in Server Component** — not in client
2. **Backend-first** — data never leaks to client
3. **Consistent logic** — shared utility between pages

---

## Related

- [backend-first-auth](../patterns/backend-first-auth.md)