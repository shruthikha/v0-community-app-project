---
title: Debug console statements leaking PII
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: security
author: investigator/audit
---

# Debug Console Statements Leaking PII

## Finding

The `lib/data/residents.ts` file contains debug console.log statements that log user IDs and names to server output:

```typescript
// lib/data/residents.ts:158-184
console.log('[DEBUG] getResidentById called:', { userId, options })
console.log('[DEBUG] User tenant lookup:', { userId, userData, userError })
console.log('[DEBUG] No tenant_id found for user, returning null')
console.log('[DEBUG] getResidentById results:', {
    userId,
    tenantId: userData.tenant_id,
    foundCount: residents.length,
    resident: residents[0] ? { id: residents[0].id, name: `${residents[0].first_name} ${residents[0].last_name}` } : null
})
```

**Impact**: PII exposed in server logs - violation of privacy best practices.

## Files

- `lib/data/residents.ts` (lines 158-184)
- `lib/data/events.ts` (error logging)
- `lib/coordinate-transformer.ts` (conversion debug logs)
- `lib/location-utils.ts` (location debug logs)

## Recommendation

Remove all debug console statements, or use a structured logger that respects LOG_LEVEL:

```typescript
const logger = process.env.LOG_LEVEL === 'debug' ? console : { log: () => {} }
logger.log('[DEBUG] getResidentById called:', { userId, options })
```

Or simply remove all debug statements for production.

## Status

**Open** - Remove debug statements from production code

---