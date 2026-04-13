---
title: Add Zod validation to profile server action
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: security
author: @investigator/audit
---

# Add Zod validation to profile server action

## Finding
The `updateProfileAction` in `app/actions/profile.ts` lacks Zod schema validation. Wiki pattern mandates all server actions use Zod for input validation.

## Files
- `app/actions/profile.ts`

## Recommendation
Add Zod schema for `ProfileUpdateData` interface fields

## Status
**Open** - Requires implementation per wiki pattern `server-actions.md`