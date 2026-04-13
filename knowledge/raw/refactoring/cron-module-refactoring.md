# Refactoring Opportunity: Cron Job Module

**Date**: 2026-04-11
**Source**: Audit `audit_2026-04-11_cron_module.md`
**Severity**: High

## Summary

The `app/api/cron/` module has two route handlers with duplicated boilerplate (auth check, error handling, logging) and a critical architectural flaw (using anon-key client instead of service_role).

## Refactoring Opportunities

### 1. Create `lib/cron.ts` — Shared Cron Handler Wrapper

**Problem**: Both cron routes duplicate ~20 lines of auth verification, logging, and error handling boilerplate.

**Proposal**:
```typescript
// lib/cron.ts
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export interface CronResult {
  success: boolean
  message: string
  [key: string]: unknown
}

export type CronHandler = (
  supabase: ReturnType<typeof createAdminClient>,
  request: Request
) => Promise<CronResult>

export function withCron(handler: CronHandler) {
  return async (request: Request) => {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error("[cron] CRON_SECRET not configured")
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const startTime = Date.now()
    console.log(`[cron] Job started at ${new Date().toISOString()}`)

    try {
      const supabase = createAdminClient()
      const result = await handler(supabase, request)
      const duration = Date.now() - startTime
      console.log(`[cron] Job completed in ${duration}ms`)
      return NextResponse.json(result)
    } catch (error) {
      console.error("[cron] Unexpected error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}
```

### 2. Create `lib/notifications/cron.ts` — Direct Notification Creator

**Problem**: `createNotification()` server action creates its own Supabase client via `createServerClient()`. Cron jobs should pass their own admin client.

**Proposal**:
```typescript
// lib/notifications/cron.ts
import type { CreateNotificationData } from "@/types/notifications"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function createNotificationDirect(
  supabase: SupabaseClient,
  data: CreateNotificationData
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("notifications").insert({
    tenant_id: data.tenant_id,
    recipient_id: data.recipient_id,
    type: data.type,
    title: data.title,
    message: data.message || null,
    action_required: data.action_required || false,
    exchange_transaction_id: data.exchange_transaction_id || null,
    exchange_listing_id: data.exchange_listing_id || null,
    event_id: data.event_id || null,
    check_in_id: data.check_in_id || null,
    document_id: data.document_id || null,
    actor_id: data.actor_id || null,
    action_url: data.action_url || null,
    metadata: data.metadata || null,
  })

  if (error) {
    console.error("[cron] Error creating notification:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
```

### 3. Batch Notification Dedup + Insert

**Problem**: N+1 query pattern — 6 DB calls per transaction (3 existence checks + 3 inserts).

**Proposal**: Replace the per-transaction loop with:
1. Single query to fetch all existing notifications for the transaction IDs
2. Build a Set for O(1) dedup lookup
3. Collect all notifications to insert in an array
4. Single batch insert

### 4. Push Date Filtering to Database

**Problem**: Fetches ALL active transactions, filters in JavaScript.

**Proposal**: Two separate queries:
- Overdue: `.lt("expected_return_date", nowISO)`
- Upcoming reminders: `.gte("expected_return_date", nowISO).lte("expected_return_date", twoDaysFromNowISO)`

### 5. Exclude Cron from Middleware

**Problem**: Middleware runs `updateSession()` on every cron request, wasting ~100-200ms and a Supabase Auth call.

**Proposal**: Add `api/cron` to the middleware matcher exclusion in `middleware.ts`:
```typescript
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
```

## Priority

1. **Immediate**: Fix 1 (wrapper) + switch to `createAdminClient()` — resolves C1, C2, C3, M5
2. **This sprint**: Fix 2 (direct notification creator) + Fix 3 (batch queries) — resolves H1, H2
3. **Next sprint**: Fix 4 (DB-side filtering) + Fix 5 (middleware exclusion) — resolves M1, H5

## Estimated Effort

- Fix 1: 1-2 hours
- Fix 2: 30 minutes
- Fix 3: 2-3 hours
- Fix 4: 1 hour
- Fix 5: 15 minutes

**Total**: ~5-7 hours
