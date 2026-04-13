---
title: Add Zod validation to events server action
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: security
author: @investigator/audit
---

# Add Zod validation to events server action

## Finding
The `createEvent` function in `app/actions/events.ts` lacks Zod schema validation. Wiki pattern mandates all server actions use Zod for input validation.

## Files
- `app/actions/events.ts`

## Recommendation
Add Zod schema following the pattern in `app/actions/auth-actions.ts`:
```typescript
const createEventSchema = z.object({
  title: z.string().min(1),
  category_id: z.string().uuid(),
  // ... other fields
})
```

## Status
**Open** - Requires implementation per wiki pattern `server-actions.md`