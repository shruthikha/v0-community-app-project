---
title: Optimize GeoJSON preparation in map components
status: open
created: 2026-04-11
updated: 2026-04-11
effort: medium
category: performance
module: components/map/MapboxViewer.tsx
---

# Optimize GeoJSON preparation in map components

## Finding
MapboxViewer.tsx has 7 separate useMemo blocks that each iterate the entire locations array independently. For 200 locations, that's 1,400+ iterations per render. Additionally, check-in distribution uses O(n²) algorithm — for each check-in, it filters all check-ins to find co-located ones.

## Files
- `components/map/MapboxViewer.tsx` (lines 472-698)
- `app/t/[slug]/admin/map/viewer/admin-map-client.tsx` (lines 238-474)

## Suggested fix
1. Combine 7 GeoJSON useMemo blocks into single derived state with one pass through locations
2. Replace O(n²) check-in distribution with Map-based grouping: group by rounded coordinates first, then distribute within groups
3. Use @turf subpath imports instead of full bundle (@turf/centroid, @turf/boolean-point-in-polygon) — saves ~270KB
