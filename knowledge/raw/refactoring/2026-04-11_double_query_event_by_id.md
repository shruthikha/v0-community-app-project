---
title: Double Query Pattern in getEventById
status: open
created: 2026-04-11
updated: 2026-04-11
priority: medium
category: performance
author: orchestrator/audit
---

# Double Query Pattern in getEventById

## Finding
`getEventById()` first fetches the event's tenant_id, then calls `getEvents()` with cleared date filters and filters in memory. Two database calls when one direct query would suffice.

## Files
- `lib/data/events.ts:250-265`

## Recommendation
Create a dedicated query `getEventByIdQuery(eventId, options)` that fetches directly by ID with all requested enrichments in a single query.

## Status
**Open** - Medium priority optimization