---
title: Add auth verification to lots API
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: security
author: @investigator/audit
---

# Add auth verification to lots API

## Finding
`app/api/v1/lots/route.ts` uses `createAdminClient` for full table access (bypasses RLS) without verifying user role.

## Files
- `app/api/v1/lots/route.ts`

## Recommendation
Add role verification before using admin client.

## Status
**Open** - Security gap per wiki pattern `security-patterns.md`