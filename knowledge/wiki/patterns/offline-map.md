---
title: Offline Map
description: IndexedDB persistence, transformRequest, tenant partitioning
categories: [map, offline, pwa]
sources: [requirements_2026-03-11_offline_map_capabilities.md]
---

# Offline Map

## Architecture

```typescript
// IndexedDB with tenant partitioning
const db = new IndexedDB('offline-map');

const storeTiles = async (tenantId: string, tiles: Blob[]) => {
  // Partition by tenantId
  const tx = db.transaction(tenantId, 'readwrite');
  await tx.store.put({ tiles, timestamp: Date.now() });
};
```

## TransformRequest Pattern

```typescript
// Mapbox hook for offline tiles
const transformRequest = (url: string) => {
  const cached = getFromIndexedDB(url);
  if (cached) return { url: cached };
  return { url }; // Fetch from network
};
```

## Storage Constraints

- **Zoom levels**: 14-18 only (navigation range)
- **Hero photos**: Max 2-3 per location
- **Quota**: Persistent storage (browser won't auto-delete)

---

## Related

- [mobile-ui](../patterns/mobile-ui.md)