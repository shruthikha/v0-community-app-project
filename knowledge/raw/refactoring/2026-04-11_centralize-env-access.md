---
title: Centralize environment variable access into lib/env.ts
status: open
created: 2026-04-11
updated: 2026-04-11
effort: medium
category: architecture
module: lib/
---

# Centralize environment variable access into lib/env.ts

## Finding
`process.env` is accessed directly in 15+ files across the codebase. `NODE_ENV` is checked inline in 15+ files. There is no centralized environment module. This leads to inconsistent fallback behavior — some modules fail closed (`lib/ai/config.ts`), some fail open (`lib/rate-limit.ts`), some silently use defaults.

## Files
- `lib/env.ts` (create)
- `lib/rate-limit.ts`
- `lib/supabase/middleware.ts`
- `lib/ai/config.ts`
- `app/api/cron/check-return-dates/route.ts`
- `app/api/cron/archive-announcements/route.ts`
- `app/api/v1/ai/memories/route.ts`
- `app/api/v1/ai/ingest/route.ts`
- `app/actions/auth-actions.ts`
- `app/actions/rio-memory.ts`
- `app/t/[slug]/login/page.tsx`
- `app/t/[slug]/login/login-form.tsx`
- `components/library/feature-carousel.tsx`
- `lib/posthog.ts`

## Suggested fix
Create `lib/env.ts` with:
- `isProduction()`, `isDevelopment()` helpers
- `requireEnv(name: string): string` — throws if missing
- `optionalEnv(name: string, fallback?: string): string | undefined`
- Startup validation function that checks all required vars
- Migrate all inline `process.env` access to use these helpers
