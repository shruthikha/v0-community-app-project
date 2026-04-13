---
title: More Filters UI Pattern
description: Expandable filter panel for mobile, grouped filters
categories: [ui, mobile, filter]
sources: [requirements_2026-02-14_neighbor_phase_filter.md]
---

# More Filters UI Pattern

## Mobile Filter Organization

Replace multiple buttons with expandable "More Filters":

```typescript
// Clicking "More Filters" shows collapsible panel
const [activeFilter, setActiveFilter] = useState<string | null>(null);

// Panel renders stacked sub-filters
{activeFilter === 'more' && (
  <div className="collapsible-panel">
    <InterestsFilter />
    <SkillsFilter />
    <JourneyPhaseFilter />
  </div>
)}
```

## Benefits

- **Space saving**: Single button vs. multiple
- **Consistent pattern**: Reuses existing collapsible
- **Mobile-friendly**: Touch Targets preserved

---

## Related

- [mobile-ui](../patterns/mobile-ui.md)