---
title: PostHog Observability
description: PII redaction, SHA-256 masking, telemetry patterns
categories: [observability, posthog, privacy]
sources: [log_2026-03-19_rio-posthog-observability.md]
---

# PostHog Observability

## PII Redaction Pattern

Use SHA-256 for safe telemetry:

```typescript
import { createHash } from 'crypto';

function hashIdentifier(id: string): string {
  return createHash('sha256').update(id).digest('hex');
}

// Usage: Send hashed IDs to PostHog
posthog.capture('event', {
  hashed_tenant_id: hashIdentifier(tenantId),
  hashed_user_id: hashIdentifier(userId)
});
```

## Regex Redaction

For phone numbers with special characters:

```typescript
// Use lookarounds for parenthesized formats
const phoneRegex = /(?:\+?1[-.\s]?)?(\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
```

⚠️ `\b` is insufficient for formats with special characters.

## Custom Span Redaction

Never spread class instances:

```typescript
// BAD: Breaks internal methods
const redacted = { ...span };

// GOOD: In-place modification
span.setAttribute('user.id', hashIdentifier(userId));
```

## Feature Flag Fallback

Fail-closed when service unreachable:

```typescript
const flags = await posthog.loadFeatureFlags({ 
  fallback: { rioEnabled: false } 
});
```

---

## Related

- [pii-handling](./pii-handling.md)