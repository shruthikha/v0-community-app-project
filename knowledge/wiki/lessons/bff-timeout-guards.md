---
title: BFF Timeout Guards
description: Tiered timeout pattern with AbortController for AI proxies
categories: [performance, bff, reliability]
sources: [log_2026-03-22_st2_bff_timeout_guards.md]
---

# BFF Timeout Guards

## Tiered Timeout Pattern

```typescript
const controller = new AbortController();

// Tier 1: Connection timeout (15s) with single retry
const connectTimeout = setTimeout(() => controller.abort(), 15000);

// Tier 2: Overall request timeout (30s)
const overallTimeout = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch('/api/ai/chat', {
    signal: controller.signal,
    ...body
  });
} catch (error) {
  if (error.name === 'AbortError') {
    // Return "Busy" indicator to user
    return { error: 'Service busy, try again', status: 504 };
  }
}
```

## Key Patterns

### 1. AbortController Signal Sharing

The signal can be passed to nested fetches but inner timeouts must be managed carefully:

```typescript
// Inner timeout must NOT create new controller
// Use shared signal for retries
```

### 2. Retry Logic

Single retry on connection timeout:

```typescript
if (attempt === 0 && isTimeoutError) {
  attempt++;
  continue; // Retry once
}
```

### 3. User-Facing UX

Return 504 with clear message:

```json
{ "error": "Service is busy. Please try again." }
```

---

## Related

- [react-perf](../patterns/react-perf.md)