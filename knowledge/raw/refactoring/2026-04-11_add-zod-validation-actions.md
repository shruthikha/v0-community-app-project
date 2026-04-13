---
title: Add Zod validation to check-ins and exchange-listings actions
status: open
created: 2026-04-11
updated: 2026-04-11
effort: medium
category: security
module: app/actions/check-ins.ts, app/actions/exchange-listings.ts
---

# Add Zod validation to check-ins and exchange-listings actions

## Finding
`events.ts` imports and uses Zod for input validation, but `check-ins.ts` (1,039 lines) and `exchange-listings.ts` (1,690 lines) have no Zod schemas. They rely on manual if-checks for required fields, which is error-prone and inconsistent with the established pattern.

## Files
- `app/actions/check-ins.ts`
- `app/actions/exchange-listings.ts`

## Suggested fix
Create Zod schemas for create/update inputs in each file. Follow the pattern established in `events.ts`:
```typescript
const createCheckInSchema = z.object({
  title: z.string().min(1),
  activity_type: z.string(),
  description: z.string().nullable(),
  location_type: z.enum(["community_location", "custom_temporary"]),
  // ...
})
```
Validate inputs at the start of each action before any database operations.
