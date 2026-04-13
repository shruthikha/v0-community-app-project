# TOCTOU Race Conditions in Exchange Transactions

> Read-then-update patterns create race conditions where two users can simultaneously read the same state and both proceed with conflicting operations.

## The Vulnerability

```typescript
// ❌ RACE CONDITION — read, check, then update
export async function markItemPickedUp(transactionId: string) {
  const { data: txn } = await supabase
    .from("exchange_transactions")
    .select("available_quantity")
    .eq("id", transactionId)
    .single()

  if (txn.available_quantity < 1) {
    throw new Error("Item already picked up")
  }

  // ← Another request can execute between read and update
  await supabase
    .from("exchange_transactions")
    .update({ status: "picked_up" })
    .eq("id", transactionId)
}
```

## The Fix: Atomic Updates

```typescript
// ✅ ATOMIC — database handles the check
export async function markItemPickedUp(transactionId: string) {
  const { data, error } = await supabase
    .from("exchange_transactions")
    .update({ status: "picked_up" })
    .eq("id", transactionId)
    .eq("status", "confirmed")  // ← Only update if still confirmed
    .select()

  if (error || !data || data.length === 0) {
    throw new Error("Transaction cannot be picked up")
  }
}
```

## Non-Atomic Delete-Then-Insert

```typescript
// ❌ RACE CONDITION — delete then insert
await supabase.from("user_interests").delete().eq("user_id", userId)
await supabase.from("user_interests").insert(newInterests)
// ← Another request can read between delete and insert

// ✅ ATOMIC — use transaction or single upsert
await supabase.rpc("replace_user_interests", {
  p_user_id: userId,
  p_interest_ids: newInterestIds,
})
```

## Affected Files (as of 2026-04-11)

| File | Function | Pattern |
|------|----------|---------|
| `app/actions/exchange-transactions.ts` | `markItemPickedUp` | Read-then-update |
| `app/actions/exchange-transactions.ts` | `markItemReturned` | Read-then-update |
| `app/actions/exchange-transactions.ts` | `cancelTransaction` | Read-then-update |
| `app/actions/profile.ts` | Interest/skill update | Delete-then-insert |
| `app/actions/events.ts` | Recurring events | Delete-then-insert |

## General Pattern

```typescript
// Use atomic SET operations
UPDATE table SET column = column - $1 WHERE id = $2 AND column >= $1

// Or use Supabase's conditional update
.update({ status: "new" })
.eq("id", transactionId)
.eq("status", "old")  // Only updates if status is still "old"
```

## Related Patterns

- `patterns/supabase-concurrency.md` — Atomic updates and upserts
- `patterns/standardized-error-handling.md` — Error handling patterns
