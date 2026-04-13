---
title: Fix cron job authentication and RLS bypass
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: security
module: app/api/cron/
---

# Fix cron job authentication and RLS bypass

## Finding
Two critical issues with cron jobs:

1. **CRON_SECRET not configured** — The env var is absent from `.env.local`, so the auth check `if (cronSecret && ...)` is always falsy. Anyone on the internet can trigger these endpoints.

2. **RLS blocks all reads** — Both cron routes use `createServerClient()` / `createClient()` which creates an anon-key client with no user session. RLS policies require authenticated users, so the cron silently returns zero results. No reminders or overdue notifications are ever sent.

## Files
- `app/api/cron/check-return-dates/route.ts`
- `app/api/cron/archive-announcements/route.ts`

## Suggested fix
1. Add `CRON_SECRET` to Vercel environment variables (generate strong random value)
2. Make the check mandatory — throw if `CRON_SECRET` is not configured
3. Add `x-vercel-cron` header verification as defense-in-depth
4. Switch both routes to `createAdminClient()` (service_role) for cron operations
5. Remove sensitive data from cron responses (return counts only, not IDs/tenant_ids)
6. Stagger cron schedules in `vercel.json` (30 min apart)

## Priority
🔴 CRITICAL — Identified as C4 and C5 in the CI/CD cross-cutting audit. C5 was already found in audit_2026-04-11_cron_module.md and remains unfixed.
