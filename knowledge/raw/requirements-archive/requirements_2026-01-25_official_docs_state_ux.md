source: requirement
imported_date: 2026-04-08
---
# Official Documents Status UX PRD

## Problem Statement
Users report confusion between "New", "Read", and "Archived" states in the Official Documents section. These statuses are used across multiple features, creating a tension between improving clarity for this specific use case and maintaining global consistency.

## User Persona
- **Resident/Member**: Needs to check official community documents (HOA rules, calendars, financial reports).
- **Admin**: Needs to know who has read documents.

## Context
- **Current States**: New, Read, Archived.
- **Issue**: Users don't intuitive grasp the workflow or distinction, leading to missed documents or clutter.
- **Constraint**: These states are shared across other system features. Changing them here might break mental models elsewhere or require sweeping changes.

## Dependencies
- Shared "Status" component or logic across the application (exact component to be identified in Phase 2).
- No specific blocking issues found in backlog.

## Issue Context (Documentation Gap)
- No existing documentation found for "Official Documents" feature architecture in `docs/`. This requirement file serves as the initial source of truth.

## Technical Options

### Option 1: Frontend Label Mapping (Contextual Aliasing)
- **Description**: Map existing backend statuses to more intuitive frontend labels specifically for the "Official Documents" section.
- **Mapping**:
  - `New` -> "Unread" or "Action Required"
  - `Read` -> "Acknowledged" or "Filed"
  - `Archived` -> "Hidden"
- **Pros**:
  - Improved UX clarity immediately.
  - No backend schema changes or migration.
  - Preserves global consistency in the database.
- **Cons**:
  - Frontend complexity (conditional labeling).
  - Potential confusion if user sees raw status in API or other views.
- **Effort**: Low (Frontend Only)

### Option 2: Enhanced User Education
- **Description**: Keep existing labels but add tooltips, empty states explanations, or a one-time onboarding tooltip explaining the workflow.
- **Pros**:
  - Zero risk of regression.
  - Lowest technical effort.
  - Maintains strict consistency.
- **Cons**:
  - Does not solve the root semantic mismatch.
  - Users often ignore educational tooltips.
- **Effort**: Very Low (Frontend Content)

### Option 3: Dedicated Status Enums (Backend Refactor)
- **Description**: Introduce specific status enums for Official Documents (e.g., `DOC_UNREAD`, `DOC_ACKNOWLEDGED`).
- **Pros**:
  - Perfect semantic fit.
  - Uncouples this feature from global limitations.
- **Cons**:
  - High effort: DB migration, API updates, Admin panel updates.
  - Increases system complexity with feature-specific enums.
- **Effort**: High (Full Stack + Migration)

## Recommendation

### Selected Approach: Option 1 (Frontend Label Mapping)
We recommend implementing **Frontend Label Mapping**. This delivers immediate value to the user by using intuitive terminology ("Unread", "Acknowledged") without incurring the technical debt and risk of a full backend refactor.

### Classifications
- **Priority**: P1 (High user impact, low technical risk)
- **Size**: S (Frontend-only components)
- **Horizon**: Q1 26
