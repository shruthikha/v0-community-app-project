---
title: Password Reset Must Be Rate Limited
---

# Password Reset Must Be Rate Limited

Password reset flows should always include application-level rate limiting, even when they already prevent email enumeration.

## Why it matters

A reset endpoint can be abused to generate spam, consume auth quota, or brute-force account discovery patterns. Returning a success response for every request is good for anti-enumeration, but it does not stop abuse.

## Pattern

1. Rate limit by tenant, email, or IP.
2. Keep the external response generic.
3. Fail closed when the limit is exceeded.
4. Log only non-PII metadata.

## Related files

- `app/actions/auth-actions.ts`
- `knowledge/wiki/lessons/feature-flags.md`
- `knowledge/wiki/patterns/security-patterns.md`

## Notes

Use this lesson alongside the auth verification and PII redaction guidance.