---
title: Split monolithic server action files by domain
status: open
created: 2026-04-11
updated: 2026-04-11
effort: medium
category: architecture
module: app/actions/
---

# Split monolithic server action files by domain

## Finding
Several server action files exceed 1,000 lines and contain multiple unrelated domains:
- `events.ts` (2,262 lines): create, update, delete, series, RSVP, visibility
- `exchange-listings.ts` (1,690 lines): CRUD + categories + flags
- `check-ins.ts` (1,039 lines): CRUD + RSVP
- `announcements.ts` (809 lines): CRUD + archive + read tracking
- `exchange-transactions.ts` (705 lines): full transaction lifecycle
- `families.ts` (594 lines): family CRUD + member management
- `resident-requests.ts` (610 lines): request CRUD + comments

## Files
- `app/actions/events.ts`
- `app/actions/exchange-listings.ts`
- `app/actions/check-ins.ts`
- `app/actions/announcements.ts`
- `app/actions/exchange-transactions.ts`
- `app/actions/families.ts`
- `app/actions/resident-requests.ts`

## Suggested fix
Split by sub-domain:
- `events.ts` → `events.ts`, `event-series.ts`, `event-rsvps.ts`
- `exchange-listings.ts` → `exchange-listings.ts`, `exchange-categories.ts`
- `check-ins.ts` → `check-ins.ts`, `check-in-rsvps.ts`
- `families.ts` → `families.ts`, `family-members.ts`
- `resident-requests.ts` → `requests.ts`, `request-comments.ts`

Start with `events.ts` (largest, most impactful). Add Zod validation during the split.
