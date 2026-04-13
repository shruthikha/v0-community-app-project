---
title: Complete or remove stub API endpoints
status: open
created: 2026-04-11
updated: 2026-04-11
priority: medium
category: tech-debt
author: @investigator/audit
---

# Complete or remove stub API endpoints

## Finding
Several API endpoints throw "not yet implemented" errors:
- `app/api/v1/residents/route.ts` POST
- `app/api/v1/locations/route.ts` POST

## Files
- `app/api/v1/residents/route.ts`
- `app/api/v1/locations/route.ts`

## Recommendation
Either implement the endpoints or remove them. Incomplete stubs cause confusion.

## Status
**Open** - Technical debt