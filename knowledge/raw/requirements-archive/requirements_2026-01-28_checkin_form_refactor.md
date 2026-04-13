source: requirement
imported_date: 2026-04-08
---
# Requirements: Check-in Form Refactor

## Problem Statement
The current Check-in form is a long scrollable modal which is not mobile-friendly and inconsistent with the newer "step-based" creation flows (like Exchange Listings). This improved UX is needed to increase check-in engagement.

## User Persona
Residents creating check-ins on mobile or desktop.

## User Stories
- As a resident, I want to create a check-in in bite-sized steps so the process feels less overwhelming.
- As a resident, I want to easily toggle between "Community" and "Custom" locations without losing context.
- As a resident, I want a visual progress indicator so I know how many steps are left.

## Technical Context
- **Refactor Only**: No new fields or data requirements.
- **Reference**: `components/exchange/create-exchange-listing-modal.tsx`
- **Target**: `components/check-ins/create-check-in-modal.tsx`
- **UX Flow**:
    1. **What**: Activity, Title, Description
    2. **When**: Start Time, Duration
    3. **Where**: Location Selection (Community vs Custom)
    4. **Who**: Visibility (Community, Neighborhood, Private)
    5. **Review**: Final summary before submit.
- **Visuals**: Match the numbered progress bar style from Listings.

## Dependencies
- **Related Issue**: `[Brainstorm] User Tagging (@mentions)` (#65) - Affects the `description` field.
- **Related Issue**: `[Brainstorm] Check-in Comments` (Item #152761378) - Future integration point. Form should anticipate "Allow Comments" toggle.
- **Related Artifact**: `docs/07-product/02_requirements/requirements_2026-01-28_checkin_comments.md`

## Documentation Gaps
- **Form Patterns**: We lack a standard "Form Pattern" documentation in `docs/07-product/06_patterns/`. Currently relying on copy-pasting `create-exchange-listing-modal.tsx`.

## Technical Options

### Option 1: Componentized Steps (Recommended)
Mirror the directory structure of Exchange Listings. Create a subdirectory `components/check-ins/create_check_in_steps/` and break the form into individual functional components.
- `step-1-what.tsx`
- `step-2-when.tsx`
- ...

| Pros | Cons | Effort |
|------|------|--------|
| **Consistency**: Matches existing `exchange/create-listing-steps` pattern perfectly. | **Boilerplate**: Requires creating 5+ new files. | Medium |
| **Maintainability**: Separates logic for Location vs Visibility. | | |
| **Testing**: More testable units. | | |

### Option 2: Single File with Conditional Rendering
Keep the logic in `create-check-in-modal.tsx` but replace the single scroll view with `currentStep` state and conditional rendering of form sections.

| Pros | Cons | Effort |
|------|------|--------|
| **Speed**: Fastest implementation. | **Technical Debt**: File remains large (500+ lines). | Low |
| **Simple State**: No prop drilling. | **Rigidity**: Harder to refactor later. | |

### Option 3: React Hook Form + Zod Refactor
Rewrite the form state management to use `react-hook-form` and `zod` validation.

| Pros | Cons | Effort |
|------|------|--------|
| **Robustness**: Superior validation and performance. | **Inconsistency**: Listings use manual state. | High |
| **Clean Code**: Declarative. | **Scope Creep**: Architecture change. | |

## Recommendation
**Option 1: Componentized Steps.**
This approach creates the "Step-based" UX the user explicitly requested while maintaining strict architectural consistency with the existing `create-exchange-listing-modal` implementation. It provides a clean foundation for future Check-in features (like User Tagging) by isolating step logic.

### Classification
- **Priority**: P2 (Enhancement)
- **Size**: S
- Horizon: Q1 26

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue**: [Issue #80](https://github.com/mjcr88/v0-community-app-project/issues/80)
- **Impacted Files**:
    - `components/check-ins/create-check-in-modal.tsx` (Target for refactor)
    - `app/actions/check-ins.ts` (Server Action)
- **Historical Context**:
    - Recent activity (Jan 16, 2026): Added analytics tracking (CheckInAnalytics).
    - Previous fixes (Nov 2025): Resolved "marker" vs "pin" type mismatch in custom locations.
    - **Insight**: The refactor must preserve the "marker" type handling and the new analytics tracking.

### Phase 1: Security Audit
- **Authentication**: Uses `createServerClient` (Secure).
- **Authorization**:
    - `createCheckIn`: Enforces `tenant_id`. Input validation present but manual (no Zod).
    - `update/delete`: Enforces ownership.
    - **Risk**: `lib/data/getCheckIns` relies on JS filtering for visibility. Ensure RLS policies in `db/policies/check_ins.md` match this.
- **Input Validation**: Missing Zod. New implementation **must use Zod**.

### Phase 2: Test Plan
- **Unit**: Verify `Step` components (Title, Time, Location).
- **Integration**: Verify `createCheckIn` rejects invalid location data.
- **Manual**: Test "Custom Location" marker drop flow on mobile.

### Phase 3: Performance Assessment
- **Schema**: Indexed by `tenant_id`, `status`.
- **Query**: `getCheckIns` efficiently batches RSVPs.
- **Caution**: Watch `getActiveCheckIns` result size as usage grows.

### Phase 4: Documentation Plan
- **Update**: `docs/01-manuals/resident-guide/` (New screenshot of Check-in flow).
- **Create**: `docs/07-product/06_patterns/form-pattern.md` (Gap identified).

