---
source: lessons_learned + backend_audit
imported_date: 2026-04-08
---

# Server Action Patterns

## Zod Mandate (CRITICAL)

All Server Actions must use Zod schemas for input validation:

```typescript
// ✅ CORRECT: Zod schema
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  lotId: z.string().uuid(),
});

export async function createResident(formData: FormData) {
  const data = schema.parse(Object.fromEntries(formData));
  // Safe to use
}

// ❌ WRONG: Manual validation
if (!data.title) {
  throw new Error('Title required');
}
```

## Input Types for Legacy Schema

Some legacy columns store numbers as text. Server Action types should be loose:

```typescript
// ✅ CORRECT: Accept both, cast before DB
const schema = z.object({
  name: z.string().min(1),
  lotId: z.string().uuid(),
  pathLength: z.union([z.string(), z.number()]).transform(val => 
    String(val)
  ),
});

export async function createLocation(formData: FormData) {
  const data = schema.parse(Object.fromEntries(formData));
  // pathLength now guaranteed string
}

// ❌ WRONG: Strict type
const pathLength: number;
```

## Cache Invalidation for Live Dashboards

For "Live" dashboards, explicitly force dynamic:

```typescript
// ✅ CORRECT: Force dynamic
export const dynamic = 'force-dynamic';

export async function updateData(formData: FormData) {
  await updateInDb(formData);
  revalidatePath('/admin/dashboard');
}

// ❌ WRONG: Cached response
export async function updateData(formData: FormData) {
  await updateInDb(formData);
  // Returns cached data!
}
```

## Empty String to Null

Handle constrained DB fields with optional selections:

```typescript
// Scrub empty strings to null
const scrub = (val: string | null) => val === '' ? null : val;
```

## Audit Findings (2026-04-11)

### Zod Validation Coverage

**21 of 24 server action files lack Zod validation.** Only these have it:
- `auth-actions.ts` — fully validated
- `documents.ts` — fully validated
- `events.ts` — partial (createEvent has no Zod schema)

**Missing Zod entirely:**
- `profile.ts` — updateProfileAction
- `check-ins.ts` — 1,039 lines, no validation
- `exchange-listings.ts` — 1,690 lines, no validation
- All backoffice forms — HTML attributes only

### Non-Atomic Operations

```typescript
// ❌ NON-ATOMIC — delete then insert (profile.ts interests/skills)
await supabase.from("user_interests").delete().eq("user_id", userId)
await supabase.from("user_interests").insert(newInterests)
// ← Another request can read between delete and insert

// ✅ ATOMIC — use RPC or transaction
await supabase.rpc("replace_user_interests", { p_user_id: userId, p_interest_ids: newIds })
```

### Missing Error Handling

**10 server action files have no try/catch.** Unhandled exceptions return raw errors to clients.

### Missing Auth Checks

6 server action files have no authentication at all:
- `interests.ts`
- `tenant-features.ts`
- `event-categories.ts`
- `exchange-history.ts`
- `neighborhoods.ts`
- `neighbor-lists.ts`

## Related

- `patterns/zod-validation.md` — Zod validation patterns
- `lessons/idor-prevention.md` — IDOR prevention
- `patterns/standardized-error-handling.md` — Error handling standardization

## Audit Findings (2026-04-11)

### Zod Validation Coverage

**21 of 24 server action files lack Zod validation.** Only these have it:
- `auth-actions.ts` — fully validated
- `documents.ts` — fully validated
- `events.ts` — partial (createEvent has no Zod schema)

**Missing Zod entirely:**
- `profile.ts` — updateProfileAction
- `check-ins.ts` — 1,039 lines, no validation
- `exchange-listings.ts` — 1,690 lines, no validation
- All backoffice forms — HTML attributes only

### Non-Atomic Operations

```typescript
// ❌ NON-ATOMIC — delete then insert (profile.ts interests/skills)
await supabase.from("user_interests").delete().eq("user_id", userId)
await supabase.from("user_interests").insert(newInterests)
// ← Another request can read between delete and insert

// ✅ ATOMIC — use RPC or transaction
await supabase.rpc("replace_user_interests", { p_user_id: userId, p_interest_ids: newIds })
```

### Missing Error Handling

**10 server action files have no try/catch.** Unhandled exceptions return raw errors to clients.

### Missing Auth Checks

6 server action files have no authentication at all:
- `interests.ts`
- `tenant-features.ts`
- `event-categories.ts`
- `exchange-history.ts`
- `neighborhoods.ts`
- `neighbor-lists.ts`

## Related

- `patterns/zod-validation.md` — Zod validation patterns
- `lessons/idor-prevention.md` — IDOR prevention
- `patterns/standardized-error-handling.md` — Error handling standardization