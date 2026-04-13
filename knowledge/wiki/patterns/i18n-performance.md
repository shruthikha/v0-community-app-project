# i18n Performance Pattern

> Unmemoized context values and redundant hydration guards cause unnecessary re-renders across the entire application.

## Memoize Context Value

```typescript
// ❌ CAUSES re-render of ALL consumers on every parent render
<I18nContext.Provider value={{ t, locale, setLocale }}>

// ✅ MEMOIZED — only re-renders when values actually change
const contextValue = useMemo(
  () => ({ t, locale, setLocale }),
  [t, locale, setLocale]
)
<I18nContext.Provider value={contextValue}>
```

## Fix Language Flash on Mount

```typescript
// ❌ FLASHES default locale before localStorage resolves
const [locale, setLocale] = useState("en")

useEffect(() => {
  const saved = localStorage.getItem("locale")
  if (saved) setLocale(saved)
}, [])

// ✅ BLOCKS rendering until locale resolved
const [locale, setLocale] = useState<string | null>(null)

useEffect(() => {
  const saved = localStorage.getItem("locale")
  setLocale(saved ?? "en")
}, [])

if (locale === null) return null // Block render
```

## Centralize Hydration Boundary

```typescript
// ❌ REDUNDANT — every consumer checks mounted state
function Component() {
  const { mounted } = useTranslation()
  if (!mounted) return null
  // ...
}

// ✅ CENTRALIZED — LanguageProvider blocks until ready
function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<string | null>(null)

  useEffect(() => {
    setLocale(localStorage.getItem("locale") ?? "en")
  }, [])

  if (locale === null) return null // Single hydration boundary
  return <I18nContext.Provider value={...}>{children}</I18nContext.Provider>
}
```

## Bundle Size Considerations

Current approach loads both JSON locales in the bundle (~9.4 KB). Acceptable for 2 locales but doesn't scale.

### Future: Route-Based Locale Loading

```typescript
// With next-intl
import { getMessages } from "next-intl/server"

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }]
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages({ locale })
  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
}
```

## Checklist

- [ ] Memoize context value with `useMemo`
- [ ] Start locale as `null`, block rendering until resolved
- [ ] Remove redundant `mounted` guards from consumers
- [ ] Consider `next-intl` migration for production (route-based locale, SSR, ICU messages)

## Related Patterns

- `patterns/i18n-security.md` — i18n security patterns
- `patterns/react-perf.md` — React performance patterns
