source: requirement
imported_date: 2026-04-08
---
# Requirements: Neighbor Phase Filter

## Problem Statement
Residents cannot filter neighbors by their "Journey Phase" (Planning, Building, Arriving, Integrating). As the community grows, seeing who is in the same phase is valuable for connection. Additionally, adding more filter buttons to the current mobile interface causes overcrowding and layout issues.

## User Persona
- **New Resident**: Wants to find others who are also "Planning" or "Building" to share tips.
- **Established Resident**: Wants to welcome those "Arriving" or "Integrating".

## Context
- **Existing Feature**: Examples of filters exist for Neighborhood, Lot, Interests, and Skills.
- **Data Source**: The `journey_stage` field on the `users` table.
- **Issue #100**: This requirement expands on Issue #100, adding an additional filter and determining the standard UI pattern for multiple filters on mobile.

## Documentation Gaps
- None. `journey_stage` is well-defined in `journey-step.tsx`.

## Dependencies
- `app/t/[slug]/dashboard/neighbours/neighbours-page-client.tsx`: Main UI component.
- `app/t/[slug]/dashboard/neighbours/neighbours-table.tsx`: Table component (needs to handle the new filter).

## Technical Options

### Option 1: "More Filters" Button (Expandable Section)
replace the `Interests` and `Skills` buttons in the current grid with a single `More Filters` button.
- **Behavior**: Clicking `More Filters` sets `activeFilter` to `"more"`.
- **UI**: The collapsible panel renders three tabs or sections: "Interests", "Skills", and "Journey Phase".
- **Pros**: Matches existing `activeFilter` pattern (rendering a card below). Keeps "Neighborhood" and "Lot" prominent.
- **Cons**: Requires redesigning the collapsible content area to handle multiple sub-sections.
- **Effort**: Low (S)

### Option 2: "More Filters" Button (Dropdown Menu)
Replace `Interests` and `Skills` with a `More Filters` button that triggers a `DropdownMenu` or `Popover`.
- **Behavior**: Clicking opens a floating menu with nested options or checkboxes.
- **Pros**: Saves vertical space (doesn't push content down like the collapsible panel).
- **Cons**: Harder to use for multi-select (Interests/Skills are multi-select). `DropdownMenu` closes on click usually.
- **Effort**: Medium (M) - Handling multi-select inside dropdowns can be tricky.

## Recommendation
**Option 1** is recommended because it aligns with the user's specific request for "Grouping" and reusing the existing "Collapsible Panel" pattern which already handles `MultiSelect` components well. We can simple render the 3 selectors stacked within the card when "More" is active.

### Metadata
- **Priority**: P1
- **Size**: S
- **Horizon**: Q1 26

## GitHub Issue Content

**Title**: [Brainstorm] Add "Phase" Filter to Neighbor Directory

**Description**:

### Problem Statement
Residents cannot filter neighbors by their "Journey Phase" (Planning, Building, Arriving, Integrating). As the community grows, seeing who is in the same phase is valuable for connection. Additionally, adding more filter buttons to the current mobile interface causes overcrowding and layout issues.

### User Story
As a **New Resident**, I want to find others who are also "Planning" to share tips.
As an **Established Resident**, I want to welcome those "Arriving" or "Integrating".

### Proposed Solution
1. **New Filter**: Add "Journey Phase" filter using the `journey_stage` field.
2. **UI Update (Grouped)**: Replace `Interests` and `Skills` buttons with a single **"More Filters"** button in the grid.
    - Clicking "More Filters" opens a collapsible panel (or reused existing panel) containing:
        - Interests (Multi-select)
        - Skills (Multi-select)
        - Journey Phase (Select/pill list)

### Dependencies
- `app/t/[slug]/dashboard/neighbours/neighbours-page-client.tsx`
- Related to Issue #100.

### Recommendation
Proceed with **Option 1**: Reuse existing collapsible panel pattern but grouped under a "More" button to save space on mobile.

## Technical Review Phase Results

### Phase 5: Strategic Alignment & Decision
- **Final Decision**: Confirmed **Option 1 (Expandable Section)** as the primary UI pattern.
- **Rationale**: 
    - Better mobile ergonomics than a dropdown.
    - Seamlessly integrates with existing `activeFilter` state.
    - Consistency with the "Neighborhood" and "Lot" filter cards.
- **Strategic Alignment**: This grouping pattern will be the baseline for all future directory filters (e.g., Languages, Occupation).

## Release Notes

### Release Notes (Draft)
🚀 **[Neighbor Journey Phase Filter]**
You can now find neighbors based on their journey phase (Planning, Building, Arriving, Integrating).

📱 **[Directory Filtering]**
Consolidated Interests, Skills, and Journey Phase filters under a new single "More Filters" menu to keep the directory clean.

✨ **[Polish]**
Improved UI for selecting multiple criteria simultaneously.
