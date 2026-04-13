---
source: lessons_learned
imported_date: 2026-04-08
---

# Lesson: Route Handler Redirect Hostname Mismatch

## The Gotcha

Next.js with `-H 0.0.0.0` sets `request.url` hostname to `0.0.0.0`, but browser connects via `localhost`. Cookies set on `0.0.0.0` are NOT sent to `localhost` — browser treats them as different hosts.

## Pattern

```typescript
// ✅ CORRECT: Use Host header
const host = request.headers.get("x-forwarded-host") || request.headers.get("host")
const protocol = request.headers.get("x-forwarded-proto") || "http"
const origin = `${protocol}://${host}`
return NextResponse.redirect(new URL("/target", origin))

// ❌ WRONG: Use request.url
new URL(path, request.url)
```

## Related: Supabase redirect_to

Supabase's redirect chain strips query parameters. Encode data in URL path:

```typescript
// ✅ CORRECT: Path-based
redirect_to: `${origin}/auth/confirm/${tenantSlug}`

// ❌ WRONG: Query params (stripped)
redirect_to: `${origin}/auth/confirm?next=${tenantSlug}`
```