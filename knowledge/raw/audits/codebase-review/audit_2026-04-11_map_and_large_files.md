# Audit: Map & Mapbox Implementation + Large Files

**Date**: 2026-04-11
**Type**: Module + Cross-cutting
**Focus**: Security, Performance, Code Quality, Understanding
**Scope**: `components/map/`, `app/t/[slug]/admin/map/`, `app/t/[slug]/dashboard/community-map/`, `lib/mapbox-geocoding.ts`, and top 10 largest source files

---

## Context

This audit examines the Map/Mapbox implementation and the largest files in the codebase. The map system is a core feature of the Ecovilla Community Platform, providing community visualization, location management, check-in display, and admin editing capabilities. The large files represent areas of high complexity that are prone to maintenance issues.

**Files in scope:**
- `components/map/MapboxViewer.tsx` — 2,079 lines (resident map viewer)
- `app/t/[slug]/admin/map/viewer/admin-map-client.tsx` — 2,015 lines (admin map viewer)
- `components/map/MapboxEditorClient.tsx` — 512 lines (drawing/editing overlay)
- `components/map/location-info-card.tsx` — 912 lines (location detail sidebar)
- `app/t/[slug]/dashboard/community-map/community-map-client.tsx` — 240 lines (resident map page wrapper)
- `components/map/geojson-preview-map.tsx` — 548 lines
- `components/map/EditSidebar.tsx` — 269 lines
- `lib/mapbox-geocoding.ts` — 78 lines
- Plus top large files: `app/actions/events.ts` (2,262), `app/actions/exchange-listings.ts` (1,690), `app/actions/check-ins.ts` (1,039), `app/actions/announcements.ts` (809), `app/actions/resident-requests.ts` (610), `app/actions/families.ts` (594), `app/actions/exchange-transactions.ts` (705)

---

## Prior Work

- **Wiki**: `knowledge/wiki/lessons/geojson-data.md` — GeoJSON schema constraints, text vs numeric type mismatch, cache invalidation
- **Wiki**: `knowledge/wiki/patterns/offline-map.md` — IndexedDB persistence, transformRequest pattern, tenant partitioning
- **Requirements**: `requirements_2026-02-10_mapbox_cleanup_and_facility_icons.md` — Duplicate facility markers, icon customization (partially addressed)
- **Requirements**: `requirements_2026-02-10_view_on_map_refactor.md` — Legacy map consolidation (partially addressed)
- **Requirements**: `requirements_2026-03-11_offline_map_capabilities.md` — Offline map (not yet implemented)
- **Build log**: `log_2026-03-12_mapbox_cleanup_icons.md` — Parked by user
- **Prior audits**: `audit_2026-04-11_full_codebase.md`, `audit_2026-04-11_components_module.md`, `audit_2026-04-11_data_flow_crosscutting.md` — General findings but no map-specific deep dive
- **Retro**: `retro_2026-04-11_audit-coverage-gaps.md` — Identified map as partially audited

---

## Understanding Mapping

### Architecture Overview

```
components/map/
├── MapboxViewer.tsx (2,079 lines)     → Resident map: full viewer with search, filters, layers, check-ins, sidebar
├── location-info-card.tsx (912 lines) → Location detail card with resident/family/pet data fetching
├── geojson-preview-map.tsx (548 lines)→ GeoJSON upload preview + save
├── MapboxEditorClient.tsx (512 lines) → Drawing tools (point/line/polygon) + edit sidebar wrapper
├── geojson-upload-dialog.tsx (272 lines)
├── EditSidebar.tsx (269 lines)        → Location create/edit form
├── form-fields/                       → Type-specific form fields (Facility, Lot, WalkingPath)
├── DrawingToolbar.tsx (113 lines)     → Drawing mode controls
├── types.ts (139 lines)               → Shared type definitions
└── location-type-cards.tsx (130 lines)

app/t/[slug]/admin/map/
├── viewer/admin-map-client.tsx (2,015 lines) → Admin map: near-duplicate of MapboxViewer with edit capabilities
├── admin-map-client.tsx (38 lines)           → Thin wrapper
├── map-settings-dialog.tsx (143 lines)
└── locations/create/page.tsx (98 lines)

app/t/[slug]/dashboard/community-map/
└── community-map-client.tsx (240 lines) → Resident map page wrapper around MapboxFullViewer
```

### Data Flow

```
Server Component (page.tsx)
  → Fetch locations via lib/data/locations.ts (enriched with relations)
  → Pass to CommunityMapClient or AdminMapClient
    → MapboxFullViewer / AdminMapClient
      → useMemo: Convert locations → GeoJSON (boundary, lots, facilities, streets, paths)
      → useMemo: Calculate centroids via @turf/turf
      → useMemo: Filter/distribute check-ins
      → Render: react-map-gl <Map> with <Source>/<Layer>/<Marker>
      → User interaction → setSelectedLocation → LocationInfoCard/sidebar
        → LocationInfoCard: Client-side Supabase queries for neighborhood, lot, residents, pets
```

### Key Dependencies

| Dependency | Usage |
|-----------|-------|
| `react-map-gl` | Map rendering wrapper around Mapbox GL JS |
| `mapbox-gl` | Core map engine (CSS imported) |
| `@turf/turf` | GeoJSON processing (centroid, point-in-polygon) |
| `@/lib/data/locations` | Location data fetching with relations |
| `@/lib/analytics` | MapAnalytics event tracking |
| `@/hooks/useGeolocation` | Browser geolocation hook |
| `@/app/actions/check-ins` | RSVP to check-ins |
| `@/app/actions/locations` | CRUD for locations |

### Duplicate Architecture

**CRITICAL**: `MapboxViewer.tsx` (2,079 lines) and `admin-map-client.tsx` (2,015 lines) are **near-duplicates** — they share ~80% of the same logic:
- Same GeoJSON preparation (boundary, lots, facilities, streets, paths)
- Same check-in distribution logic
- Same search/filter UI
- Same layer toggles
- Same base map panel
- Same check-in markers with avatars
- Same sidebar location cards

The differences are:
- Admin map has edit/delete/create capabilities
- Admin map uses `inverseMaskGeoJSON` for boundary masking
- Admin map uses `NavigationControl`/`GeolocateControl` from react-map-gl vs custom SVG buttons
- Resident map has fullscreen toggle, analytics tracking, and `LocationInfoCard` integration

---

## Findings

### 🔴 CRITICAL

| # | Finding | File(s) | Recommendation |
|---|---------|---------|---------------|
| C1 | **Near-duplicate 4,000+ line files** | `MapboxViewer.tsx` + `admin-map-client.tsx` | Extract shared map rendering into a single `BaseMap` component with capability flags |
| C2 | **Client-side data fetching in LocationInfoCard** | `location-info-card.tsx:141-243` | Component makes 4+ sequential Supabase queries on mount — should be server-enriched |
| C3 | **`any` type proliferation in map components** | Multiple files | `CheckIn` interface uses `any` in MapboxViewer, admin-map-client uses `as any` extensively |
| C4 | **42 console.log statements in map components** | All map files | Debug logging in production exposes internal state, location IDs, and user data |

### 🟡 HIGH

| # | Finding | File(s) | Recommendation |
|---|---------|---------|---------------|
| H1 | **GeoJSON recomputation on every render** | `MapboxViewer.tsx:472-633` | 7 separate `useMemo` blocks each iterate all locations — combine into single derived state |
| H2 | **Check-in distribution is O(n²)** | `MapboxViewer.tsx:636-698`, `admin-map-client.tsx:403-474` | For each check-in, filters all check-ins again — should use spatial index or grouping |
| H3 | **`@turf/turf` imported entirely** | `MapboxViewer.tsx:6` | Only `centroid` and `booleanPointInPolygon` are used — use subpath imports to reduce bundle |
| H4 | **Large action files lack Zod validation** | `events.ts` (2,262), `exchange-listings.ts` (1,690), `check-ins.ts` (1,039) | Only `events.ts` imports Zod; `check-ins.ts` and `exchange-listings.ts` have no input validation schemas |
| H5 | **Mapbox token exposed in client component** | `MapboxViewer.tsx:108` | `process.env.NEXT_PUBLIC_MAPBOX_TOKEN` is read inside component — should be passed as prop or via context |
| H6 | **`preserveDrawingBuffer: true` forces GPU memory retention** | `MapboxViewer.tsx:962` | Only needed for screenshot/export — causes unnecessary GPU memory usage on mobile |

### 🟠 MEDIUM

| # | Finding | File(s) | Recommendation |
|---|---------|---------|---------------|
| M1 | **Hardcoded default coordinates** | `MapboxViewer.tsx:124`, `admin-map-client.tsx:155` | `9.9567, -84.5333` (Costa Rica) hardcoded — should come from tenant config |
| M2 | **`style jsx global` for fullscreen CSS** | `MapboxViewer.tsx:1444-1450` | Inline `<style jsx global>` adds runtime overhead — move to CSS module or Tailwind |
| M3 | **Duplicate facility marker rendering** | `MapboxViewer.tsx:1117-1159` AND `1213-1265` | Same JSX rendered twice with minor differences — was flagged in requirements but not fully cleaned |
| M4 | **`as any` casts in check-in RSVP handlers** | `MapboxViewer.tsx:1887-1938` | Optimistic update uses `as any` — should use proper union type |
| M5 | **No error boundary around map** | `MapboxViewer.tsx` | Map errors (token invalid, WebGL failure) crash the entire page |
| M6 | **`window.location.href` redirect in admin map** | `admin-map-client.tsx:1280` | Uses `window.location.href` instead of Next.js router — causes full page reload |
| M7 | **Large action files are monolithic** | `events.ts` (2,262), `exchange-listings.ts` (1,690) | Single file contains create, update, delete, series, RSVP, visibility — should be split by domain |
| M8 | **`check-ins.ts` has verbose debug logging** | `check-ins.ts:28-96` | 10+ console.log/error statements in production server action |

### 💭 LOW

| # | Finding | File(s) | Recommendation |
|---|---------|---------|---------------|
| L1 | **`community-map-client.tsx` props use `any`** | `community-map-client.tsx:22-24` | `counts: any`, `locations: any[]`, `checkIns?: any[]` |
| L2 | **SVG icons inline in JSX** | `MapboxViewer.tsx:1289-1442` | Zoom/compass/geolocate buttons use inline SVG data URIs — could use Lucide icons |
| L3 | **`MapboxEditorClient` wraps `MapboxFullViewer`** | `MapboxEditorClient.tsx:267` | Editor composes viewer but passes `checkIns={[]}` — inconsistent API |
| L4 | **Offline map not implemented** | Requirements exist, no code | `requirements_2026-03-11_offline_map_capabilities.md` was approved but never built |

---

## Security Findings

### C2: Client-Side Data Fetching in LocationInfoCard (CRITICAL)

**File**: `location-info-card.tsx:141-243`

The `LocationInfoCard` component makes direct Supabase client queries on mount:
```typescript
const { data: userData } = await supabase.auth.getUser()
const { data: user } = await supabase.from("users").select("tenant_id").eq("id", userData.user.id).single()
const { data: tenant } = await supabase.from("tenants").select("slug, reservations_enabled")...
const { data } = await supabase.from("neighborhoods").select("id, name").eq("id", location.neighborhood_id).single()
const { data } = await supabase.from("lots").select("id, lot_number").eq("id", location.lot_id).single()
const { data } = await supabase.from("users").select("id, first_name, last_name...").eq("lot_id", location.lot_id)
const { data: petsData } = await supabase.from("pets").select("...").eq("family_unit_id", family.id)
```

**Risk**: 7 sequential queries on every location selection. While RLS should protect data, this pattern:
- Bypasses the data layer (`lib/data/locations.ts`) which has enrichment logic
- Creates a parallel data access path that's harder to audit
- Exposes query patterns to client-side inspection
- No caching — re-fetches on every location change

**Remediation**: Enrich location data server-side before passing to `MapboxFullViewer`. The `getLocations` function in `lib/data/locations.ts` already supports relation enrichment — extend it to include neighborhood, lot, residents, and pets.

### C3: `any` Type Proliferation

**Files**: `MapboxViewer.tsx:30-59`, `admin-map-client.tsx:72-73`, `community-map-client.tsx:22-24`

The `CheckIn` interface in `MapboxViewer.tsx` is locally defined with loose types:
```typescript
interface CheckIn {
    resident: { id: string; first_name: string; ... }
    location: { id: string; name: string; ... } | null
    // Additional properties used in component
    activity_type?: string
    title?: string
    // ... 10+ optional fields
}
```

And used with `as any` casts throughout:
```typescript
const liveCheckIns = checkIns.filter((checkIn: any) => { ... })
const sameLocation = liveCheckIns.filter((ci: any) => { ... })
setSelectedLocation(updatedCheckIn) // as any
```

**Risk**: Type safety is completely bypassed. Runtime errors from missing properties are silent until they crash the UI.

**Remediation**: Import `CheckInWithRelations` from `@/lib/data/check-ins` (already used in admin-map-client). Remove local `CheckIn` interface.

### H5: Mapbox Token in Client Component

**File**: `MapboxViewer.tsx:108`

```typescript
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
```

While `NEXT_PUBLIC_` prefix is intentional for client-side use, reading it inside the component means:
- Every instance re-reads the env var
- No validation that the token exists before rendering the map
- The error message exposes the env var name

**Remediation**: Pass token as a prop from the server component, or create a `MapboxProvider` context.

---

## Performance Findings

### C1: Near-Duplicate 4,000+ Line Files (CRITICAL)

**Impact**: 
- **Bundle size**: Both files import `react-map-gl`, `@turf/turf`, `mapbox-gl.css` — Mapbox GL JS alone is ~200KB gzipped
- **Maintenance**: Any bug fix or feature addition must be applied to both files
- **Code review**: 4,000 lines of near-identical code makes review nearly impossible

**Evidence of duplication**:
| Feature | MapboxViewer | admin-map-client |
|---------|-------------|-----------------|
| GeoJSON preparation | ✅ 7 useMemo blocks | ✅ 7 useMemo blocks (identical logic) |
| Check-in distribution | ✅ O(n²) algorithm | ✅ O(n²) algorithm (identical) |
| Search/filter UI | ✅ | ✅ (identical JSX) |
| Layer toggles | ✅ | ✅ (identical) |
| Base map panel | ✅ | ✅ (identical) |
| Check-in markers | ✅ | ✅ (identical) |
| Category buttons | ✅ | ✅ (identical) |

**Remediation**: Create a `BaseMap` component that handles all shared rendering, with capability flags:
```typescript
interface BaseMapProps {
  mode: 'resident' | 'admin' | 'editor'
  locations: LocationWithRelations[]
  // ... shared props
  onLocationEdit?: (id: string) => void  // admin only
  enableDrawing?: boolean                 // editor only
}
```

### H1: GeoJSON Recomputation

**File**: `MapboxViewer.tsx:472-633`

Seven separate `useMemo` blocks each iterate the entire `locations` array:
1. `boundaryGeoJSON` — finds boundary location
2. `lotsGeoJSON` — filters + maps lots
3. `lotLabelsGeoJSON` — filters + maps lot centroids (depends on #2)
4. `facilitiesGeoJSON` — filters + maps facilities
5. `facilityLabelsGeoJSON` — filters + maps facility centroids (depends on #4)
6. `streetsGeoJSON` — filters + maps streets
7. `pathsGeoJSON` — filters + maps paths

**Impact**: On every `locations` change, the array is iterated 7+ times. For 200 locations, that's 1,400+ iterations per render.

**Remediation**: Single `useMemo` that produces all GeoJSON in one pass:
```typescript
const geojsonData = useMemo(() => {
  const result = { boundary: null, lots: [], facilities: [], streets: [], paths: [] }
  for (const loc of locations) {
    switch (loc.type) {
      case 'boundary': result.boundary = ...; break
      case 'lot': result.lots.push(...); break
      // ...
    }
  }
  return result
}, [locations])
```

### H2: O(n²) Check-in Distribution

**File**: `MapboxViewer.tsx:636-698`

```typescript
return liveCheckIns.map((checkIn: any) => {
  // For EACH check-in, filter ALL check-ins to find co-located ones
  const sameLocation = liveCheckIns.filter((ci: any) => {
    return Math.abs(ciCoords.lat - coords.lat) < 0.0001 && ...
  })
  // Then find index within sameLocation group
  const ciIndex = sameLocation.findIndex((ci: any) => ci.id === checkIn.id)
})
```

**Impact**: 50 check-ins = 2,500 comparisons. 200 check-ins = 40,000 comparisons.

**Remediation**: Group by location first, then distribute:
```typescript
const groupedByLocation = new Map<string, CheckIn[]>()
for (const ci of liveCheckIns) {
  const key = `${ciCoords.lat.toFixed(4)}:${ciCoords.lng.toFixed(4)}`
  groupedByLocation.get(key)?.push(ci) || groupedByLocation.set(key, [ci])
}
// Then distribute each group in one pass
```

### H3: Full @turf/turf Import

**File**: `MapboxViewer.tsx:6`

```typescript
import * as turf from "@turf/turf"
```

Only two functions are used: `turf.centroid()` and `turf.booleanPointInPolygon()`.

**Impact**: `@turf/turf` is ~300KB minified. Subpath imports reduce to ~30KB.

**Remediation**:
```typescript
import centroid from "@turf/centroid"
import booleanPointInPolygon from "@turf/boolean-point-in-polygon"
```

### H6: preserveDrawingBuffer

**File**: `MapboxViewer.tsx:962`

```typescript
preserveDrawingBuffer={true}
```

This forces the WebGL context to retain its drawing buffer, preventing GPU memory optimization.

**Impact**: Increased GPU memory usage, especially on mobile devices with limited VRAM.

**Remediation**: Only enable when screenshot/export functionality is active.

---

## Code Quality Findings

### C4: 42 Console Statements in Map Components

| File | Count | Severity |
|------|-------|----------|
| `location-info-card.tsx` | 18 | HIGH — logs resident names, IDs, family data |
| `geojson-preview-map.tsx` | 10 | MEDIUM — logs GeoJSON processing |
| `MapboxViewer.tsx` | 7 | MEDIUM — logs check-in data, map events |
| `admin-map-client.tsx` | 5 | MEDIUM — logs check-in distribution |
| `FacilityFields.tsx` | 3 | LOW — debug logging |
| `MapboxEditorClient.tsx` | 2 | LOW — error logging |

**Risk**: Production console logs expose:
- Resident names and IDs
- Location coordinates
- Internal state transitions
- Query results with counts

**Remediation**: Remove all `console.log`/`console.warn` statements. Keep `console.error` only for genuine error conditions, gated behind `NODE_ENV !== 'production'`.

### M7: Monolithic Action Files

| File | Lines | Functions | Recommendation |
|------|-------|-----------|---------------|
| `app/actions/events.ts` | 2,262 | createEvent, updateEvent, deleteEvent, createSeries, updateSeries, deleteSeries, rsvpToEvent, getEventRSVPs, canUserViewEvent | Split into `events.ts`, `event-series.ts`, `event-rsvps.ts` |
| `app/actions/exchange-listings.ts` | 1,690 | CRUD + category management + flag handling | Split into `exchange-listings.ts`, `exchange-categories.ts` |
| `app/actions/check-ins.ts` | 1,039 | createCheckIn, updateCheckIn, deleteCheckIn, rsvpToCheckIn, getCheckIns | Split into `check-ins.ts`, `check-in-rsvps.ts` |
| `app/actions/announcements.ts` | 809 | CRUD + archive + read tracking | Split into `announcements.ts`, `announcement-reads.ts` |
| `app/actions/exchange-transactions.ts` | 705 | Full transaction lifecycle | Already reasonable size but could split status transitions |
| `app/actions/families.ts` | 594 | Family CRUD + member management | Split into `families.ts`, `family-members.ts` |
| `app/actions/resident-requests.ts` | 610 | Request CRUD + comments | Split into `requests.ts`, `request-comments.ts` |

### M3: Duplicate Facility Marker Rendering

**File**: `MapboxViewer.tsx`

Two separate blocks render facility markers:
- Lines 1117-1159: First block
- Lines 1213-1265: Second block (nearly identical)

The requirements doc (`requirements_2026-02-10_mapbox_cleanup_and_facility_icons.md`) identified this as a copy-paste error causing z-fighting. The build log shows this was "parked by user."

---

## Recommendations

### Immediate (This Sprint)

- [ ] **C1**: Extract shared map rendering into `BaseMap` component — eliminates 4,000+ lines of duplication
- [ ] **C2**: Move LocationInfoCard data fetching to server-side enrichment in `lib/data/locations.ts`
- [ ] **C4**: Remove all 42 console.log statements from map components (keep only console.error for genuine errors)
- [ ] **H2**: Fix O(n²) check-in distribution with grouping algorithm

### Short-term (Next Sprint)

- [ ] **H1**: Combine 7 GeoJSON useMemo blocks into single derived state
- [ ] **H3**: Use @turf subpath imports to reduce bundle by ~270KB
- [ ] **H4**: Add Zod validation to `check-ins.ts` and `exchange-listings.ts` actions
- [ ] **H6**: Remove `preserveDrawingBuffer: true` or gate behind screenshot flag
- [ ] **M7**: Split `events.ts` (2,262 lines) into domain-specific files

### Medium-term (Backlog)

- [ ] **C3**: Replace all `any` types with proper interfaces from `lib/data/`
- [ ] **H5**: Pass Mapbox token as prop instead of reading env var in component
- [ ] **M1**: Replace hardcoded coordinates with tenant config
- [ ] **M5**: Add error boundary around map component
- [ ] **M6**: Replace `window.location.href` with Next.js router
- [ ] **L4**: Implement offline map capabilities (requirements already approved)

---

## File Size Summary

| Rank | File | Lines | Domain |
|------|------|-------|--------|
| 1 | `packages/rio-agent/src/public/dist/llm/model/provider-types.generated.d.ts` | 3,550 | Generated (exclude) |
| 2 | `app/actions/events.ts` | 2,262 | Server actions |
| 3 | `types/supabase.ts` | 2,187 | Generated types |
| 4 | `components/map/MapboxViewer.tsx` | 2,079 | Map component |
| 5 | `app/t/[slug]/admin/map/viewer/admin-map-client.tsx` | 2,015 | Map component |
| 6 | `app/actions/exchange-listings.ts` | 1,690 | Server actions |
| 7 | `app/t/[slug]/dashboard/settings/family/family-management-form.tsx` | 1,105 | Form |
| 8 | `app/actions/check-ins.ts` | 1,039 | Server actions |
| 9 | `app/t/[slug]/dashboard/events/(management)/create/event-form.tsx` | 944 | Form |
| 10 | `components/map/location-info-card.tsx` | 912 | Map component |

**Note**: Generated files (#1, #3) are excluded from refactoring. The remaining 8 files are the primary targets.

---

*Audit completed 2026-04-11*
