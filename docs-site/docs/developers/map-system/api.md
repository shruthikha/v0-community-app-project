# Map System: API Reference

*Note: This reference documents internal server actions and data utilities used by the Community Map engine.*

## Server Actions
Located at `app/actions/locations.ts`

### `createLocation`
Creates a new geographical feature (Point, Polygon, or LineString) for a tenant.

**Parameters:**
- `data: CreateLocationData`
    - `tenant_id: string`
    - `name: string`
    - `type: "facility" | "lot" | "walking_path" | "neighborhood" | "boundary"`
    - `coordinates`: `{ lat, lng }` (for Points)
    - `boundary_coordinates`: `Array<[number, number]>` (for Polygons)
    - `path_coordinates`: `Array<[number, number]>` (for LineStrings)
    - *Optional Metadata*: `description`, `facility_type`, `color`, `lot_id`, `neighborhood_id`, etc.
- `path?: string`: Optional revalidation path.

**Returns:**
- `{ success: true, data: Location }` OR throws Error.

**Logic Details:**
- Automatically links to `lots` or `neighborhoods` tables if `lot_id` or `neighborhood_id` is provided.
- Triggers path revalidation to update map viewers instantly.

---

### `updateLocation`
Modifies an existing location's geometry or metadata.

**Parameters:**
- `locationId: string`: UUID of the location.
- `data: Partial<CreateLocationData>`
- `path?: string`

**Access Control:** Tenant Admins or Super Admins only.

---

### `deleteLocation`
Permanently removes a location record.

**Special Logic:**
- **Boundary Protection**: If a `boundary` type is deleted, it automatically clears the `map_boundary_coordinates` in the `tenants` table.
- **Check-in Preservation**: To prevent data loss for active resident check-ins, if a location is deleted while residents are "checked in", the system converts those check-ins to `custom_temporary` type, preserving the location name as a snapshot.

---

## Data Fetching
Located at `lib/data/locations.ts`

### `getLocations`
Fetches all geographical features for a specific tenant.

**Parameters:**
- `tenantId: string`

**Returns:** 
- `Location[]`: All active features, including polygons and paths.

---

## Client-Side Logic
Located at `components/map/MapboxFullViewer.tsx`

### Layer Management
The map uses a strict 8-layer visualization stack managed by `MapboxViewer`:
1.  **3D Buildings**: Native Mapbox GL layer.
2.  **Boundary**: Polygon/Line.
3.  **Lots**: Polygon (Interactive).
4.  **Facilities**: Point/Polygon (Interactive).
5.  **Streets**: Line.
6.  **Walking Paths**: Line (Interactive).
7.  **Check-ins**: Symbol/Icon (Real-time).
8.  **Labels**: Symbol (Centroid-anchored).
