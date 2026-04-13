source: requirement
imported_date: 2026-04-08
---
# [Brainstorm] Issue 199: Feature flag gate (rio.enabled + rio.rag both required for chat)

## Problem Statement
Río functionality must not be exposed to communities that haven't purchased or enabled the module. 

## User Persona
- **Residents**: Must not see broken UI or inaccessible actions if their tenant's flag is off.
- **Admin**: Expects features to remain securely hidden unless turned on.

## Context
Ensure all Río entry points are gated by `rio.enabled` and `rio.rag`. This affects the `RioWelcomeCard`, `CreatePopover`, and any proxy API endpoints. If flags fail to fetch, the app must default to 'fail-closed' (hide components).

## Dependencies
- Epic #161: Río AI — Sprint 3: Chat Interface
- Admin Module Configuration (completed in Sprint 10 to establish these flags).

## Technical Options
### Option A: Server-Side Rendering (SSR) Guards
- **Pros**: Prevents any UI from even reaching the client if disabled. Utterly secure.
- **Cons**: Cannot react instantly if flags change (requires refresh).
- **Effort**: Low
### Option B: Client-Side Feature Context
- **Pros**: Interactive, hides/shows instantly.
- **Cons**: Code bundles still sent to client.
- **Effort**: Low
### Option C: Edge Middleware
- **Pros**: Drops traffic before hitting Next.js server.
- **Cons**: Overkill for UI feature toggles; overkill for BFF if standard route handlers work.
- **Effort**: High

## Recommendation
**Option A + B Hybrid**. Fetch `tenant.features` in the root layout (SSR), pass it to a Client Context to dynamically hide the `RioWelcomeCard` and `CreatePopover` triggers, and strictly validate the flags in the `/api/v1/ai/chat` route handler.
- **Priority**: P0
- **Size**: S
- **Horizon**: Q2 26

---

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue Details**: Implement "Fail-Closed" gating for all Río entry points.
- **Impact Map**:
    - `RioWelcomeCard.tsx`, `CreatePopover.tsx`: Conditional rendering.
    - `app/api/v1/ai/chat/route.ts`: Strict policy check.
- **Historical Context**: Tenant configuration was established in Sprint 10.
- **Handoff**: 🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...

### Phase 1: Vibe & Security Audit
- **Vibe Check**: If disabled, Río should leave no footprint. No "Coming Soon" unless explicitly requested by PM.
- **Security**: The BFF must be the source of truth. Client-side hiding is only for aesthetic hygiene.
- **Defaulting**: If `features` is null or missing the `rio` key, default to `enabled: false`.
- **Handoff**: 🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Missing Flag**: Test that a tenant without a `rio` block in their JSONB defaults to disabled.
    - **False Flag**: Verify `CreatePopover` does not render the Río action.
- **Test Plan**:
    - **Integration Test**: `tenant-feature-gate.test.ts`.
    - **E2E Test**: `e2e/rio-access-control.spec.ts`. Log in as a resident of a "Rio-Disabled" tenant and verify the dashboard is clean.
- **Handoff**: 🔁 [PHASE 2 COMPLETE] Handing off to Performance Optimizer...

### Phase 3: Performance Assessment
- **Analysis**: Prefetching tenant features in the root layout or dashboard page ensures zero layout shift for the gate.
- **Handoff**: 🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...

### Phase 4: Documentation Plan
- **Admin Setup**: Ensure the internal wiki for "Tenant Onboarding" includes the steps to enable `rio.enabled` and `rio.rag`.
- **Gap Logging**: Logged missing documentation for the `Option A + B Hybrid` state management pattern in `docs/documentation_gaps.md`.
- **Handoff**: 🔁 [PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...

### Phase 5: Strategic Alignment & Decision
- **Context**: Issue #199 provides the critical "Kill Switch" for the Río feature. It must be implemented before any resident-facing release to ensure we don't leak unpurchased features.
- **Sizing**: **S**. Focus is on reliable flag propagation from server to client components and strict BFF validation.
- **Decision**: **Prioritize**. Ready for development for Sprint 11.
- **Issue Link**: [Issue #199](https://github.com/mjcr88/v0-community-app-project/issues/199)

✅ [REVIEW COMPLETE] Issue #199 is now **Ready for development**.
