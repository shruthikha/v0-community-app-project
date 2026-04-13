---
title: Replace inline service role client creation with createAdminClient()
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: security
module: app/actions/
---

# Replace inline service role client creation with createAdminClient()

## Finding
Three locations create Supabase service role clients inline instead of using the centralized `createAdminClient()` factory from `lib/supabase/admin.ts`. This bypasses centralized key management and creates inconsistent error handling.

## Files
- `app/actions/families.ts:8-19` — `createServiceRoleClient()` function duplicates `createAdminClient()`
- `app/actions/events.ts:2191-2209` — inline `createClient()` with env vars
- `app/backoffice/invite/[token]/page.tsx:23-42` — inline `createClient()` with env vars

## Suggested fix
Replace all three inline client creations with `import { createAdminClient } from "@/lib/supabase/admin"`. Remove the duplicate `createServiceRoleClient()` function from `families.ts`.
