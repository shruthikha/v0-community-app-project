---
title: Replace `any` types with proper TypeScript interfaces
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: readability
author: investigator/audit
---

# Replace `any` types with proper TypeScript interfaces

## Finding
60+ instances of `any` type usage in lib/ directory, reducing type safety and making refactoring dangerous.

## Files
- `lib/data/resident-requests.ts`: 11 instances
- `lib/data/locations.ts`: 14 instances
- `lib/geojson-parser.ts`: 14 instances
- `lib/data/exchange.ts`: 6 instances
- `lib/coordinate-transformer.ts`: 4 instances
- `lib/data/check-ins.ts`: 4 instances
- `lib/data/events.ts`: 4 instances
- `lib/data/residents.ts`: 1 instance
- `lib/privacy-utils.ts`: 1 instance

## Examples
```typescript
// Current
return residents.map((resident: any) => { ... })

// Should be
return residents.map((resident: DbResident) => { ... })
```

## Recommendation
Add proper TypeScript types for all database entities. Supabase already generates these - use them.

## Status
**Open** - 60+ instances across 9+ files