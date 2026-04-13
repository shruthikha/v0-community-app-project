# Map Component Architecture Pattern

> Two near-duplicate 2,000+ line files share ~80% of logic. Extract shared rendering into a single BaseMap component.

## The Problem

| File | Lines | Purpose |
|------|-------|---------|
| `components/map/MapboxViewer.tsx` | 2,079 | Resident map viewer |
| `app/t/[slug]/admin/map/viewer/admin-map-client.tsx` | 2,015 | Admin map viewer |

These files share:
- Same GeoJSON preparation (7 identical `useMemo` blocks)
- Same check-in distribution logic (same O(n²) algorithm)
- Same search/filter UI
- Same layer toggles
- Same base map panel
- Same check-in markers with avatars
- Same category buttons

## Recommended Architecture

```
components/map/
├── BaseMap.tsx              # Shared rendering engine (~800 lines)
├── MapboxViewer.tsx         # Resident wrapper (~200 lines)
├── AdminMapClient.tsx       # Admin wrapper (~200 lines)
├── MapEditorClient.tsx      # Editor wrapper (~200 lines)
├── location-info-card.tsx   # Location detail sidebar
├── geojson-preview-map.tsx  # Upload preview
├── DrawingToolbar.tsx       # Drawing tools
├── form-fields/             # Type-specific form fields
└── types.ts                 # Shared types
```

### BaseMap Interface

```typescript
interface BaseMapProps {
  mode: "resident" | "admin" | "editor"
  locations: LocationWithRelations[]
  checkIns: CheckInWithRelations[]
  boundaryGeoJSON: GeoJSON.Feature | null
  lotsGeoJSON: GeoJSON.FeatureCollection
  facilitiesGeoJSON: GeoJSON.FeatureCollection
  streetsGeoJSON: GeoJSON.FeatureCollection
  pathsGeoJSON: GeoJSON.FeatureCollection

  // Resident-only
  onLocationSelect?: (location: LocationWithRelations) => void
  enableAnalytics?: boolean

  // Admin-only
  onLocationEdit?: (id: string) => void
  onLocationDelete?: (id: string) => void
  onLocationCreate?: () => void
  enableNavigationControls?: boolean

  // Editor-only
  enableDrawing?: boolean
  onDrawingComplete?: (geojson: GeoJSON.Feature) => void
}
```

## GeoJSON Preparation Optimization

```typescript
// ❌ 7 separate useMemo blocks — iterates locations 7 times
const boundaryGeoJSON = useMemo(() => locations.find(l => l.type === "boundary"), [locations])
const lotsGeoJSON = useMemo(() => locations.filter(l => l.type === "lot").map(...), [locations])
const facilitiesGeoJSON = useMemo(() => locations.filter(l => l.type === "facility").map(...), [locations])
// ... 4 more

// ✅ Single pass — iterates locations once
const geojsonData = useMemo(() => {
  const result = {
    boundary: null as GeoJSON.Feature | null,
    lots: [] as GeoJSON.Feature[],
    facilities: [] as GeoJSON.Feature[],
    streets: [] as GeoJSON.Feature[],
    paths: [] as GeoJSON.Feature[],
  }
  for (const loc of locations) {
    switch (loc.type) {
      case "boundary": result.boundary = toGeoJSON(loc); break
      case "lot": result.lots.push(toGeoJSON(loc)); break
      case "facility": result.facilities.push(toGeoJSON(loc)); break
      case "street": result.streets.push(toGeoJSON(loc)); break
      case "path": result.paths.push(toGeoJSON(loc)); break
    }
  }
  return result
}, [locations])
```

## Check-in Distribution Optimization

```typescript
// ❌ O(n²) — for each check-in, filters all check-ins
const distributed = checkIns.map(ci => {
  const sameLocation = checkIns.filter(other =>
    Math.abs(other.lat - ci.lat) < 0.0001 && Math.abs(other.lng - ci.lng) < 0.0001
  )
  return { ...ci, group: sameLocation, index: sameLocation.indexOf(ci) }
})

// ✅ O(n) — group first, then distribute
const grouped = new Map<string, CheckIn[]>()
for (const ci of checkIns) {
  const key = `${ci.lat.toFixed(4)}:${ci.lng.toFixed(4)}`
  if (!grouped.has(key)) grouped.set(key, [])
  grouped.get(key)!.push(ci)
}
const distributed = checkIns.map(ci => {
  const key = `${ci.lat.toFixed(4)}:${ci.lng.toFixed(4)}`
  const group = grouped.get(key)!
  return { ...ci, group, index: group.indexOf(ci) }
})
```

## Bundle Size Optimization

```typescript
// ❌ Full import — ~300KB
import * as turf from "@turf/turf"

// ✅ Subpath imports — ~30KB
import centroid from "@turf/centroid"
import booleanPointInPolygon from "@turf/boolean-point-in-polygon"
```

## GPU Memory Optimization

```typescript
// ❌ Always retains GPU memory
<Map preserveDrawingBuffer={true}>

// ✅ Only when screenshot/export is active
<Map preserveDrawingBuffer={isExporting}>
```

## Error Boundary

```tsx
<ErrorBoundary fallback={<MapErrorFallback />}>
  <BaseMap mode="resident" {...props} />
</ErrorBoundary>
```

## Checklist

- [ ] Extract shared rendering into `BaseMap` component
- [ ] Combine 7 GeoJSON `useMemo` blocks into single pass
- [ ] Fix O(n²) check-in distribution with grouping
- [ ] Use @turf subpath imports
- [ ] Gate `preserveDrawingBuffer` behind export flag
- [ ] Add error boundary around map component
- [ ] Pass Mapbox token as prop from server component
- [ ] Replace `window.location.href` with Next.js router
- [ ] Remove all console.log statements (keep only console.error for genuine errors)

## Related Patterns

- `patterns/error-boundaries.md` — Error boundary placement
- `patterns/react-perf.md` — React performance patterns
- `lessons/geojson-data.md` — GeoJSON data patterns
