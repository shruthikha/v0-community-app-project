---
source: nido_patterns
imported_date: 2026-04-08
---

# cmdk Dropdown Patterns

## Value Decoupling & Ranking

Decouple value (ID) from label (UI) and search (searchable string):

```typescript
// ✅ CORRECT: Decoupled
const options = [
  { value: 'uuid-1', label: 'D 401', search: 'd-401-d-4' },
  { value: 'uuid-2', label: 'None', search: 'zz-none-zz' }, // Low priority
];

// ❌ WRONG: UUID as value
const options = [
  { value: 'uuid-1', label: 'D 401' }, // Can't search by name!
];
```

## Selection Sticky Focus

Prevent low-priority options from jumping to bottom:

```typescript
// ✅ CORRECT: Non-matching search value
{ 
  value: 'none', 
  label: 'None', 
  search: 'zz-none-zz'  // Won't match 'd' search, focus resets to top
}

// ❌ WRONG: Matchable search value
{ value: 'none', label: 'None', search: 'none' };
```

## Ranking Tip

Place most likely match at start of search string:

```typescript
// ✅ CORRECT: Primary match first
{ search: 'd-401-d-4-d-401' }

// Typing 'd' matches index 0 = high ranking
```

## Inline Creation in Dropdowns

Prevent onBlur from closing dropdown before click:

```typescript
// ✅ CORRECT: Prevent blur
<ListBoxItem 
  onMouseDown={(e) => e.preventDefault()}
  onClick={handleCreateNew}
>
  Create New
</ListBoxItem>
```