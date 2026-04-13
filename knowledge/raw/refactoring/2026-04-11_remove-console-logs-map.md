---
title: Remove 42 console.log statements from map components
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: security
module: components/map/
---

# Remove 42 console.log statements from map components

## Finding
42 console.log/console.warn/console.error statements exist across map components, exposing resident names, IDs, location coordinates, and internal state transitions in production.

Breakdown:
- `location-info-card.tsx`: 18 statements (logs resident names, IDs, family data)
- `geojson-preview-map.tsx`: 10 statements
- `MapboxViewer.tsx`: 7 statements
- `admin-map-client.tsx`: 5 statements
- `FacilityFields.tsx`: 3 statements
- `MapboxEditorClient.tsx`: 2 statements

## Files
- `components/map/location-info-card.tsx`
- `components/map/geojson-preview-map.tsx`
- `components/map/MapboxViewer.tsx`
- `app/t/[slug]/admin/map/viewer/admin-map-client.tsx`
- `components/map/form-fields/FacilityFields.tsx`
- `components/map/MapboxEditorClient.tsx`

## Suggested fix
Remove all console.log/console.warn. Keep console.error only for genuine error conditions, gated behind `process.env.NODE_ENV !== 'production'`. Consider using a structured logger for production errors.
