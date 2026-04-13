# i18n Security Pattern

> Internationalization systems are attack surfaces. Unvalidated translation keys and unsafe HTML rendering create XSS and prototype pollution vectors.

## Prototype Pollution Prevention

```typescript
// ❌ VULNERABLE — `in` operator checks prototype chain
function translate(key: string, value: unknown): string {
  if (typeof value === "object" && value !== null) {
    if (key in value) {  // ← prototype pollution vector
      return translate(key, (value as Record<string, unknown>)[key])
    }
  }
  return key
}

// ✅ SAFE — use Object.hasOwn()
function translate(key: string, value: unknown): string {
  if (typeof value === "object" && value !== null) {
    if (Object.hasOwn(value, key)) {
      return translate(key, (value as Record<string, unknown>)[key])
    }
  }
  return key
}
```

## Translation Key Validation

```typescript
// ❌ NO VALIDATION — any string accepted
export function t(key: string): string {
  return resolveKey(key)
}

// ✅ VALIDATED — reject malicious keys
const VALID_KEY_PATTERN = /^[a-zA-Z0-9_.-]+$/

export function t(key: string): string {
  if (!VALID_KEY_PATTERN.test(key)) {
    console.warn(`[i18n] Invalid translation key: ${key}`)
    return key
  }
  return resolveKey(key)
}
```

## Safe HTML Rendering

```typescript
// ❌ XSS RISK — raw translation with HTML
<div dangerouslySetInnerHTML={{ __html: t("welcome.message") }} />

// ✅ SAFE — sanitize with DOMPurify
import DOMPurify from "isomorphic-dompurify"

export function tHtml(key: string): string {
  const raw = resolveKey(key)
  return DOMPurify.sanitize(raw)
}

// Usage
<div dangerouslySetInnerHTML={{ __html: tHtml("welcome.message") }} />
```

## Fallback Behavior

```typescript
// ❌ BAD — returns raw key name to user
return key  // User sees "dashboard.welcome.title"

// ✅ GOOD — returns user-friendly fallback
const FALLBACKS: Record<string, string> = {
  "dashboard.welcome.title": "Welcome",
  "nav.home": "Home",
}
return FALLBACKS[key] ?? "Text unavailable"
```

## Provider Boundary Safety

```typescript
// ❌ CRASHES if used outside provider
const { t } = useTranslation()

// ✅ GRACEFUL DEGRADATION
export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    return {
      t: (key: string) => key,
      locale: "en",
    }
  }
  return ctx
}
```

## Checklist

- [ ] Use `Object.hasOwn()` instead of `in` operator
- [ ] Validate translation keys with regex
- [ ] Create `tHtml()` helper with DOMPurify
- [ ] User-friendly fallback messages (not raw keys)
- [ ] Graceful degradation outside provider
- [ ] No `dangerouslySetInnerHTML` with unsanitized translations

## Related Patterns

- `patterns/xss-prevention.md` — XSS prevention patterns
- `patterns/react-perf.md` — i18n performance (memoization)
