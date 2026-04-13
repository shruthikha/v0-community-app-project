source: requirement
imported_date: 2026-04-08
---
# Requirements: Neighbor Directory Tab Alignment

## Problem Statement
The "Residents", "Households", and "My Lists" tabs in the Neighbor Directory are currently wrapping tightly around their content on larger screens (`sm:w-auto`), causing them to appear narrower than other components like the search bar. This creates a visual misalignment.

## User Persona
Residents using the neighborhood directory to find neighbors, households, or manage their own lists.

## Context
The search bar in the Neighbor Directory is constrained to `max-w-md`. The tabs should match this width to provide a consistent visual flow.

## Documentation Gaps
- None identified; the current layout issue is a visual polish task.

## Dependencies
- `app/t/[slug]/dashboard/neighbours/neighbours-page-client.tsx`: Primary file for the Neighbors page layout.
- `components/ui/tabs.tsx`: Underlying UI component structure.

## Issue Context
- **GitHub Issue**: [Issue #69](https://github.com/mjcr88/v0-community-app-project/issues/69)
- Related to visual consistency across the dashboard.
- Matches the specific "max-w-md" constraint used by the search bar in the same view.

## Technical Options

### Option 1: Direct Constraint on TabsList
Apply `max-w-md` directly to the `TabsList` component in `neighbours-page-client.tsx`.
- **Pros**: Simple, localized change; preserves existing pill styling.
- **Cons**: Might require removing `sm:min-w-fit`.
- **Effort**: XS

### Option 2: Wrapping Container Mirroring (Recommended)
Wrap the `TabsList` in a `div` with `className="max-w-md"`, identical to the search bar's container.
- **Pros**: Guarantees pixel-perfect alignment.
- **Cons**: Adds a minor extra layer to the DOM.
- **Effort**: XS

### Option 3: Balanced Grid Distribution
Force the `TabsList` to `max-w-md` and use `grid-cols-3`.
- **Pros**: Highly symmetrical.
- **Cons**: Risk of labels being cut off in other languages.
- **Effort**: S

## Recommendation

**Recommendation**: **Option 2 (Wrapping Container Mirroring)**.
This is the most robust approach to ensure perfect visual parity with the search bar's boundaries.

### Metadata
- **Priority**: P1
- **Size**: XS
- **Horizon**: Q1 26

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue**: #69
- **Impact Map**: 
    - `app/t/[slug]/dashboard/neighbours/neighbours-page-client.tsx`
    - `components/ui/tabs.tsx`
- **Historical Context**:
    - Recent changes to `neighbours-page-client.tsx` (Jan 20) focused on Occupancy Indicators, Map Readability, and Directory renaming ("Households").
    - **Observation**: The code in `neighbours-page-client.tsx` (lines 315-316) appears to already have the `max-w-md` wrapper recommended in Option 2. This review will confirm if the implementation is correct or if it needs adjustment (e.g., adding `w-full` to the wrapper).

### Phase 1: Vibe & Security Audit
- **Vibe Check**: The `neighbours-page-client.tsx` component handles significant logic ("fat client").
- **Security Finding (CRITICAL)**: **Data Leakage in `page.tsx`**.
    - The server component (`neighbours/page.tsx`) fetches ALL resident fields (email, phone, etc.) and `user_privacy_settings`.
    - It passes this raw data to the Client Component `NeighboursPageClient`.
    - Privacy filtering happens in `ResidentCard` (Client-Side) using `filterPrivateData`.
    - **Impact**: A user can inspect the network execution (RSC payload) or React DevTools to see private emails/phones of neighbors who have not consented to share them.
    - **Recommendation**: Refactor `page.tsx` to filter fields SERVER-SIDE based on privacy settings before passing to the client. (Separate Issue).
- **Attack Surface**:
    - Low for the *Tabs* change itself.
    - High for the existing page structure (as noted above).

### Phase 2: Test Strategy
- **Manual Verification**:
    - **Layout**: Verify `TabsList` width aligns with `Search` input (`max-w-md`) on `sm`, `md`, and `lg` viewports.
    - **Content**: Ensure "Residents", "Households", "My Lists" labels are visible and not truncated.
- **Automated Tests**:
    - **E2E**: Verify correct class application (`max-w-md`) on the Tabs container.
    - **Sad Path**: Test with very long translations for tab labels.

### Phase 3: Performance Assessment
- **Schema/Query**:
    - The `residents` query extracts deep relations.
    - **Optimization**: Pagination is currently Client-Side (`slice(0, 10)`). This means we load 100% of residents to show 10.
    - **Assessment**: For 100s of users, this is okay. For 1000s, this will degrade initial load time.
    - **Tabs Impact**: Minimal. The `div` wrapper has 0 performance cost.

### Phase 4: Documentation Logic
- **Updates Required**: None for this specific UI fix.
- **Gap Log**: 
    - Logged PII Leak in `neighbour/page.tsx` to `docs/documentation_gaps.md`.
