---
title: Extract shared map rendering into BaseMap component
status: open
created: 2026-04-11
updated: 2026-04-11
effort: large
category: architecture
module: components/map/MapboxViewer.tsx, app/t/[slug]/admin/map/viewer/admin-map-client.tsx
---

# Extract shared map rendering into BaseMap component

## Finding
`MapboxViewer.tsx` (2,079 lines) and `admin-map-client.tsx` (2,015 lines) are near-duplicates sharing ~80% of the same logic: GeoJSON preparation, check-in distribution, search/filter UI, layer toggles, base map panel, and check-in markers. This creates 4,000+ lines of duplicated code that must be maintained in parallel.

## Files
- `components/map/MapboxViewer.tsx`
- `app/t/[slug]/admin/map/viewer/admin-map-client.tsx`

## Suggested fix
Create a `BaseMap` component that handles all shared rendering with capability flags:
```typescript
interface BaseMapProps {
  mode: 'resident' | 'admin' | 'editor'
  locations: LocationWithRelations[]
  checkIns?: CheckInWithRelations[]
  // ... shared props
  onLocationEdit?: (id: string) => void  // admin only
  enableDrawing?: boolean                 // editor only
}
```
Differences (edit capabilities, inverse mask, control styles) become conditional renders based on `mode`.
