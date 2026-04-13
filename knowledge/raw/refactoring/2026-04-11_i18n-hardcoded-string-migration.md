---
title: Migrate hardcoded strings to i18n across codebase
status: open
created: 2026-04-11
updated: 2026-04-11
effort: large
category: tech-debt
module: components/ecovilla/, app/t/[slug]/admin/
---

# Migrate hardcoded strings to i18n across codebase

## Finding
~230+ user-facing strings are hardcoded across 22 component files. Only 4 files import from `lib/i18n`, and even those have gaps (e.g., `desktop-nav.tsx` has hardcoded "Notifications" tooltip and "Collapse" button text).

### Zero-adoption files (highest priority):
- `components/ecovilla/navigation/mobile-dock.tsx` — 5 labels
- `components/ecovilla/navigation/create-popover.tsx` — 14 strings
- `components/ecovilla/dashboard/RioWelcomeCard.tsx` — 8 strings
- `components/ecovilla/dashboard/PriorityFeed.tsx` — 25+ strings
- `components/ecovilla/dashboard/EditStatModal.tsx` — 4 strings
- `components/ecovilla/dashboard/StatCard.tsx` — 3 scope labels
- `components/ecovilla/dashboard/PriorityHeroCard.tsx` — 2 strings
- `components/ecovilla/chat/RioChatSheet.tsx` — 12+ strings
- `components/language-toggle.tsx` — 4 strings

### Admin pages (hundreds of strings):
- `app/t/[slug]/admin/exchange/admin-exchange-table.tsx` — 40+ strings
- `app/t/[slug]/admin/exchange/clear-flag-dialog.tsx` — 12 strings
- `app/t/[slug]/admin/exchange/archive-listings-dialog.tsx` — 12 strings
- `app/t/[slug]/admin/exchange/delete-listings-dialog.tsx` — 9 strings
- `app/t/[slug]/admin/residents/residents-table.tsx` — 25+ strings
- `app/t/[slug]/admin/residents/access-requests-table.tsx` — 20+ strings
- `app/t/[slug]/admin/residents/create/create-resident-form.tsx` — 40+ strings
- `app/t/[slug]/admin/residents/[id]/edit/edit-resident-form.tsx` — 25+ strings
- `app/t/[slug]/admin/requests/admin-requests-table.tsx` — 30+ strings
- `app/t/[slug]/admin/announcements/admin-announcements-table.tsx` — 25+ strings

## Files
All files listed above

## Suggested fix
Phase 1: Add missing translation keys to `en.json`/`es.json` for navigation and dashboard components
Phase 2: Wrap strings in `t()` calls for navigation and dashboard
Phase 3: Add admin namespace to translation files
Phase 4: Migrate admin pages
Phase 5: Add CI check for en.json/es.json key parity
