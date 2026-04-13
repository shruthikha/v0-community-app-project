source: requirement
imported_date: 2026-04-08
---
# Requirements: Offline Map Capabilities

## Problem Statement
Residents of rural or off-grid communities often lose internet connectivity while navigating their community, especially on hiking trails or in remote areas. Without offline map access, they cannot locate themselves or find important community landmarks and trails safely.

## User Persona
- **Hiker/Explorer**: Residents who use the map to navigate mountain trails and need precise location tracking without data.
- **Rural Resident**: Residents living in areas with unreliable internet who need the map for daily navigation within the community.

## Context
The current implementation uses Mapbox GL JS which fetches tiles and location data dynamically. While Mapbox has internal caching, it is not guaranteed for offline use without a proactive caching strategy.

## Requirements

### 1. Manual Offline Activation
- **Manual Trigger**: A "Use Offline" button must be available at the top of the map page (outside the map canvas).
- **Scope**: When triggered, the app should proactively cache map tiles and location data for the current community.
- **Boundary Based**: Use the tenant's `boundary` location (GeoJSON) from the database to define the geographic bounding box to be cached.

### 2. Data Persistence
- **Per-community Persistence**: Cached data must be "locked" in storage to prevent the browser from auto-cleaning it.
- **Manual Removal**: Users should have a way to clear the cache specifically for a community if space is needed.

### 3. Offline Data Scope
- **Map Tiles**: Satellite and street tiles for the community area at various zoom levels (focused on navigation levels).
- **Location Details**: Basic text info (Name, Type, Description, Trail Stats) for all locations within the boundary.
- **Hero Photos**: Cache the primary (hero) photo for each location to provide visual context without excessive storage use.

### 4. Interactivity
- **Self-Location**: Real-time blue dot (GPS) must work offline.
- **Basic Detail View**: Clicking a location marker should show the detail sidebar with cached text and hero photo.
- **Navigation Indicators**: Trail paths and community boundaries must remain visible.

## Dependencies
- **Mapbox GL JS**: Primary map engine.
- **PWA Manifest**: Currently exists but needs service worker logic for proactive caching.
- **Browser File System / IndexedDB**: For persistent storage of tiles and location metadata.

## Documentation Gaps
- No documented strategy for offline data persistence or tile caching in the current codebase.
- `mobile_audit.md` identifies "Offline support missing" as a high-risk item.

## Issue Context
- **Issue**: [Issue #157](https://github.com/mjcr88/v0-community-app-project/issues/157)

## Technical Options

### Option 1: Service Worker + CacheStorage (Workbox)
Identify map tile requests in a custom Service Worker and cache them using the CacheStorage API.
- **Pros**: Standard PWA approach; caches all map assets (JS, CSS, Tiles) in one layer.
- **Cons**: Granular "per-community" deletion is difficult as tiles are just URLs; no easy way to "lock" specific geographic areas from browser eviction.
- **Effort**: Medium.

### Option 2: IndexedDB + `transformRequest` (Custom Manager)
Intercept Mapbox tile requests using the `transformRequest` hook and store tiles as Blobs in IndexedDB, tagged by `tenantId`.
- **Pros**: Precise control over "per-community" persistence; can store location metadata and photos in the same database; safe from automatic Cache API eviction.
- **Cons**: More complex implementation; requires custom binary storage logic.
- **Effort**: High.

### Option 3: Mapbox v3 Upgrade + `offline-manager` Wrapper
Upgrade to Mapbox GL JS v3 and use its improved internal caching capabilities, wrapped with a custom UI for community-based triggers.
- **Pros**: Uses latest engine features; potentially better performance and native-like caching.
- **Cons**: Upgrade might introduce breaking changes to existing custom layers/markers; GL JS v3 has a different pricing model (per-load) which needs assessment.
- **Effort**: Medium-High.

---

## ⭐️ Recommendation: Option 2 (IndexedDB + transformRequest)

### Rationale
Option 2 remains the strongest choice even for single-community users. 
1. **Durability**: Browsers treat standard caches (Option 1) as temporary. They can delete them if the phone runs low on space. **IndexedDB** is treated as "Persistent Storage"—it stays there until the resident explicitly deletes it, which is critical for hikers in off-grid areas.
2. **Explicit Clearing**: With IndexedDB, the "Clear Map Data" button is highly reliable. We can wipe exactly what was downloaded for that community without affecting other app data.
3. **Hybrid Data**: It allows us to store the "Hero Photo" and trail details (JSON) in the same reliable place as the map images.

### Decision Metadata
- **Architecture**: High-level storage manager component wrapping `idb` library. Integrated via Mapbox's `transformRequest` callback.
- **Security**: All data is public community metadata. No sensitive credentials cached.
- **Performance**: Offloads network requests to local storage, improving "time to map" in low-signal areas.
- **Infrastructure**: Native browser APIs (IndexedDB, StorageManager).
- **Testing**: Requires mocking `transformRequest` and `IndexedDB` in the testing suite.
- **Documentation**: New `docs/02-technical/infrastructure/offline-storage.md` required once implemented.

## Phase 4: User Review & Refinements

### Feedback Received
- **Button Location**: The "Use Offline" button should be placed at the top of the map page (outside the canvas) to maintain a clean UI.
- **Persistence Strategy**: Confirmed that **Per-community persistence** is the safest path, especially for single-tenant users who need reliable trail data.
- **Data Detail**: Confirmed that name, description, and hero photos should be included in the offline data set.

### Sizing & Effort (Recommended Option)
- **Component**: Custom `OfflineStorageManager` (IndexedDB Wrapper).
- **Estimated Size**: Large (L).
- **Complexity**: High (Involves binary blob management, binary serialization, and hook interception).
- **Implementation Effort**: ~3-5 development days.
- **Verification Effort**: ~1-2 days (requires manual offline testing on mobile devices).

---


## 8. Technical Review

### Phase 0: Issue Details & Context
- **Issue**: #157
- **Impact Map**:
    - `components/map/resident-map-client.tsx`: Primary UI for map interaction.
    - `components/map/MapboxViewer.tsx`: Full map viewer component.
    - `lib/data/locations.ts`: Data retrieval layer for locations.
- **Historical Context**: Recent map changes focused on GeoJSON reliability and location beacons. No existing offline logic found in map components.
- **Dependencies**: `idb` (IndexedDB library), `mapbox-gl`.


### Phase 1: Security Audit
- **Vibe Check**: **PASSED**. Approach follows Backend-First principles; client-side IndexedDB acts only as a persistent cache for authorized backend data.
- **Attack Surface**:
    - **Data Sensitivity**: All metadata in `locations` (Name, Description, GeoJSON) is intended for tenant-wide visibility. No sensitive PII or credentials identified for caching.
    - **Cross-Tenant Leakage**: **HIGH RISK**. IndexedDB is origin-bound. If multiple tenants/users share a device, cached data from one tenant could be visible to another.
    - **Mitigation**: **MANDATORY**: IndexedDB collections must be partitioned by `tenantId`. Implementation must include a `clearCache(tenantId)` function for the "Clear Map Data" button.
- **RLS Verification**: `locations` table has `SELECT` policy (Line 3871) restricting visibility to authenticated residents of the same tenant. Caching layer will inherit this security by virtue of using standard data-fetching hooks.


### Phase 2: Test Strategy
- **Sad Paths**:
    - **Offline Sync Failure**: Network drops during the "proactive caching" phase. (Expectation: Resume or mark as partial).
    - **Quota Exceeded**: Device storage is full. (Expectation: User notification + selective cleanup).
    - **Corrupted Blobs**: Cached tile image is corrupted. (Expectation: Fallback to placeholder or re-fetch if online).
    - **Tenant Switch**: User caches Tenant A, then logs into Tenant B. (Expectation: Explicit partitioning ensures no leak).
- **Test Plan**:
    - **Unit (Vitest)**: Test `OfflineStorageManager` (idb wrapper) for CRUD operations on tiles and metadata.
    - **Integration**: Mock `transformRequest` in `ResidentMapClient` to verify it prefers cache when offline.
    - **E2E (Playwright)**:
        1. Open Map -> Click "Use Offline" -> Wait for completion.
        2. `page.setOffline(true)` -> Navigate map -> Verify markers and hero photos display.
        3. Click "Clear Map Data" -> Verify IndexedDB is empty for that `tenantId`.


### Phase 3: Performance Assessment
- **IndexedDB Throughput**: Blobs (Photos) > 1MB should be avoided. Recommend caching only the `hero_photo` and limiting to 2-3 gallery photos per location.
- **Tile Scaling**:
    - **Risk**: Infinite zoom caching would crash the browser/exceed quota.
    - **Constraint**: Strict zoom level range for offline caching: **Zoom 14 (Overview) to 18 (Detailed)**.
- **CPU Overhead**: `parseGeoJSON` is heavy for 1000+ features.
    - **Optimization**: Cache the *parsed result* (Normalized GeoJSON) in IndexedDB alongside the raw source to enable near-instant map initialization when offline.
- **UI Responsiveness**: Proactive caching must run in a Web Worker or use `requestIdleCallback` / small batches to prevent main-thread jank during map movement.


### Phase 4: Documentation Logic
- **Developer Guide**: Build a `docs/04-guides/offline-map-guide.md` explaining:
    - How to debug IndexedDB partitions via DevTools.
    - Adding new location types to the proactive caching list.
    - The `transformRequest` implementation patterns.
- **User Instructions**: Update the "Help" section in the app to explain that "Use Offline" only caches the current community visible on the map.
- **API Reference**: Document the new `OfflineStorageManager` interface.


### Phase 5: Strategic Alignment & Decision
- **Final Verdict**: **APPROVED FOR IMPLEMENTATION**.
- **Technical Path**: **Option 2 (IndexedDB + `transformRequest`)**.
- **Critical Success Factors**:
    - **Partitioning**: Must use `tenantId` as the primary key suffix for all stores.
    - **Feedback**: A "Caching..." progress indicator is necessary to manage user expectations during proactive sync.
    - **Lifecycle**: Cache must be invalidated if the `tenant_id` of the user changes or if the user explicitly clicks "Clear Map Data".
- **Risk Level**: **Low-Medium**. Primary risk is storage quota, managed by zoom level constraints (14-18).

🏁 [REVIEW WORKFLOW COMPLETE]






