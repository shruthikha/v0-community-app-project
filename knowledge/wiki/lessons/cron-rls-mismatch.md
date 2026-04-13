# Cron Jobs and RLS — The Silent Failure Pattern

> Cron jobs using the anon-key client are silently blocked by RLS. They return zero results every day — worse than being broken loudly.

## The Pattern

```
Vercel Cron → GET /api/cron/check-return-dates
  → createServerClient() (anon key, no user session)
  → RLS requires auth.uid() = borrower_id
  → auth.uid() is NULL
  → Returns 0 rows
  → "Success! Processed 0 transactions."
```

## Why It Happens

1. Cron jobs run without a user session
2. `createServerClient()` uses the anon key
3. RLS policies require authenticated user
4. Query returns empty — no error thrown
5. Code processes empty array → "success" with zero results

## The Fix

```typescript
// ❌ WRONG — blocked by RLS
import { createServerClient } from "@/lib/supabase/server"
const supabase = createServerClient()

// ✅ CORRECT — bypasses RLS for system operations
import { createAdminClient } from "@/lib/supabase/admin"
const supabase = createAdminClient()
```

## Detection Strategy

```typescript
// Add assertion to catch silent failures
const results = await supabase.from("exchange_transactions").select("*")
if (results.data?.length === 0) {
  console.error("[cron] WARNING: Zero results — possible RLS block")
  // Consider throwing or alerting
}
```

## Dry-Run Mode

```typescript
// Support ?dry-run=true for testing
const isDryRun = new URL(request.url).searchParams.get("dry-run") === "true"
if (isDryRun) {
  return NextResponse.json({ dryRun: true, wouldProcess: count })
}
```

## Structured Logging

```typescript
console.log(JSON.stringify({
  job: "check-return-dates",
  duration: Date.now() - start,
  transactionsProcessed: count,
  notificationsSent: notifCount,
  errors: errorCount,
}))
```

## Related Patterns

- `patterns/cron-endpoint-security.md` — Full cron security patterns
- `lessons/rls-security-hardening.md` — RLS security patterns
