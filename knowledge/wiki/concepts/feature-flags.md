---
title: Feature Flags
description: Fail-closed tenant feature flags, PostHog integration
categories: [features, configuration]
sources: [prd_2026-02-14_sprint_4_directory_and_access.md, prd_2026-03-22_sprint_11_rio_resident_chat.md]
---

# Feature Flags

## Tenant-Level Flags

Store in `tenants.features`:

```sql
-- Database column
ALTER TABLE tenants ADD COLUMN features JSONB DEFAULT '{}';

-- Example row
{
  "access_requests_enabled": true,
  "rio": {
    "enabled": true,
    "rag": true,
    "memory": false
  }
}
```

## Fail-Closed Pattern

```typescript
const getFeature = (tenant, feature: string) => {
  if (!tenant.features) return false;
  if (!tenant.features[feature]) return false;
  return tenant.features[feature];
};
```

## Access Request Feature

- Controlled via backoffice UI
- Per-tenant toggle
- No code deploy needed

## Río Feature Flags

- `$rio.enabled` — Core chat UI
- `$rio.rag` — Knowledge base retrieval
- `$rio.memory` — Conversation history

---

## Related

- [feature-flag-gating](../lessons/feature-flag-gating.md)