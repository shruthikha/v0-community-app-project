---
title: "Add Zod validation to request form"
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: security
author: orchestrator/audit
---

# Add Zod validation to request form

## Finding

`create-request-modal.tsx` uses manual validation instead of Zod schemas:

```typescript
// Current (manual, error-prone)
if (!formData.title.trim() || !formData.description.trim()) {
  toast({ title: "Error", description: "Title and description are required" })
  return
}
```

Compare to `ReservationForm.tsx` which uses proper Zod validation.

## Files
- `components/requests/create-request-modal.tsx`
- `components/exchange/create-exchange-listing-modal.tsx`

## Recommendation

Define Zod schemas matching the pattern in ReservationForm:

```typescript
const requestSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  category: z.enum(["maintenance", "security", "community", "other"]),
  priority: z.enum(["normal", "urgent", "emergency"]),
  location_id: z.string().uuid("Valid location required"),
})
```

## Status

**Open** - Requires Zod schema creation and form integration