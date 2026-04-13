---
title: Type safety issues in data layer (185+ any types)
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: tech-debt
author: @investigator/audit
---

# Type Safety Issues in Data Layer

## Finding
The data layer (`lib/data/*.ts`) has 185+ instances of `any` type usage, which bypasses TypeScript's type safety. This includes function return types, parameters, and internal variables.

## Files
- `lib/data/residents.ts`
- `lib/data/families.ts`
- `lib/data/events.ts`
- `lib/data/exchange.ts`
- `lib/data/locations.ts`

## Recommendation
Create TypeScript interfaces for all data layer functions:
- `Resident`, `ResidentWithRelations`
- `Family`, `FamilyWithMembers`
- `Event`, `EventWithRelations`
- `ExchangeListing`, `Transaction`
- `Location`, `Neighborhood`

Export from `lib/data/types.ts` and update all function signatures.

## Status
**Open** - Documented in audit_2026-04-11_app_module.md