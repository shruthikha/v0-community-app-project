---
source: lessons_learned
imported_date: 2026-04-08
---

# Lesson: PII in URLs and Logs

## PII in URL Query Parameters

NEVER pass PII in query params:

```typescript
// ❌ WRONG: PII in URL
<Link href="/create?name=John&email=john@example.com">

// ✅ CORRECT: Opaque ID only
<Link href="/create?from_request=uuid">
// Fetch data server-side
```

## PII Logging

Wrap debug logs in production check:

```typescript
// ✅ CORRECT
if (process.env.NODE_ENV !== 'production') {
  console.log('[debug] User:', userId);
}

// ❌ WRONG
console.log('[debug] User:', userId);
```

## Redacted Logging for Traceability

Use hashing for production debugging:

```typescript
function hashUserId(id: string): string {
  return crypto.createHash('sha256').update(id).digest('hex').slice(0, 10);
}
// Produces traceable-but-not-identifying debug output