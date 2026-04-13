source: requirement
imported_date: 2026-04-08
---
# Requirements: Consolidate Map Views & Fix "View on Map"

## Problem Statement
The "View on map" button on the Location Details page currently redirects to `/dashboard/map`, which uses a legacy `ResidentMapClient` component. This component is "unsupported" (missing features like boundaries, filters) and does not support the `highlightLocation` functionality, leaving users lost on a default map view.

## Proposed Solution
### 1. Navigation Redirect
- **Change**: Update the "View on map" button in `LocationDetailsPage` (`app/t/[slug]/dashboard/locations/[id]/page.tsx`).
- **New Destination**: `/t/${slug}/dashboard/community-map?highlightLocationId=${location.id}`.
- **Rationale**: Directs users to the feature-rich `CommunityMapClient`.

### 2. Community Map Enhancement
- **Component**: `CommunityMapClient` (`app/t/[slug]/dashboard/community-map/community-map-client.tsx`).
- **Change**: pass the `highlightLocationId` prop to the inner `MapboxFullViewer`.
- **Validation**: `MapboxFullViewer` already supports this prop (verified in code and Storybook).

### 3. Cleanup & Debt Removal
- **Target 1**: Delete `/app/t/[slug]/dashboard/map/page.tsx` (Legacy Route).
- **Target 2**: Delete `/components/map/resident-map-client.tsx` (Legacy Component).
- **Verification**: Confirmed these are only used by the legacy route being deleted.

## Technical Details
- **Existing Capabilities**: `MapboxFullViewer` has a `highlightLocationId` prop that triggers a `flyTo` animation and selects the location.
- **Route Handling**: The `ResidentCommunityMapPage` already receives `searchParams`. We just need to ensure they are passed correctly to the client component.

## Cleanup
-   Delete `/app/t/[slug]/dashboard/map/page.tsx`
-   Delete `/components/map/resident-map-client.tsx` (if unused elsewhere)

## Dependencies
-   Existing `MapboxFullViewer` component.

## Risks
-   None identified. The `MapboxFullViewer` logic for highlighting already exists; we are just wiring it up.

## Technical Options

### Option 1: Direct Component Swap & Cleanup (Recommended)
Refactor the "View on map" button to point to `/t/${slug}/dashboard/community-map` and pass the `highlightLocationId` parameter. Update the `CommunityMapClient` to consume this parameter and pass it to `MapboxFullViewer`. Delete the legacy `ResidentMapClient` and the `/dashboard/map` page immediately.
- **Pros**: Cleanest codebase, reduces tech debt immediately, single source of truth for map logic.
- **Cons**: Slightly higher initial effort to verify `CommunityMapClient` wiring.
- **Effort**: Low (1-2 hours)

### Option 2: Server-Side Redirect
Modify `/dashboard/map` to perform a server-side redirect to `/t/${slug}/dashboard/community-map` while preserving query parameters.
- **Pros**: Preserves any external bookmarks to the old map URL.
- **Cons**: Keeps the directory structure for a simple redirect; less clean than removing it.
- **Effort**: Low (1 hour)

### Option 3: Client-Side Shim
Keep `ResidentMapPage` but replace `ResidentMapClient` with `CommunityMapClient`.
- **Pros**: Minimal file deletion.
- **Cons**: Confusing architecture (two pages rendering the same complex client).
- **Effort**: Low (1 hour)

## Recommendation

### Strategy: Option 1 (Direct Component Swap & Cleanup)
This approach aligns with our goal of reducing technical debt and maintaining a single source of truth for the map. The validation of `MapboxFullViewer` confirms that the necessary features are already present, making this a low-risk refactor.

### Metadata
- **Priority**: P2
- **Size**: S
- **Horizon**: Q1 26

### Phase 1: Vibe & Security Audit
- **Vibe Check**: Standard "Backend-First" pattern is followed. Data fetching in `CommunityMapClient` is passed down from server components.
- **Security Check**: REDUCE ATTACK SURFACE by removing legacy `/dashboard/map` endpoint. All location fetching is constrained by `tenant_id` and Supabase RLS.
- **Refinement**: Identified that `LocationInfoCard.tsx` has redundant client-side fetching logic that should be cleaned up during implementation to strictly follow "Backend-First" principles.

### Phase 2: Test & Quality Strategy
- **Verification Plan**:
  - **Redirection**: Verify "View on Map" button link construction.
  - **Highlighting**: Verify `CommunityMapClient` consumes `highlightLocationId` correct from `searchParams`.
  - **Cleanup**: Verify build success after deleting `ResidentMapClient`.
- **Automated Tests**: No existing E2E tests for map highlighting. Recommendation to add a Playwright smoke test for the redirection flow.

### Phase 3: Performance & Scale Assessment
- **Impact**: Removing `ResidentMapClient` significantly reduces the client-side bundle size as we eliminate a complex secondary map consumer.
- **Efficiency**: Consolidating to `CommunityMapClient` means we only need to optimize one map component for performance (e.g., marker clustering, lazy loading).

### Phase 4: Documentation & Knowledge Review
- **Updates**: None required for external docs. The refactor simplifies the system architecture documentation by removing the "Legacy Resident Map" reference.

### Phase 5: Strategic Alignment & Readiness
- **Alignment**: This refractor is a prerequisite for more advanced map features (e.g., custom icons, heatmaps) as it cleans up the redundant map rendering pathways.
- **Status**: 🚀 **[READY FOR DEVELOPMENT]**
