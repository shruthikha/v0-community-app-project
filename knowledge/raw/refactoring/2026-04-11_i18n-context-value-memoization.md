---
title: Memoize i18n context value to prevent unnecessary re-renders
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: performance
module: lib/i18n/context.tsx
---

# Memoize i18n context value to prevent unnecessary re-renders

## Finding
The `LanguageContext.Provider` value is created as a new object literal `{ locale, setLocale, t }` on every render of `LanguageProvider`. Even though `setLocale` and `t` are individually memoized with `useCallback`, the object wrapper is a new reference each time, causing all consumers of `useTranslation()` to re-render on every provider render — not just when locale changes.

Currently low impact because `LanguageProvider` is near the root and rarely re-renders for non-locale reasons. But this is a latent performance bug.

## Files
- `lib/i18n/context.tsx` (line 72)

## Suggested fix
```typescript
const contextValue = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
)

return (
    <LanguageContext.Provider value={contextValue}>
        {children}
    </LanguageContext.Provider>
)
```
