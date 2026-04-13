source: requirement
imported_date: 2026-04-08
---
# Requirements: Product Tour Update

## Problem Statement
The current 10-step product tour is outdated. It does not reflect recent enhancements like "Documents", "Reservations", and "Marketplace" (Exchange) updates. Visual assets (images and avatars) also need to be refreshed to match the latest application state.

## User Persona
New residents joining the Ecovilla community who need an accurate and engaging introduction to the platform's capabilities.

## Context
The product tour is implemented as a set of React components (`BeamIntroCard`, `OrbitingNeighborsCard`, etc.) managed by a `TourCarousel` component.

## Proposed Changes

### [MODIFY] Slide 1: Welcome (`BeamIntroCard`)
*   **Icons**: Expand from 6 to 8 icons. 4 on each side.
    *   **Left Side**: Family profile, Map, Events, Reservations.
    *   **Right Side**: Marketplace, Resident directory, Requests, Announcements.
*   **Rotating Text**: Update `WordRotate` with: "Profiles", "Households", "Map", "Events", "Check-Ins", "Reservations", "Listings", "Requests", "Announcements", "Documents".

### [MODIFY] Slide 2: Theme (`ThemeToggleCard`)
*   **Alignment**: Update background icons to match the 8-icon layout of Slide 1 for consistency.
    *   **Left Side**: Directory, Map, Events, Reservations.
    *   **Right Side**: Marketplace, Check-ins, Messages, Announcements.
*   **Animation**: Ensure `AnimatedBeam` connects all new icons to the center.
*   **Dashboard Link**: Update the "Start Tour" button in `RioWelcomeCard` to point to the correct production route `/t/[slug]/onboarding/tour` instead of the temporary `/tour-test`.

### [MODIFY] Slide 3: Updates (`AnnouncementAlertCard`)
*   **Content**:
    *   Item 1: "Feb festival" (Announcement)
    *   Item 2: "Construction guidelines" (Document)
*   **Meta**: Both items MUST display "posted by Ecovilla board & administration".

### [MODIFY] Slide 4: Neighbors (`OrbitingNeighborsCard`)
*   **Layout**: Increase spacing between circles on desktop.
*   **Avatars**: Replace text abbreviations with unique images from `public/Sample Avatars`.

### [MODIFY] Slide 5: Map (`MapHighlighterCard`)
*   **Images**:
    *   Left Image: `/public/artifacts/map.png`
    *   Right Image: `/public/artifacts/location_detail.jpg`

### [MODIFY] Slide 6: Events (`EventMarqueeCard`)
*   **Image**: Replace central calendar mockup with `/public/artifacts/events.png`.
*   **Copy**: Update to mention both "events" and "reservations of facilities".

### [MODIFY] Slide 8: Exchange (`ExchangeListCard`)
*   **Copy**: Update the description to tell the broader exchange story:
    > "From free community listings to a broader exchange economy. Browse categories, seek specific items, and discover a growing directory of trusted local providers—all in one place."

### [MODIFY] Slide 9: Requests (`RequestWizardCard`)
*   **Left Image**: Replace Step 1 image with `/public/artifacts/request_step1.png`.

## Dependencies
*   Verified availability of all image assets in `/public/artifacts` and `/public/Sample Avatars`.
*   Relies on existing `TourCarousel` logic in `components/onboarding/tour-carousel.tsx`.

## Technical Options (Phase 2)

### Option 1: Direct Component Updates (Recommended)
Directly update the JSX/TSX in each specific card component (`BeamIntroCard`, `OrbitingNeighborsCard`, etc.) with the new content and images.

*   **Pros**: 
    *   Blazing fast implementation. 
    *   No new complexity or abstractions. 
    *   Zero risk of breaking existing carousel architecture.
*   **Cons**: 
    *   Content is tightly coupled with UI logic. 
    *   Future updates require searching through multiple files.
*   **Effort**: **Small (S)** - ~2-3 hours.

---

### Option 2: Config-Driven Content Refactor
Extract all strings, image paths, and icon lists into a central `tour-config.ts` file and pass them as props to the cards.

*   **Pros**: 
    *   Separates content from UI logic. 
    *   Great for future maintenance—all text is in one place. 
    *   Easier to review copy changes.
*   **Cons**: 
    *   Requires refactoring 8+ components to accept props. 
    *   Slightly higher risk of regression if prop types aren't perfectly aligned.
*   **Effort**: **Medium (M)** - ~1 day.

---

### Option 3: Dynamic CMS/Database Storage
Store the tour slides in a Supabase table and fetch them on mount.

*   **Pros**: 
    *   Allows non-technical admins to update the tour via the database or admin UI. 
    *   No redeploy needed for copy changes.
*   **Cons**: 
    *   Substantial effort compared to the "minimal" requirement. 
    *   Requires new schema changes and data fetching logic. 
    *   Potential flicker or loading states during tour start.
*   **Effort**: **Large (L)** - ~2-3 days.

## Recommendation (Phase 3)

We recommend **Option 1: Direct Component Updates**. 

While Option 2 offers better scalability, the "minimal effort" constraint and the unique, bespoke nature of each tour slide (using specialized library components like `AnimatedBeam`, `OrbitingCircles`, `WordRotate`, etc.) make direct JSX updates the most efficient path. This approach avoids the overhead of designing a complex prop-drilling or context-based configuration system for components that have very different internal structures.

### Metadata
*   **Priority**: P1
*   **Size**: S
*   **Horizon**: Q1 26


## 8. Technical Review

### Phase 0: Issue Details
*   **Issue**: #117 "[Brainstorm] Product Tour Update 2026"
*   **Summary**: Update 10-step tour with new icons, rotating text, and refreshed assets (Map, Events, Exchange, etc.).
*   **Recommendation**: Option 1 (Direct Component Updates).

### Phase 0: Impact Map
*   **Main Component**: `components/onboarding/tour-carousel.tsx`
*   **Card Components**:
    *   `components/onboarding/cards/beam-intro.tsx`
    *   `components/onboarding/cards/announcement-alert.tsx`
    *   `components/onboarding/cards/orbiting-neighbors.tsx`
    *   `components/onboarding/cards/map-highlighter.tsx`
    *   `components/onboarding/cards/event-marquee.tsx`
    *   `components/onboarding/cards/exchange-list.tsx`
    *   `components/onboarding/cards/request-wizard.tsx`

### Phase 0: Historical Context
*   **Recent Changes**: Recent updates to Map interactions (#106), RSVP sync (#95), and PII leak prevention (#97) suggest the tour update must ensure these new features are accurately represented. No direct regressions in the tour component were found in recent history.

### Phase 1: Security Audit
*   **Vibe Check**: The tour cards are purely presentational ("use client") and do not interact with the database or sensitive server-side logic. This aligns with a "secure-by-default" frontend posture.
*   **PII Risk Assessment**:
    *   **Identified Vector**: Screenshots in `MapHighlighterCard` and `ExchangeListCard` may contain resident names or lot details if taken from live environments.
    *   **Mitigation**: **MANDATORY**: Verify that all new assets in `/public/artifacts` are sanitized and contain only dummy/anonymized data before merging.
    *   **De-identification**: The move from user initials to `Sample Avatars` in `OrbitingNeighborsCard` is a positive step for privacy.
*   **Zero Policy Enforcement**: No RLS policies are affected by this change as no new tables or data fetching logic are introduced.

### Phase 2: Test Strategy
*   **Sad Paths**:
    - **Offline Resilience**: Verify all `Image` components have appropriate alt text and fallbacks for failed asset loads.
    - **Mobile Viewport (375px)**: The `BeamIntroCard` (8 icons) and `OrbitingNeighborsCard` (larger radius) must be tested for overflow on small screens.
    - **Navigation Truncation**: Verify that skipping the tour correctly triggers `TourAnalytics.productTourSkipped`.
*   **Automated Test Plan**:
    - **Unit (Vitest)**: New `tour-carousel.test.tsx` to verify state transitions and progress bar math.
    - **E2E (Playwright)**: New `e2e/product-tour.spec.ts` to walk through all 10 steps on mobile/desktop and verify the final redirect.
*   **Manual Verification**:
    - Use `/t/[slug]/tour-test` to audit the 2026 content updates.
    - Check "Feb festival" / "board & administration" attribution on Slide 3.
    - Verify 1:1 image aspect ratios and circular masking in `OrbitingNeighborsCard`.

### Phase 3: Performance Review
*   **Asset Load Analysis**: 
    - **Images**: 4-5 high-resolution screenshots are being added to the initial tour load. This could impact First Contentful Paint (FCP).
    - **Optimization**: Recommend using `.webp` format and `priority` flag in `next/image` for "above-the-fold" slides (Slide 1-3).
*   **Runtime Overhead**:
    - The `OrbitingCircles` (Slide 4) and `AnimatedBeam` (Slide 1) components are performant, but increasing the radius and child count in Slide 4 should be verified on under-powered mobile devices (e.g., iPhone 8 / Android equivalent).
*   **Database Impact**:
    - **Direct Impact**: Zero. No data fetching is performed by card components.
    - **Latent Impact**: Negligible. The single `UPDATE users SET onboarding_completed = true` call upon tour completion is the only DB interaction.

### Phase 4: Documentation Plan
*   **Analytics Audit**: Verified that `product_tour_*` events are already fully documented in `docs/02-technical/analytics/posthog-analytics.md` (Lines 47-61). No updates required for tracking specs.
*   **Manuals Update**: 
    - **Resident Guide**: `docs/01-manuals/resident-guide/intro.md` is currently missing.
    - **Action**: Create/Update the Resident Guide to include the 2026 feature set (Documents, Reservations, etc.) showcased in the new tour.
*   **Gap Logging**: Added the following to `docs/documentation_gaps.md`:
    - `Missing Resident Guide content for the refreshed 2026 Product Tour.`

### Phase 5: Strategic Decision
*   **Risk/Value Matrix**:
    - **Value**: **HIGH**. The product tour is the "first handshake" with new residents. Staleness in 2026 content is a major UX friction point.
    - **Risk**: **LOW**. Zero logic changes to the core `TourCarousel` component. Purely presentational/asset updates.
*   **Final Decision**: **PROCEED with Option 1**.
    - Avoid re-engineering the tour system at this stage (Option 3 "Headless" is rejected for now as it adds unnecessary complexity for a simple content refresh).
    - Ensure all assets in `/public/artifacts/` are verified for PII before commit.

🔁 [PHASE 5 COMPLETE] Requirement document enriched and finalized. Transitioning to Handoff...


## Release Notes
🚀 **Product Tour 2026**
Updated the onboarding tour to reflect the latest Ecovilla features.

🗺️ **Updated Visuals**
Fresh maps, updated facility icons, and new "Exchange" transaction previews.

👥 **Community Focus**
New slides highlighting "Announcements" and "Documents" from the administration.
