---
title: Design Token System
description: CSS custom properties, tailwind config sync, component constraints
categories: [design, tailwind, css]
sources: [log_2026-03-12_lot_search_admin_rejection.md, log_2026-03-12_family_ui_overflow.md]
---

# Design Token System

## CSS Custom Properties

Define in `globals.css`:

```css
:root {
  --clay-red: #C25B4F;
  --font-family: 'Inter', sans-serif;
}
```

## Tailwind Config Sync

Reference in `tailwind.config.ts`:

```typescript
const config = {
  theme: {
    extend: {
      colors: {
        'clay-red': 'var(--clay-red)',
      }
    }
  }
};
```

⚠️ Both files must stay in sync or tokens won't render.

## Shared Component Constraints

Components should separate `value` from `searchable label`:

```typescript
// BAD: UUID as searchable value
<Combobox value={id} />

// GOOD: Separate label for search
<Combobox 
  value={id} 
  label={label}  // For search matching
  search={searchableText}
/>
```

## Text Truncation

Use Tailwind utilities for consistent truncation:

```typescript
// Line clamp
<div className="line-clamp-2">Long text...</div>

// Flex container requires min-width-0
<div className="flex min-w-0">
  <span className="truncate">Long text...</span>
</div>
```

---

## Related

- [mobile-ui](../patterns/mobile-ui.md)