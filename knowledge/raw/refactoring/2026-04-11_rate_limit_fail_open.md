---
title: Rate limiting fails open in production
status: open
created: 2026-04-11
updated: 2026-04-11
priority: high
category: security
author: investigator/audit
---

# Rate Limiting Fails Open in Production

## Finding

In `lib/rate-limit.ts:31-36`, when Redis is unavailable, rate limiting is completely bypassed:

```typescript
if (!redis) {
    if (process.env.NODE_ENV === "production") {
        console.warn("Rate limiting disabled: UPSTASH_REDIS_REST_URL not set");
    }
    return { success: true, limit, remaining: limit, reset: Date.now() };  // ← Allows all requests!
}
```

**Impact**: If Redis becomes unavailable in production, ALL rate limiting is bypassed. This is a DOS vulnerability.

## Files

- `lib/rate-limit.ts` (lines 31-36)

## Recommendation

Fail closed in production - deny requests when rate limiting degrades:

```typescript
if (!redis) {
    if (process.env.NODE_ENV === "production") {
        // Fail closed: deny requests when rate limiting is unavailable
        return { success: false, limit: 0, remaining: 0, reset: Date.now() + 60000 };
    }
    // In dev, allow but warn
    console.warn("Rate limiting disabled: Redis unavailable");
    return { success: true, limit, remaining: limit, reset: Date.now() };
}
```

## Status

**Open** - Change rate limiting to fail closed in production

---