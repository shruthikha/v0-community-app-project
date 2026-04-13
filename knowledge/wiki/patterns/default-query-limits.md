---
title: Default Query Limits Pattern
---

# Default Query Limits Pattern

List queries should apply a safe default limit unless the caller explicitly opts into a larger result set.

## Why it matters

Unbounded queries can cause memory pressure, slow responses, and accidental tenant-wide scans. A default limit makes high-traffic endpoints safer by default.

## Pattern

- Add a default `limit` or pagination window.
- Require explicit opt-in for larger exports.
- Keep the default aligned with the UI's actual display needs.

## Related files

- `lib/data/*.ts`
- `app/api/v1/*.ts`
- `knowledge/wiki/patterns/server-actions.md`

## Notes

This is most important for tenant-scoped lists, dashboards, and admin search endpoints.