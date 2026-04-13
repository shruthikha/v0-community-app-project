source: requirement
imported_date: 2026-04-08
---
# Requirements: Fix FamilyMemberCard Mobile Overflow (Issue #140)

## Problem Statement
On the Resident Profile page, the `FamilyMemberCard` component displays family member information. On narrow mobile screens, certain content (like long names or additional badges/relationships) can exceed the card's horizontal boundaries, breaking the layout.

## User Persona
- **Residents**: Viewing neighbor profiles and their family members on mobile devices.

## Context
- **Affected Component**: `FamilyMemberCard.tsx` ([/Users/mj/Developer/v0-community-app-project/components/directory/FamilyMemberCard.tsx](file:///Users/mj/Developer/v0-community-app-project/components/directory/FamilyMemberCard.tsx))
- **Primary Page**: Resident Profile Page ([/Users/mj/Developer/v0-community-app-project/app/t/[slug]/dashboard/neighbours/[id]/page.tsx](file:///Users/mj/Developer/v0-community-app-project/app/t/[slug]/dashboard/neighbours/[id]/page.tsx))

## Dependencies
- None identified.

## Goals
1. Ensure the `FamilyMemberCard` content stays within its borders on all screen sizes.
2. Maintain readability of family member names and roles.
3. Ensure the fix for `FamilyMemberCard` does not negatively impact other locations using similar patterns (e.g., `FamilyManagementForm.tsx`).

## Technical Options

### Option 1: CSS Text Overflow Handling (Truncation)
Use `truncate` or `line-clamp` utilities on text elements (Name, Email, Relationship) to ensure they don't force the container to expand or overflow.
- **Pros**: Quickest fix, guaranteed to stay within bounds.
- **Cons**: Longer names might be partially hidden; requires tooltips if full info is needed.
- **Effort**: XS (Minutes)

### Option 2: Flexible Layout with Wrapped Content
Adjust the layout from `flex items-center` to `flex flex-col` or `flex-wrap` on mobile using responsive breakpoints (e.g., `sm:flex-row`).
- **Pros**: Shows all information without hiding text.
- **Cons**: Might increase vertical card height significantly on small devices.
- **Effort**: S (1-2 hours including testing)

### Option 3: Grid-based Constraints
Switch the internal layout to `grid-cols-[auto_1fr_auto]` with `min-width-0` on the central content area to force proper shrinking in flex/grid contexts.
- **Pros**: Most robust layout fix for flex/grid overflow issues.
- **Cons**: Slightly more complex CSS adjustment.
- **Effort**: S (1 hour)

## Recommendation
**Option 1 (CSS Text Overflow Handling)** is recommended as the primary fix, combined with **Option 3 (Grid-based Constraints)** for the name container. This provides a robust, "bulletproof" layout that handles extremely long strings without breaking the card's visual integrity. 

**Implementation Details**:
- Add `min-width-0` to the flex-1 container holding the name.
- Apply `truncate` to the name `h4` and the relationship `p` tag.
- Check `FamilyManagementForm.tsx` to ensure these classes are applied there as well for consistency.

### Mandatory Metadata
- **Priority**: P1 (UX Bug)
- **Size**: S
- **Horizon**: Q1 26


## 8. Technical Review

### Phase 0: Issue Details
- **Issue**: #140 [Brainstorm] Family UI issue (Overflow on Mobile)
- **Problem**: `FamilyMemberCard` overflows on mobile due to long names/content.
- **Goal**: Apply CSS truncation and layout constraints (`min-width-0`, `truncate`).

### Phase 0: Impact Map
- **Core Component**: `components/directory/FamilyMemberCard.tsx`
- **Secondary Component**: `components/directory/FamilyManagementForm.tsx` (to be verified)
- **Pages Affected**:
    - `app/t/[slug]/dashboard/neighbours/[id]/page.tsx`
    - `app/t/[slug]/dashboard/families/[id]/page.tsx`
- **Testing**: `components/library/family-member-card.stories.tsx`

### Phase 0: Historical Context
- **Recent Changes**: Files were recently updated in commit `acfcacf` (Journey Phase filter) and `324f746` (Docs standardization). No recent regressions noted in these areas, but mobile UI density is increasing.
- **Regression Risk**: Low, as this is primarily a CSS layout hardening task.

🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...

### Phase 1: Vibe & Security Audit
- **Vibe Check (Backend-First)**: The component strictly handles display. Data fetching is handled by parent Server Components. No client-side database access detected.
- **Security (PII & RLS)**:
    - The `member` object contains PII (Name, Email, Profile Picture).
    - **Audit**: Verified that `FamilyMemberCard` respect's `member.show_neighborhood` and `member.show_profile_picture` privacy flags (Lines 33, 46).
    - **RLS**: Data is fetched via `currentResident` or family queries which are subject to RLS policy.
- **Attack Surface**: 
    - **XSS**: standard React interpolation used for names. No `dangerouslySetInnerHTML`.
    - **Layout Injection**: Extremely long names or relationships are the primary "attack" vector on layout integrity. Truncation is the correct mitigation.
- **Hidden Vectors**: Checked `FamilyManagementForm.tsx`. It uses a similar card pattern. Truncation should also be applied there to prevent the same overflow when managing family members.

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Extremely Long Name**: "Christopher-Alexander Montgomery-Westershire IV"
    - **Long Relationship**: "Great-Great-Grandfather / Legal Guardian"
    - **Badge Contention**: Long name + "Primary Contact" badge on 320px width.
- **Test Plan**:
    - **Unit/Component**: Create a new Storybook scenario `Overflow` in `family-member-card.stories.tsx` to visualize the truncation.
    - **Manual Verification**:
        - Open Storybook, navigate to `Molecules/Directory/FamilyMemberCard` -> `Overflow`.
        - Toggle "Viewport" to "Mobile" (iPhone SE/5).
        - Verify text ellipses (...) appear and the card does not expand horizontally.
    - **Cross-Component**: Verify `FamilyManagementForm.tsx` (settings page) handles the same edge cases.

### Phase 3: Performance Assessment
- **Query Impact**: 
    - `nido.prod` currently has 13 `family_units` and 30 `users`. 
    - Queries for family members are well-indexed via `idx_users_family_unit_id` and `idx_users_lot_id`.
    - No significant N+1 risks identified at current scale.
- **Rendering**: 
    - The proposed CSS fix (`min-width-0`, `truncate`) is lightweight and prevents layout shift/overflow on narrow viewports.

🔁 [PHASE 3 COMPLETE] Handing off to Solutions Architect...

### Phase 4: Proposed Solution
- **Core Fix**: Apply `min-width-0` to flex/grid parents and `truncate` to text elements in `FamilyMemberCard.tsx`.
- **Consistency**: Mirror these changes in `family-management-form.tsx` to ensure uniform behavior across the directory and settings pages.

