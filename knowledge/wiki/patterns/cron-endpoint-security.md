# Cron Endpoint Security Pattern

> System-level scheduled jobs require different security posture than user-facing endpoints.

## Core Principles

1. **Mandatory authentication** — fail-closed, never optional
2. **Admin client for system operations** — bypass RLS intentionally
3. **Defense-in-depth** — multiple layers of verification
4. **Minimal response data** — return counts, not internals

## Mandatory CRON_SECRET

```typescript
// ❌ FAIL-OPEN — dangerous
const cronSecret = process.env.CRON_SECRET
if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// ✅ FAIL-CLOSED — correct
const cronSecret = process.env.CRON_SECRET
if (!cronSecret) {
  return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
}
if (req.headers.get("x-cron-secret") !== cronSecret) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

**Why fail-closed:** If `CRON_SECRET` is missing (common in dev, possible in misconfigured prod), the endpoint must refuse to run — not allow unauthenticated access.

## Admin Client for System Operations

Cron jobs perform system-level operations that RLS correctly blocks for anonymous users:

```typescript
// ❌ WRONG — anon key, RLS blocks all reads
import { createServerClient } from "@/lib/supabase/server"
const supabase = createServerClient() // No user session → RLS returns 0 rows

// ✅ CORRECT — service_role, bypasses RLS
import { createAdminClient } from "@/lib/supabase/admin"
const supabase = createAdminClient()
```

**Critical lesson:** Cron jobs using `createServerClient()` silently return zero results every day. This is worse than being broken loudly — no one notices.

## Defense-in-Depth: Vercel Cron Header

```typescript
// Additional verification for Vercel-scheduled calls
const isVercelCron = req.headers.get("x-vercel-cron") === "true"
if (!isVercelCron && !hasValidCronSecret) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

## Exclude Cron from Middleware

```typescript
// middleware.ts — skip session refresh for cron routes
export const config = {
  matcher: ["/((?!api/cron|_next/static|_next/image|favicon.ico|auth).*)"],
}
```

**Why:** Every cron invocation runs `updateSession()` which calls `supabase.auth.getUser()` — wasted DB call adding 100-200ms latency.

## Response Sanitization

```typescript
// ❌ LEAKS internals
return NextResponse.json({
  error: "Failed to archive announcements",
  details: String(error), // Exposes stack traces, file paths
})

// ✅ SAFE
return NextResponse.json({
  error: "Failed to archive announcements",
}, { status: 500 })
// Log details server-side only
console.error("[cron:archive-announcements]", error)
```

## Return Counts, Not Data

```typescript
// ❌ EXPOSES internal data
return NextResponse.json({
  archived: announcements.map(a => ({ id: a.id, title: a.title, tenant_id: a.tenant_id })),
})

// ✅ SAFE — counts only
return NextResponse.json({
  archived: count,
  total: announcements.length,
})
```

## Function Timeout Protection

```typescript
// Vercel Hobby plan default: 10s — insufficient for batch operations
export const maxDuration = 60 // seconds
```

## Batch N+1 Queries

```typescript
// ❌ N+1 — 6 DB calls per transaction
for (const txn of transactions) {
  const exists = await supabase.from("notifications").select("id").eq("transaction_id", txn.id).single()
  if (!exists) await supabase.from("notifications").insert({...})
}

// ✅ BATCH — ~3 queries total
const existingIds = new Set(
  (await supabase.from("notifications").select("transaction_id").in("transaction_id", txnIds)).data?.map(n => n.transaction_id) || []
)
const toInsert = transactions.filter(t => !existingIds.has(t.id)).map(t => ({...}))
if (toInsert.length > 0) await supabase.from("notifications").insert(toInsert)
```

## Push Filtering to Database

```typescript
// ❌ JS-side filtering — fetches ALL rows
const txns = await supabase.from("exchange_transactions").select("*")
const upcoming = txns.filter(t => daysUntil(t.expected_return_date) <= 2)

// ✅ DB-side filtering
const upcoming = await supabase
  .from("exchange_transactions")
  .select("*")
  .lt("expected_return_date", twoDaysFromNow)
  .gte("expected_return_date", today)
```

## Shared Cron Handler Pattern

```typescript
// lib/cron.ts
export function withCronHandler(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    if (req.headers.get("x-cron-secret") !== cronSecret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const start = Date.now()
    try {
      const result = await handler(req)
      console.log(`[cron] Completed in ${Date.now() - start}ms`)
      return result
    } catch (error) {
      console.error(`[cron] Failed after ${Date.now() - start}ms`, error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}
```

## Stagger Schedules

```json
{
  "crons": [
    { "path": "/api/cron/archive-announcements", "schedule": "0 0 * * *" },
    { "path": "/api/cron/check-return-dates", "schedule": "30 0 * * *" }
  ]
}
```

## Checklist

- [ ] CRON_SECRET is mandatory (fail-closed)
- [ ] Uses `createAdminClient()` for system operations
- [ ] Excluded from middleware session refresh
- [ ] Returns counts only, no internal data
- [ ] Error responses sanitized (no stack traces)
- [ ] `maxDuration` exported for timeout protection
- [ ] N+1 queries batched
- [ ] Date filtering pushed to database
- [ ] Structured logging with job metadata
- [ ] Dry-run mode supported (`?dry-run=true`)
