source: requirement
imported_date: 2026-04-08
---
# Requirements: GeoJSON Upload Reliability & Map Color Customization

## Problem Statement
Admin users need a reliable way to import community map data (walking paths, boundaries, facilities) from GeoJSON files without data loss (altitude) or incorrect geometry processing (merged lines). Additionally, map colors are currently hardcoded, preventing visual differentiation based on specific community needs or aesthetics.

## User Persona
- **Admin**: Manages community map data, imports external data (CAD/GIS), and configures the visual presentation of the map.

## Context
- **GeoJSON Parser**: Currently strips altitude data and incorrectly merges separate LineStrings into a single Polygon ring in some cases.
- **Map Colors**: Hardcoded in `MapboxViewer.tsx` (e.g., Sunrise Orange for boundaries, Warm Amber/Green for lots).
- **Database**: `locations` table does not currently store color information.
- **Missing Features**: 
    - Walking path details (difficulty, surface, length, elevation) are not displayed in the Resident Map sidebar.
    - These fields are not persisted correctly during GeoJSON upload or Editor saves.

## Documentation Gaps
- `docs/02-technical/schema/tables/locations.md` is missing.
- No specification for map styling/theming in `docs/03-design/`.

## Dependencies
- None identified in existing backlog/issues.

## Goals
1. **Fix GeoJSON Upload**:
    - Preserve separate `LineString` features.
    - Preserve Z-coordinate (altitude) data.
2. **Support Color Customization**:
    - Modify schema to support a `color` field in `locations`.
    - Implement a color picker in the Location Creator/Editor.
3. **Walking Path Fields**:
    - Ensure `path_difficulty`, `path_surface`, `path_length`, and `elevation_gain` are effectively saved.
    - Display these fields in the `ResidentMapClient` sidebar location cards.

---
🔁 [PHASE 1 COMPLETE] Handing off to Orchestrator...

## Phase 2: Ideation (Technical Options)

### Option 1: Individual Location Metadata (Flexible)
Add a `color` (text) column to the `locations` table.
- **Pros**: Maximum flexibility; users can color-code specific segments (e.g., "Main Path" vs "Side Path").
- **Cons**: Requires database migration and UI for every location editor. Performance cost of rendering dynamic colors for many features.
- **Effort**: Medium (Migration + Editor UI + Mapbox expression update).

### Option 2: Tenant-Level Type Mapping (Structured)
Store a color mapping (JSON) in the `tenants` table (e.g., `{"walking_path": "#84CC16"}`).
- **Pros**: Consistent branding across the community; easy to change the color of all paths at once. No new column on `locations` needed.
- **Cons**: Less flexible (all paths must be the same color); doesn't support the "special path" use case well.
- **Effort**: Low/Medium (Tenant settings UI + Mapbox expression update).

### Option 3: Batch-Import Color Override (Hybrid)
During GeoJSON import, allow the user to pick a color for the entire batch, which is then stamped onto the `locations` (requires `color` column).
- **Pros**: Best for Bulk imports; easy to distinguish "Import A" from "Import B".
- **Cons**: Doesn't solve the "post-import change" use case unless the Editor also supports it.
- **Effort**: Medium (GeoJSON UI update + Migration).

---
🔁 [PHASE 2 COMPLETE] Handing off to Product Owner...

## Phase 3: Recommendation

### Final Recommendation
We recommend **Option 1 (Individual Location Metadata)**. This provides the granular control requested and avoids potential future technical debt if users want to customize specific features (e.g., highlighting a specific "Heritage Trail"). 

### Implementation Strategy
1. **Database Migration**: Add `color` column to `locations`.
2. **GeoJSON Fixes**: (Immediate Priority) Patch the parser to preserve Z-coordinates and individual segments.
3. **UI Enhancements**: 
   - Add a color picker to the `GeoJSONUploadDialog` (Option 3 style) to allow setting a default for new imports.
    - Add a color picker to the individual Location Editor for manual tweaks.
4. **Walking Path UX**:
    - Update `ResidentMapClient.tsx`: Add a "Trail Details" section to the sidebar that conditionally renders Surface, Difficulty (with badges), Length (km/mi), and Elevation (m/ft).
    - Update `MapboxEditorClient.tsx`: Ensure these fields are included in the `onSave` payload and properly mapped from the database snake_case to the form's camelCase.
5. **Map Rendering**: Update `MapboxViewer` and `GeoJSONPreviewMap` to use the `color` field in their paint properties.

### Metadata
- **Priority**: P0 (GeoJSON Fix) / P1 (Color Picker)
- **Size**: M (Requires migration, parser patch, and new UI components)
- **Horizon**: Q1 26
- **Issue**: [v0-community-app-project#83](https://github.com/mjcr88/v0-community-app-project/issues/83)

## 8. Technical Review

### Phase 0: Context & Impact
- **Impacted Files**:
    - `lib/geojson-parser.ts`: Fix LineString merging logic.
    - `lib/coordinate-transformer.ts`: Fix Z-coordinate stripping.
    - `components/map/MapboxViewer.tsx`: Convert hardcoded colors to data-driven expressions.
    - `components/map/resident-map-client.tsx`: Display walking path fields in sidebar.
- **Historical Context**: `locations` table was introduced in migration `045`. Recent focus has been on CRTM05 coordinate support.

### Phase 1: Security Audit
- **Vibe Check**: RLS is active on `locations`, respecting tenant isolation.
- **Attack Surface**:
    - **Injection**: `color` field must be validated as a valid hex/CSS color on the backend.
    - **PII Leakage**: GIS properties whitelisting is mandatory to prevent accidental exposure of private metadata.
    - **DoS**: Implement file size limits for GeoJSON processing (max 10MB recommended).

### Phase 2: Test Strategy
- **Sad Paths**: Empty files, invalid coordinates (NaN/Infinity), and unsupported geometry types in `GeometryCollection`.
- **Automated Tests**: Unit tests for Z-coordinate preservation and multi-segment mapping in `lib/geojson-parser.test.ts`. Integration tests for `locations.color` persistence.
- **Manual Verification**: Verify individual segment selectability and instant map updates after color changes.

### Phase 3: Performance Review
- **Bottlenecks**: Client-side processing of 5,000+ features in `useMemo` may cause lag.
- **Recommendations**:
    - Implement geometry simplification (`turf.simplify`) for high-resolution imports.
    - Future-proofing: Transition to PostGIS `geometry` types for server-side spatial queries.

### Phase 4: Documentation Plan
- **Mandatory Updates**:
    - **Admin Guide**: Add GeoJSON import best practices.
    - **Resident Guide**: Explain "Trail Details" in sidebar cards.
    - **Schema**: Create `docs/02-technical/schema/tables/locations.md`.
- **Gap Logging**: Logged missing schema and map theming docs to `documentation_gaps.md`.

### Phase 5: Strategic Alignment
- **Conflicts**: Potential overlap with `Location Filtering & Conflict Detection (#61)` and `Granular Facility Location Types (#62)`.
- **Decision**: Prioritized for development. Item converted to **Issue #83**.
- **Sizing**: M (Medium)


