---
title: Feature Flag Gating
description: Rio feature flags — enabled vs rag logic, fail-closed behavior
categories: [feature-flags, security, frontend]
sources: [log_2026-03-22_issue_199_feature_gate.md, log_2026-03-22_issue_195_bff_flags.md]
---

# Feature Flag Gating

## Core Pattern: Dual-Flag Logic

Río requires BOTH `enabled` AND `rag` flags for full functionality:

```typescript
// BFF gate (fail-closed)
if (!tenant.rio.enabled) {
  return Response.json({ error: 'Río is not enabled' }, { status: 403 });
}
if (tenant.rio.rag) {
  // Enable RAG tools
}

// UI gate
const showRioChat = rio.enabled && rio.rag;
```

## Lessons from Production

### 1. Fail-Closed Default

Hide UI completely if either flag is missing/false:

```typescript
if (!rio.enabled || !rio.rag) {
  return null; // Don't render component
}
```

### 2. Feature Flag Hierarchy

- `rio.enabled` — Core functionality (chat UI)
- `rio.rag` — Knowledge base retrieval
- Hierarchy: enabled must be true first

### 3. Cross-Component Gating

Apply flags consistently across:
- BFF API route
- Navigation components
- Settings page UI
- Admin dashboards

---

## Related

- [feature-flags](./feature-flags.md)