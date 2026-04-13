source: requirement
imported_date: 2026-04-08
---
# Requirement: Admin UI Redesign (UX Parity Phase)

## Problem Statement
The current Admin interface (`/app/t/[slug]/admin/`) was built as an MVP and lags significantly behind the Resident App in terms of usability, aesthetic consistency, and logical flow. While the Resident App follows a nature-inspired design system (Forest/Sunrise palette) and is optimized for the community personas (Sofia, Marcus, Elena, Carmen), the Admin tools are currently utilitarian, table-heavy, and lack the premium feel of the main platform.

## User Persona
*   **Primary**: Community Admin (Marcus/Carmen) - Needs high efficiency for coordination and resource management, but also wants a professional, cohesive experience that matches the community's values.
*   **Secondary**: Team Lead / Moderator - Needs quick-scan capabilities and easy-to-use interfaces for managing events and requests.

## Context & Background
*   **Tech Stack**: Next.js App Router, Tailwind CSS, Shadcn/UI.
*   **Current State**: Primarily uses data tables (e.g., `AdminFacilitiesTable`, `AdminRequestsTable`) with minimal visual hierarchy or "Sunrise" moments.
*   **Goal**: Standardize the design system across both apps. Replicate high-impact flows from the Resident app to avoid rebuilding from scratch, while identifying and overhauling areas where the admin-specific logic requires a more tailored (but still cohesive) UI.

## Dependencies
*   **Design System**: `docs/03-design/design-system/nido_design_system.md` (Primary source for tokens/principles).
*   **Components**: Existing Resident App components in `app/t/[slug]/dashboard/`.
*   **Shared Logic**: Backend actions in `app/actions/` are shared, but some admin-only actions might need refinement.

## Issue Context (Gaps & Related)
*   **Gaps**: The Admin UI lacks specific persona-informed details. For example, "Carmen" (Resource Mgr) needs status clarity that should be as visually rich in the admin tool as it is in the resident view.
*   **Related Issues**: Many "Reply to Admin" or "Request Management" features are currently being built or refined, creating a perfect time to unify the UI.

## Technical Options

### Option 1: Component Unification (Incremental)
Replace the current standard Shadcn tables with the rich, persona-informed components used in the Resident App. Integrate "Forest" and "Sunrise" brand tokens deeply into the admin sidebar and header.
*   **Pros**: Low risk, reuses existing production components, immediate visual parity.
*   **Cons**: Does not fundamentally improve the "data-heavy" navigation; limited logical overhaul.
*   **Effort**: Medium (M)

### Option 2: Adaptive Dashboard & Resource Hub
Transform the Admin area into a "Bento-style" dashboard of widgets. Implement "Adaptive Lists" for resources (e.g., Facilities, Residents) that can toggle between dense Table-view (for Carmen's resource management) and high-level Card-view (for Sofia/Marcus).
*   **Pros**: Addresses both efficiency and clarity; feels like a premium extension of the Resident App.
*   **Cons**: Requires more complex UI state management for view toggling.
*   **Effort**: Large (L)

### Option 3: "Admin Overlay" (Contextual Management)
Integrate administrative controls directly into the Resident App views. Admins see "Edit" or "Manage" buttons directly on Resident Dashboards, eliminating the need for a separate `/admin` portal for most common tasks.
*   **Pros**: Perfect UX parity; eliminates context switching; feels modern and "context-aware".
*   **Cons**: High architectural complexity; risks cluttering the Resident UI; requires strict frontend and backend permission isolation.
*   **Effort**: XL (Project-level)

## Recommendation

### Selected Option: Option 2 (Adaptive Dashboard & Resource Hub)
We recommend **Option 2**. This approach achieves the highest impact by addressing both the visual parity with the Resident App and the functional needs of diverse admin personas (Marcus/Carmen). It allows us to keep the efficiency of dense data tables for complex management while introducing the warm, nature-inspired "Card" ecosystem for high-level scanning and daily tasks.

*   **Implementation Path**: 
    1.  Design a "Bento-style" layout for the `/admin/dashboard`.
    2.  Develop a `ResourceList` component that supports both "Table" and "Card" view modes.
    3.  Audit each existing admin page (Facilities, Requests, etc.) and migrate them to this new pattern.

### Classification
*   **Priority**: P1 (High)
*   **Size**: L (Large)
*   **Horizon**: Q2 26


## 8. Technical Review

### Phase 0: Context Gathering
- **Issue**: [Brainstorm] Admin UI Redesign (Project Item 151887210)
- **Impacted Files**:
    - `app/t/[slug]/admin/*`
    - `components/ecovilla/admin/*`
- **Historical Analysis**:
    - Admin sections have seen recent updates, primarily in `AdminEventsTable` and `AdminRequestsTable`.

    - No major regressions flagged in recent git history, but logic is "utilitarian" as noted.

### Phase 1: Vibe & Security Audit
- **Vibe Check**: Passed. "Backend-First" pattern observed in `neighborhoods.ts` (Server Actions) and `layout.tsx`.
- **Attack Surface**:
    - **Page Access**: Strictly protected by `app/t/[slug]/admin/layout.tsx`. Redirects users without `tenant_admin` role + correct `tenant_id`.
    - **Data Access**: Actions (`getNeighborhoods`, etc.) rely on RLS. Strict validation of `tenant_id` is passed from client but checked against session in RLS (assumed, explicit verification of RLS policies recommended).
- **Verification Needed**:

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Mobile Admin**: Verify complex tables function on small screens (key requirement of "Adaptive Lists").
    - **Role Revocation**: User downgraded from Admin during active session.
    - **Tenant Leaks**: Admin accessing `/t/[other-slug]/admin`.
- **Test Plan**:
    - **Unit**: Test `ResourceList` toggle logic (Card vs Table).
    - **Integration**: Mock `getResidents` with 1000+ users to test client handling (prior to pagination fix).
    - **E2E**:
        - `test('Admin Redirect')`: Resident -> `/admin` -> Redirects to Login.
        - `test('Dashboard Layout')`: Verify Bento grid response at <768px viewport.

### Phase 3: Performance Review
- **Bottlenecks**:
    - **Critical**: `getResidents` (app/actions/neighborhoods.ts) fetches ALL residents without pagination. ⚠️ **Must Fix**.
    - **Dashboard Loading**: Bento grid may cause waterfall if widgets aren't parallelized.
- **Recommendations**:
    - Implement cursor-based pagination for `getResidents`.
    - Use `Suspense` boundaries for each Dashboard widget.

### Phase 4: Documentation Logic
- **Updates Required**:
    - `docs/01-manuals/admin-guide/`: Major update for new Dashboard and Resource Hub flows.
    - `docs/02-technical/schema/policies/`: Document the RLS policies once verified.
- **Gaps**:

### Phase 5: Strategic Alignment & Decision
- **Decision**: **Prioritize** (Ready for Development).
- **Sizing**: **L** (Large). High effort due to performance refactor (`getResidents`) and UI overhaul.
- **Specification Status**: **Ready**.
    - **Action Item**: User to manually update GitHub Project Status to "Ready for Development" (Token 403 error).
    - **Critical Path**: Fix `getResidents` pagination BEFORE adding new UI load.

## 9. Final Specification (Consolidated)
**Technical Plan**:
1.  **Backend**: Refactor `getResidents` to support cursor-based pagination. Add `suspense` support to Dashboard widgets.
2.  **Frontend**: Implement `ResourceList` with toggle state (Zustand or URL param).
3.  **UI**: Build "Bento" layout using `shadcn/ui` components.
4.  **Security**: Verify RLS policies explicitly. Add `playwright` tests for role access.




