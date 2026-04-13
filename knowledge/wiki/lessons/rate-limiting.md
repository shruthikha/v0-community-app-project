---
title: Public Rate Limiting
description: IP-based rate limiting, try-catch scope, fail-open
categories: [security, api, rate-limiting]
sources: [log_2026-02-25_request_access.md]
---

# Public Rate Limiting

## IP-Based Limiter

3 requests per 60 seconds per IP:

```typescript
const limiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 3
});

export async function GET(request: Request) {
  const ip = getClientIP(request);
  
  if (!limiter.check(ip)) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }
  
  // Process request
}
```

## Try-Catch Scope

Separate infra from handler to prevent double execution:

```typescript
// BAD: Rate limit checked inside handler
try {
  if (!limiter.check(ip)) throw new Error();
  await handler(); // Can execute even after error
} catch {}

// GOOD: Check outside try-catch
if (!limiter.check(ip)) {
  return error; // Early return
}
try {
  await handler();
} catch {}
```

## Fail-Open vs Fail-Closed

For public forms, use fail-open to not block legitimate users:

```typescript
const check = () => {
  try {
    return limiter.check(ip);
  } catch {
    // Log but don't block on limiter errors
    return true; 
  }
};
```

## Fail-Closed Should Be Default for Production

**Audit finding (2026-04-11):** Rate limiting fails open in production — if Redis unavailable, ALL requests are allowed. This is dangerous for auth endpoints and upload endpoints.

```typescript
// ❌ FAIL-OPEN — dangerous for auth/upload
if (!redis) return { success: true }

// ✅ FAIL-CLOSED — reject if infra unavailable
if (!redis) {
  console.error("[rate-limit] Redis unavailable — failing closed")
  return { success: false, reason: "service_unavailable" }
}
```

## Missing Rate Limiting (2026-04-11 Audit)

| Endpoint | Status | Risk |
|----------|--------|------|
| Password reset | ❌ No rate limiting | HIGH — email enumeration, abuse |
| Server actions | ❌ No rate limiting | MEDIUM — mutation abuse |
| Upload endpoints | ❌ No rate limiting | HIGH — storage abuse, DoS |
| Río agent /chat | ❌ No rate limiting | MEDIUM — API cost abuse |

---

## Related

- [security-patterns](../patterns/security-patterns.md)
- [patterns/cron-endpoint-security.md](../patterns/cron-endpoint-security.md)
- [patterns/file-upload-security.md](../patterns/file-upload-security.md)
- [patterns/cron-endpoint-security.md](../patterns/cron-endpoint-security.md)
- [patterns/file-upload-security.md](../patterns/file-upload-security.md)