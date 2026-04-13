---
title: Move LocationInfoCard data fetching to server-side enrichment
status: open
created: 2026-04-11
updated: 2026-04-11
effort: medium
category: architecture
module: components/map/location-info-card.tsx
---

# Move LocationInfoCard data fetching to server-side enrichment

## Finding
LocationInfoCard makes 7 sequential Supabase client queries on mount: auth.getUser, users.tenant_id, tenants.slug, neighborhoods, lots, users (residents by lot_id), pets. This bypasses the data layer (lib/data/locations.ts) which already has relation enrichment logic, creates a parallel data access path, and has no caching.

## Files
- `components/map/location-info-card.tsx` (lines 141-243)

## Suggested fix
Extend `getLocations` in `lib/data/locations.ts` to include neighborhood, lot, residents, and pets enrichment. Pass enriched data as props to LocationInfoCard instead of having it fetch independently. This follows the Backend-First pattern and eliminates 7 client-side queries per location selection.
