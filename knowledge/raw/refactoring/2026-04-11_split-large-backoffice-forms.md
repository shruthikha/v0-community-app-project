# Refactoring Opportunity: Split large backoffice forms

**Date**: 2026-04-11
**Source**: Audit `audit_2026-04-11_backoffice_module.md` (Findings L1, L2)
**Severity**: Low (maintainability)

## Problem

Two backoffice form components are excessively large:

1. `edit-tenant-form.tsx` — 404 lines
   - Combines: tenant basic info, admin management, deletion, invite logic
2. `tenant-features-form.tsx` — 712 lines
   - Combines: feature toggles, location types, Rio AI settings, visibility scope, save logic

## Recommendation

### edit-tenant-form.tsx → Split into:
- `TenantBasicInfoForm` — name, slug, max neighborhoods, address
- `TenantAdminForm` — admin name/email, invite logic
- `TenantDeleteDialog` — deletion confirmation and execution

### tenant-features-form.tsx → Split into:
- `FeatureToggleSection` — generic feature toggle list
- `LocationTypeGrid` — map location type checkboxes
- `RioSettingsPanel` — AI assistant configuration
- `VisibilityScopeSelector` — resident directory scope radio group
- `FeatureSaveButton` — save logic with seeding

## Benefits
- Easier to test individual components
- Smaller files are easier to review
- Parallel development on different sections
- Better code reuse potential

## Risk
Low. Pure component extraction, no behavior change. Can be done incrementally.
