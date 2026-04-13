---
title: Mobile Tab Alignment
description: CSS Grid wrapper fixes, structural parity, mobile overflow
categories: [css, mobile, ui]
sources: [log_2026-02-10_issue_69.md]
---

# Mobile Tab Alignment

## CSS Grid for Tabs

Use grid instead of flex for consistent column counts:

```typescript
// CSS Grid for exact 3-column layout
<div className="grid grid-cols-3">
  {tabs.map(tab => <Tab key={tab.id} {...tab} />)}
</div>
```

## Structure Parity Pattern

Search bar and tabs must share identical wrapper structure:

```typescript
// BAD: Different nesting breaks alignment
<div className="search-bar-wrapper">
  <SearchInput />
</div>
<div className="tabs-wrapper -mx-4 px-4 overflow-x-auto">
  <Tabs />
</div>

// GOOD: Matching structure
<div className="w-full max-w-md">
  <SearchInput />
</div>
<div className="w-full max-w-md">
  <Tabs />
</div>
```

## Mobile Wrapper Debugging

When CSS works on desktop but not mobile, check wrapper classes:

```typescript
// Common mobile-breakers
'-mx-4'      // Negative margin
'px-4'        // Padding conflicts
'overflow-x-auto' // Creates scroll context
'no-scrollbar' // Hides content
```

---

## Related

- [responsive-dialog](./responsive-dialog.md)