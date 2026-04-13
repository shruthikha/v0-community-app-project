---
title: Zod Validation for Actions and Routes
---

# Zod Validation for Actions and Routes

Use Zod schemas for user input validation in server actions and API routes instead of manual condition checks.

## Why it matters

Manual validation tends to drift across forms, server actions, and route handlers. Zod keeps the schema close to the boundary and gives consistent error handling.

## Pattern

- Define a schema near the action or route.
- Parse input before any database write or external call.
- Return or throw structured validation errors.

## Example

```ts
const requestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
})

const parsed = requestSchema.safeParse(input)
if (!parsed.success) {
  return { success: false, error: 'Invalid input' }
}
```

## Related cases

- `app/actions/events.ts`
- `app/actions/profile.ts`
- request and exchange modal forms

## Notes

Prefer Zod for all new validation paths, especially when the same business rule appears in both the client form and server mutation.