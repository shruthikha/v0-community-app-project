---
title: Remove debug console.log statements from production code
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: performance
author: investigator/audit
---

# Remove debug console.log statements from production code

## Finding
56 instances of debug console.log/error/warn statements found across lib/ directory. These leak information in production server logs and may expose PII.

## Files
- `lib/supabase/middleware.ts`
- `lib/data/residents.ts`
- `lib/data/events.ts`
- `lib/coordinate-transformer.ts`
- `lib/location-utils.ts`
- `lib/dashboard/stats-config.ts`
- `lib/data/exchange.ts`
- `lib/data/families.ts`
- `lib/data/locations.ts`
- `lib/data/check-ins.ts`

## Specific Concerns
- `lib/data/residents.ts:158-184` includes `[DEBUG]` logs with user IDs and names
- `lib/coordinate-transformer.ts` includes coordinate conversion debug logs
- Multiple files include console.error with full error objects (potential info leak)

##Recommendation
Replace all console.* statements with a structured logger that respects LOG_LEVEL environment variable. Remove debug statements entirely in production.

## Status
**Open** - 56 instances to address across 10+ files