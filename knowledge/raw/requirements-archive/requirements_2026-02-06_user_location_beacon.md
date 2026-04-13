source: requirement
imported_date: 2026-04-08
---
# Requirements: User Location Beacon (Live Blue Dot)
- **Issue**: [#86](https://github.com/mjcr88/v0-community-app-project/issues/86)
- **Status**: Implemented — QA In Progress (2026-02-06)


## Problem Statement
Residents using the community map for wayfinding (e.g., walking paths) cannot see their current live position relative to map features. While they can center the map on their location, there is no persistent visual indicator ("blue dot") of their movement, making navigation difficult.

## User Persona
- **Resident**: Walking or navigating within the community, needing to know their exact position on the map in real-time.

## Context
- **Component**: `components/map/MapboxViewer.tsx`.
- **Tech Stack**: Mapbox GL JS via `react-map-gl`.
- **Current State**:
    - Users can see static "Check-in" markers (profile pictures).
    - No native "Blue Dot" or live tracking is currently implemented.
    - **Existing Geolocate Button**: A manual button exists (top-right controls) that calls `getCurrentPosition` once and flies to the location. It does NOT track the user or show a marker.
    - `GeolocateControl` is missing from the current viewer (we use a custom button).
- **Constraints**:
    - **Resident App Only**: This feature is not required for Admin maps.
    - **No Auto-Center (Out of Bounds)**: If a user is outside the community boundary, the map should NOT automatically pan/zoom to them on load. The "Center on specific location" behavior is sufficient for manual intervention.
    - **Mapbox Only**: Leaflet is deprecated; solution must work within the existing Mapbox architecture.

## Documentation Gaps
- `docs/03-design/design-system/map-visualization.md` describes visual hierarchy but lacks implementation details for geolocation.
- No "Mapbox Implementation Guide" exists for technical reference.

## Dependencies
- **Contextual**: [Issue #83](https://github.com/mjcr88/v0-community-app-project/issues/83) (Map Color Customization) - recent map work.

## Goals
1.  **Live Location Indicator**: Display a standard "Blue Dot" (with accuracy circle) showing the user's live position.
2.  **Permission Handling**: gracefully request and handle browser `geolocation` permissions.
3.  **Boundary-Aware**: Ensure the map does not forcefully drag the view away from the community if the user is physically distant (e.g., checking the map from the city).
4.  **Integration**: Seamlessly integrate into `MapboxViewer.tsx` without disrupting existing layers (lots, facilities, check-ins).
5.  **Resident-Only**: Ensure this is scoped or toggled correctly so it doesn't clutter Admin views if unnecessary (though "resident app" is the primary target).

---
🔁 [PHASE 1 COMPLETE] Handing off to Orchestrator...

## Phase 2: Ideation (Technical Options)

### Option 1: Native `GeolocateControl` (react-map-gl)
Use the standard `<GeolocateControl />` component provided by `react-map-gl`.
- **Pros**: Zero boilerplate. Built-in permission handling and "Blue Dot" styling (pulsing accuracy circle).
- **Cons**: `trackUserLocation={true}` often forces the map to center on the user, which violates the "No Auto-Center Out of Bounds" requirement. Disabling tracking disables the smooth "follow" updates.
- **Effort**: Low (< 1 hour).

### Option 2: Custom Geolocation Hook + Marker (Recommended)
Implement a `useGeolocation` hook that wraps `navigator.geolocation.watchPosition` and renders a custom `<Marker />` (or Mapbox Layer) for the user's location.
- **Pros**: Complete control over camera behavior (can update position without re-centering). Can easily implement business logic like "only show if inside boundary". Custom styling for the beacon (e.g., Nido brand colors).
- **Cons**: Requires implementing permission state handling (prompt, denied, unavailable) and error handling manually.
- **Effort**: Medium (2-4 hours).

### Option 3: Lazy-Load Geolocate via Ref
Render `<GeolocateControl />` but interact with the internal Mapbox `GeolocateControl` instance via `ref` to suppress camera movements while keeping the UI.
- **Pros**: Uses native UI/UX for the dot.
- **Cons**: Brittle; relies on accessing internal Mapbox control state which may change. Hard to test.
- **Effort**: Medium (Unknown complexity of overriding internal event listeners).

---
---
🔁 [PHASE 2 COMPLETE] Handing off to Product Owner...

## Phase 3: Recommendation

### Final Recommendation
We recommend **Option 2 (Custom Geolocation Hook + Marker)**. This approach offers the precise control required to meet the "No Auto-Center" constraint while allowing for branded styling (Nido Blue Dot) and future logic overlays (e.g., displaying "You are here" text).

### Implementation Strategy
1.  **Creation**: Build `useGeolocation.ts` hook:
    -   Wraps `navigator.geolocation.watchPosition`.
    -   Exposes `location` ({lat, lng, heading, accuracy}), `error` (permission denied/timeout), and `status` (loading, ready, disabled).
2.  **Integration**: Update `MapboxViewer.tsx`:
    -   Import `useGeolocation`.
    -   Render a `<Marker />` (or `Layer`) for the Blue Dot using the hook's returned coordinates.
    -   **Upgrade Existing Button**: Locate the existing Geolocate button (lines ~1286) and update `onClick` to trigger the "Follow Me" / "Fly To" behavior using the hook's state.
3.  **Boundary Logic**:
    -   Use `checkIfInsideBoundary` (existing function) to gray out or hide the dot if the user is 50km away (optional) or just let them see how far they are.
    -   *Correction*: Requirements say "don't load map there is a user is e.g. outside... center on current location button covers those scenarios". The goal is to NOT auto-center. This custom hook naturally supports that (markers don't move cameras unless told to).

### Metadata
-   **Priority**: P1
-   **Size**: S
-   **Horizon**: Q1 26

---

## 8. Technical Review

### Phase 0: Context & Impact
- **Impacted Files**: `components/map/MapboxViewer.tsx` (Logic & UI).
- **Dependencies**: Native `navigator.geolocation` API, `react-map-gl` Marker.
- **Historical Context**: `MapboxViewer.tsx` recently updated for sidebar and analytics. Stable. No recent refactors in the last month that would conflict.

### Phase 1: Security Audit
- **Vibe Check**: Client-side only feature. Adheres to privacy by design (requires user permission, local state, no default persistence).
- **Attack Surface**:
    - **Privacy**: Location data is sensitive. Implementation must **NOT** upload coordinates to the server unless part of an explicit "Check-In" action. This feature is for wayfinding only.
    - **Verification**: Browser permission prompt is the primary gatekeeper.
- **Mitigation**: None required beyond standard browser permission handling.

### Phase 2: Test Strategy
- **Manual Verification**:
    - Verify "Blue Dot" accuracy in Chrome/Safari/Firefox.
    - Verify "Permission Denied" handling (should not crash, show friendly toast: "Enable location to see your position").
    - Verify "Out of Bounds" behavior (map should not snap to user if they are 100km away).
- **Automated Tests (E2E)**:
    - Playwright: Use `context.grantPermissions(['geolocation'])` and `context.setGeolocation({ latitude: ..., longitude: ... })` to verify Marker appearance.

### Phase 3: Performance Review
- **Client Performance**: `watchPosition` events can remain active in the background if not cleaned up.
    - **Requirement**: Must use `useEffect` cleanup return to clear the watch ID.
    - **Rendering**: The Marker update should be efficient. `react-map-gl` handles this well, but ensure the parent component doesn't re-render map tiles unnecessarily.
- **Battery**: High accuracy tracking consumes battery. Ensure it is disabled when the map is unmounted.

### Phase 4: Documentation Plan
- **User Guides**: Update `docs/01-manuals/resident-guide/community-map.md` (if exists) or create a section explaining "How to find myself on the map".
- **Documentation Gaps**: Logged need for Mapbox Technical Guide.
