---
title: Double Query Pattern in getResidentById
status: open
created: 2026-04-11
updated: 2026-04-11
priority: medium
category: performance
author: orchestrator/audit
---

# Double Query Pattern in getResidentById

## Finding
`getResidentById()` first fetches the user's tenant_id, then calls `getResidents()` and filters in memory. Should query directly by ID.

## Files
- `lib/data/residents.ts:100-120`

## Recommendation
Create a dedicated query that fetches directly with `.eq("id", userId)` instead of fetching all residents and filtering.

## Status
**Open** - Medium priority optimization