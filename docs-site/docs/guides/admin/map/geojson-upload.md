# GeoJSON Bulk Upload

For large-scale updates or initial community setup, administrators can bulk-create locations by uploading standardized GeoJSON files.

## 1. File Selection & Validation
Select a `.json` or `.geojson` file from your device. The system checks for basic GeoJSON compliance and matches features against the community's location schema.

![GeoJSON Upload](/screenshots/map_geojson_upload_dialog_05(1).png)

## 2. Coordinate Transformation (Warping)
If your source file uses a projected coordinate system (like UTM or CRTM05), the upload tool will automatically detect and "warp" the coordinates into **WGS84 (EPSG:4326)**, which is required for Mapbox rendering.

![Coordinate Transformation](/screenshots/map_geojson_upload_dialog_05(2).png)

## 3. Preview & Staging
Before any data is written to the database, you can preview the features on the map. This ensures that polygons align correctly with physical markers and background satellite imagery.

![GeoJSON Preview](/screenshots/map_geojson_preview_staging_06.png)

## 4. Final Import
Once verified, click **Import Features**. The system will create the locations and generate appropriate metadata stubs for further manual refinement if needed.
