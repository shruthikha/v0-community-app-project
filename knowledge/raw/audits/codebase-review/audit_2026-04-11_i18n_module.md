# Audit: lib/i18n Module

**Date**: 2026-04-11
**Type**: Module
**Focus**: Security, Performance, Code Quality, Understanding
**Scope**: `lib/i18n/` (4 files) + all consumers across `components/` and `app/`

## Context

The i18n system (`lib/i18n/`) provides English/Spanish translations via a React Context provider. It was explicitly flagged as unaudited in the retro `retro_2026-04-11_audit-coverage-gaps.md` (Line 162-171). This audit covers the module itself, translation parity, security, performance, and adoption across the codebase.

## Prior Work

- **`knowledge/raw/audits/retros/retro_2026-04-11_audit-coverage-gaps.md`** — Explicitly identified i18n as unaudited (MEDIUM GAP). Noted: no completeness audit, no security audit of context provider, hardcoded strings may bypass i18n.
- **`knowledge/raw/audits/audit_2026-04-11_lib_module.md`** — Listed i18n as a utility module but did not analyze it.
- **`knowledge/raw/audits/audit_2026-04-11_api_crosscutting.md`** — Noted hardcoded error messages should be externalized for i18n support.
- **`knowledge/raw/audits/audit_2026-04-11_cron_module.md`** — Found hardcoded lender overdue message bypasses utility (M4: inconsistent format, locale-dependent).
- **`knowledge/wiki/patterns/react-perf.md`** — General React performance patterns (no i18n-specific entries).

## Findings

### Critical

| Finding | File | Recommendation |
|---------|------|---------------|
| **C1: Context value not memoized** — `{ locale, setLocale, t }` object recreated every render, causing unnecessary re-renders of all consumers | `context.tsx:72` | Wrap with `useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])` |
| **C2: Language flash on mount** — Spanish-preferring users see English text for ~1 frame before `useEffect` resolves locale. `mounted` state is set but never used for gating | `context.tsx:30-38` | Start `locale` as `null`, block rendering until resolved from localStorage |

### High

| Finding | File | Recommendation |
|---------|------|---------------|
| **H1: Prototype pollution via `t()` key traversal** — Uses `k in value` which checks prototype chain. Malicious keys like `__proto__`, `constructor` can leak internal function source code | `context.tsx:51` | Replace `k in value` with `Object.hasOwn(value, k)`. Add key validation regex `/^[a-zA-Z0-9_.-]+$/` |
| **H2: ~230+ hardcoded user-facing strings bypass i18n** — 22 of 22 scanned component files contain untranslated strings. Only 3 files import `useTranslation`, and even those have gaps | 22 files across `components/ecovilla/` and `app/t/[slug]/admin/` | Systematic migration: add translation keys to JSON files, wrap strings in `t()` calls. Priority: navigation, dashboard, admin tables |
| **H3: `mobile-dock.tsx` has zero i18n adoption** — All 5 dock labels hardcoded, no `useTranslation` import | `components/ecovilla/navigation/mobile-dock.tsx:28-53` | Import `useTranslation`, replace hardcoded labels with `t()` calls |
| **H4: `create-popover.tsx` has zero i18n adoption** — 14 user-facing strings hardcoded including action titles and descriptions | `components/ecovilla/navigation/create-popover.tsx:65-148` | Add translation keys, import `useTranslation` |
| **H5: `RioChatSheet.tsx` has zero i18n adoption** — 12+ strings including welcome messages, error states, input placeholders | `components/ecovilla/chat/RioChatSheet.tsx` | Add translation keys for chat UI |
| **H6: `PriorityFeed.tsx` has zero i18n adoption** — 25+ strings including toast messages, error states, button text, badges | `components/ecovilla/dashboard/PriorityFeed.tsx` | Add translation keys for feed UI |
| **H7: All admin pages have zero i18n adoption** — Hundreds of table headers, labels, dialogs, toasts hardcoded across 6+ admin components | `app/t/[slug]/admin/` (exchange, residents, requests, announcements) | Add admin-specific translation namespace to JSON files |

### Medium

| Finding | File | Recommendation |
|---------|------|---------------|
| **M1: No input validation on translation keys** — `t()` accepts any string. If user-controlled data is passed (e.g., from URL params), no guardrail exists | `context.tsx:45` | Add regex validation: `/^[a-zA-Z0-9_.-]+$/`. Reject invalid keys with console.warn |
| **M2: No `tHtml()` helper for HTML content** — If a developer uses `dangerouslySetInnerHTML` with translation values, XSS is possible. No explicit HTML-safe variant exists | `context.tsx` | Add `tHtml()` that uses `DOMPurify.sanitize()`. Document constraint in JSDoc |
| **M3: Three redundant `mounted` guards** — `LanguageProvider`, `DesktopNav`, and `HamburgerMenu` each implement independent `mounted` state patterns, causing triple render cascade on mount | `context.tsx:31`, `desktop-nav.tsx:63`, `hamburger-menu.tsx:97` | Centralize hydration boundary in `LanguageProvider`. Remove redundant guards from consumers |
| **M4: `language-toggle.tsx` has hardcoded language names** — "English", "Español", "Switch to Spanish/English" are hardcoded despite being user-facing | `components/language-toggle.tsx:7-8,29` | Add to translation keys, use `t("settings.language")` for fallback |
| **M5: Date formatting uses hardcoded locale** — `toLocaleDateString("en-US", ...)` ignores user's language preference | `access-requests-table.tsx:128`, `admin-exchange-table.tsx:223` | Pass `locale` from i18n context to date formatting functions |

### Low

| Finding | File | Recommendation |
|---------|------|---------------|
| **L1: Fallback returns raw key** — Missing translations return the key string itself, which could leak internal key names to users | `context.tsx:60,67` | Return `[missing: ${key}]` in dev, empty string in prod |
| **L2: `useTranslation()` outside provider crashes React tree** — Throws error instead of graceful degradation | `context.tsx:79-85` | Provide default context with identity function `t: (key) => key` as fallback |
| **L3: 5 keys potentially untranslated** — ES values match EN exactly for: `announcements.general`, `announcements.priority.normal`, `common.no`, `nav.personal`, `official.hoa` | `es.json` | Verify these are intentional (some are proper nouns/abbreviations) |
| **L4: Both JSON locales always in bundle** — ~9.4 KB combined. Negligible now but doesn't scale | `context.tsx:4-5` | No action needed at 180 keys. Consider dynamic `import()` if translations exceed ~50 KB |
| **L5: No TypeScript types for translation keys** — Keys are plain strings, no autocomplete or compile-time validation | `context.tsx:45` | Consider generating types from JSON keys for IDE autocomplete |

## Understanding Mapping

### Module Structure

```
lib/i18n/
├── index.ts          # Re-exports: LanguageProvider, useTranslation, useLocale
├── context.tsx       # React Context provider with translation logic (89 lines)
├── en.json           # English translations (180 keys, 6.5 KB)
└── es.json           # Spanish translations (180 keys, 6.9 KB)
```

### Entry Points

- **`LanguageProvider`** — Wraps `DashboardLayoutClient` (the dashboard shell). Only instantiation point.
- **`useTranslation()`** — Hook returning `{ locale, setLocale, t }`. Used by 4 components.
- **`useLocale()`** — Convenience hook returning `{ locale, setLocale }`. Used by `LanguageToggle`.

### Consumers (4 files import i18n)

| Component | Imports | Usage |
|-----------|---------|-------|
| `desktop-nav.tsx` | `useTranslation` | Nav labels, section titles, profile menu |
| `mobile-top-bar.tsx` | `useTranslation` | Profile menu items |
| `hamburger-menu.tsx` | `useTranslation` | Mobile nav labels, section titles |
| `language-toggle.tsx` | `useLocale` | Language switching button |

### Data Flow

```
1. App mounts → DashboardLayoutClient renders
2. LanguageProvider initializes with locale="en" (default)
3. useEffect reads localStorage.getItem("preferred-language")
4. If valid ("en" or "es"), sets locale state
5. setMounted(true) — but never used for gating
6. Consumer components call t("key") → traverses nested JSON object
7. User clicks LanguageToggle → setLocale("es") → localStorage set → all consumers re-render
```

### Patterns Used

- **React Context** for state distribution
- **useCallback** for memoizing `t()` and `setLocale()`
- **localStorage** for persistence
- **Fallback chain**: active locale → English → return key
- **Mounted guard pattern** (inconsistent — provider sets but doesn't use it)

### Dependencies

- **React**: `createContext`, `useContext`, `useState`, `useEffect`, `useCallback`
- **JSON files**: Static imports of `en.json` and `es.json`
- **No external i18n library** — custom implementation (not `next-intl`, `react-i18next`, etc.)

## Recommendations

### Immediate

- [ ] **Fix prototype pollution** (H1): Replace `k in value` with `Object.hasOwn(value, k)` in both primary and fallback traversal loops in `context.tsx`
- [ ] **Memoize context value** (C1): Wrap `{ locale, setLocale, t }` with `useMemo` to prevent unnecessary consumer re-renders
- [ ] **Fix language flash** (C2): Start `locale` as `null`, block rendering until localStorage is resolved. Remove dead `mounted` state
- [ ] **Add key validation** (M1): Reject keys that don't match `/^[a-zA-Z0-9_.-]+$/`
- [ ] **Migrate navigation components** (H3, H4): `mobile-dock.tsx` and `create-popover.tsx` are high-visibility, low-effort wins

### Future

- [ ] **Systematic hardcoded string migration** (H2-H7): Phase by phase — dashboard → chat → admin pages. Add translation keys to JSON files first, then update components
- [ ] **Add `tHtml()` helper** (M2): For any future HTML content in translations, with DOMPurify sanitization
- [ ] **Centralize mounted guards** (M3): Remove redundant hydration guards from `DesktopNav` and `HamburgerMenu`
- [ ] **Locale-aware date formatting** (M5): Pass `locale` from i18n context to all `toLocaleDateString` and `formatDate` calls
- [ ] **Generate TypeScript types for keys** (L5): Enable IDE autocomplete for translation keys
- [ ] **Add i18n completeness CI check** (L3): Script that verifies en.json/es.json key parity on PRs
- [ ] **Consider `next-intl` migration** — For a production i18n system, `next-intl` provides route-based locale, SSR support, message formatting, and ICU message syntax. The custom implementation works but lacks these features.
