---
source: lessons_learned
imported_date: 2026-04-08
---

# Lesson: Zod Validation Order

## The Gotcha

Zod schema used `.min(1).transform(val => val.trim())` — trim applied after validation. Whitespace-only strings like `"   "` pass `.min(1)` (length 3) and only become `""` after transform.

## Pattern

```typescript
// ✅ CORRECT: Trim before validation
z.string().trim().min(1, 'Required')

// ❌ WRONG: Validate then trim
z.string().min(1).transform(val => val.trim())
```

## Related: Empty String vs Null

TypeScript allows `"" | null` but DB constraint may fail on empty string. Explicitly cast:

```typescript
// Server Action: scrub empty strings to null
const scrub = (val: string | null) => val === "" ? null : val;
```