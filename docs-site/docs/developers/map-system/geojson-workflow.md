# Map System: GeoJSON Workflow

The Community Map supports bulk data operations via a specialized GeoJSON ingestion pipeline designed for GIS interoperability.

## Ingestion Pipeline

### 1. Validation & Parsing
Located at `lib/geojson-parser.ts`
The parser performs a multi-stage audit of uploaded files:
- **Schema Check**: Ensures the file follows the RFC 7946 specification.
- **Type Normalization**: Flattens nested `GeometryCollections` and `MultiLineStrings` into distinct community features.

### 2. Coordinate Transformation
**Critical**: The application internalizes data in **WGS84 (EPSG:4326)**. 
If the parser detects a projected coordinate system (values exceeding standard lat/lng ranges, such as CRTM05), it applies an automated warping transformation:
- **Logic**: Uses `lib/coordinate-transformer.ts` to project coordinates back to WGS84 for Mapbox compatibility.
- **Reporting**: The UI provides a "Coordinates Transformed" alert (see `map_geojson_upload_dialog_05(2).png`).

### 3. Path Analytics
For `LineString` features (Walking Paths), the parser automatically calculates enriched metadata:
- **Path Length**: Cumulative distance in meters using the Haversine formula.
- **Elevation Gain**: Calculated by summing positive changes in the Z-coordinate (if present).
- **Property Mapping**: Maps common GIS property keys (e.g., `difficulty`, `grade`, `surface`) to the application's internal metadata schema.

## Upload Flow
1. **Selection**: User selects `.json` or `.geojson` file.
2. **Preview**: Data is validated and stored in `sessionStorage` (`geojson-preview`).
3. **Staging**: User transitions to `/locations/create?preview=true`.
4. **Save**: The `createLocation` server action iterates through the features to persist them in Supabase.
