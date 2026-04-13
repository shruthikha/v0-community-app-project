---
title: Eliminate language flash on mount in LanguageProvider
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: performance
module: lib/i18n/context.tsx
---

# Eliminate language flash on mount in LanguageProvider

## Finding
Spanish-preferring users see English text flash for ~1 frame before `useEffect` resolves the saved locale from localStorage. The `mounted` state in `LanguageProvider` is set to `true` but never used to gate rendering — it's dead code.

Additionally, three components independently implement the `mounted` pattern (`LanguageProvider`, `DesktopNav`, `HamburgerMenu`), causing a triple render cascade on page load.

## Files
- `lib/i18n/context.tsx` (lines 30-38)
- `components/ecovilla/navigation/desktop-nav.tsx` (line 63)
- `components/ecovilla/navigation/hamburger-menu.tsx` (line 97)

## Suggested fix
1. Start `locale` as `null` instead of `"en"`
2. Block rendering children until locale is resolved: `if (locale === null) return null`
3. Remove the dead `mounted` state from `LanguageProvider`
4. Consider removing redundant `mounted` guards from `DesktopNav` and `HamburgerMenu` (keep only if needed for non-i18n SSR concerns like collapse state)
