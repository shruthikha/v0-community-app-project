---
title: Replace all alert() calls with toast/sonner
status: open
created: 2026-04-11
updated: 2026-04-11
priority: medium
category: ux
author: @orchestrator/audit
source: audit_2026-04-11_error_handling_crosscutting.md
---

# Replace alert() with Toast Notifications

## Finding

24 `alert()` calls across 14 files. `alert()` blocks the main thread, is inaccessible (no screen reader support), cannot be styled, provides no undo, and breaks mobile UX.

## Files Affected

| File | Count | Context |
|------|-------|---------|
| `components/exchange/my-listings-and-transactions-widget.tsx` | 3 | Publish, archive, delete |
| `components/exchange/archived-listings-table.tsx` | 2 | Archive operations |
| `app/t/[slug]/admin/residents/residents-table.tsx` | 3 | Delete residents, pets |
| `app/backoffice/dashboard/tenants/[id]/edit/edit-tenant-form.tsx` | 3 | Edit tenant |
| `app/t/[slug]/admin/families/create/create-family-form.tsx` | 2 | Create family |
| `app/t/[slug]/admin/pets/[id]/edit/edit-pet-form.tsx` | 2 | Edit pet |
| `components/exchange/listing-history-modal.tsx` | 1 | Listing history |
| `app/t/[slug]/onboarding/profile/profile-form.tsx` | 1 | Photo upload |
| `app/t/[slug]/admin/residents/[id]/edit/edit-resident-form.tsx` | 1 | Invite email |
| `app/t/[slug]/admin/lots/lots-table.tsx` | 1 | Lot operations |
| `app/t/[slug]/admin/events/categories/category-form.tsx` | 1 | Category form |
| `app/t/[slug]/admin/events/categories/categories-table.tsx` | 1 | Category table |
| `app/backoffice/dashboard/create-tenant/page.tsx` | 1 | Success alert with invite URL |
| `components/_deprecated/exchange/my-exchange-listings-widget.tsx` | 2 | Deprecated |

## Recommendation

1. **Consolidate toast system first** (see `2026-04-11_standardized-error-handling.md`) — pick sonner as the standard
2. **Replace all alert() calls** with `toast.error()` / `toast.success()`
3. **Add action context** — include "undo" where appropriate (e.g., delete operations)

## Effort

Low — mechanical replacement, ~24 instances across 14 files.
