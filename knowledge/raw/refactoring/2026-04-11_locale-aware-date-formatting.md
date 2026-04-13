---
title: Add locale-aware date formatting across admin tables
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: readability
module: app/t/[slug]/admin/
---

# Add locale-aware date formatting across admin tables

## Finding
Multiple admin tables use hardcoded `"en-US"` locale in `toLocaleDateString()` calls, ignoring the user's language preference from the i18n context. Spanish-preferring users see dates formatted in US style (MM/DD/YYYY) instead of locale-appropriate formats.

## Files
- `app/t/[slug]/admin/residents/access-requests-table.tsx` (line 128)
- `app/t/[slug]/admin/exchange/admin-exchange-table.tsx` (line 223)

## Suggested fix
Pass `locale` from `useLocale()` hook to date formatting:
```typescript
const { locale } = useLocale()
date.toLocaleDateString(locale === 'es' ? 'es-CR' : 'en-US', options)
```
