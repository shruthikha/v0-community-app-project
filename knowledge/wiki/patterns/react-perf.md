---
source: nido_patterns
imported_date: 2026-04-08
---

# React Performance Patterns

## Lazy Load Heavy UI Libraries

The Mapbox Monolith: Always lazy load heavy UI libs.

```typescript
// ✅ CORRECT: Lazy load Mapbox
const MapboxViewer = dynamic(() => import('./MapboxViewer'), { 
  ssr: false, 
  loading: () => <Skeleton /> 
})

// ❌ WRONG: Direct import bundles 800KB+ into main chunk
import MapboxViewer from './MapboxViewer'
```

## Client Component Overuse

343 files using `"use client"` indicates building SPA inside App Router.

Rule: Move `"use client"` down to the leaves (buttons, inputs). Do not wrap entire pages or layouts.

## In-Render Array Mutation

`.sort()` mutates the source array. This corrupts cached state.

```typescript
// ✅ CORRECT: Copy before sort
[...arr].sort((a, b) => a.localeCompare(b))

// ❌ WRONG: Mutates source
arr.sort((a, b) => a.localeCompare(b))
```

## Use Memo for Array Operations

Wrap sorting in `useMemo` for stability:

```typescript
const sortedItems = useMemo(
  () => [...items].sort((a, b) => a.localeCompare(b)),
  [items]
);
```