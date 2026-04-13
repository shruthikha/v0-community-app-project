---
title: Excessive any Types in Data Layer
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: readability
author: orchestrator/audit
---

# Excessive any Types in Data Layer

## Finding
185+ occurrences of `any` type in `lib/data/*.ts` files. Core business logic lacks type safety, making refactoring risky and errors harder to catch.

## Files
- `lib/data/residents.ts` - `resident: any`
- `lib/data/families.ts` - `family: any`
- `lib/data/exchange.ts` - `coordinates?: any`, `listing: any`
- `lib/data/events.ts` - `event: any`
- `lib/data/check-ins.ts` - `checkIn: any`
- `lib/data/resident-requests.ts` - Multiple `any` casts
- `app/onboarding.ts` - `families: any[]`, `pets: any[]`

## Recommendation
1. Define explicit return types for all data layer functions
2. Create shared `types/data.ts` with query/mutation types
3. Replace all `any` with proper TypeScript interfaces
4. Add tests before refactoring to catch regressions

## Status
**Open** - High priority readability and safety issue