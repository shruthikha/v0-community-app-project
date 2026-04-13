---
source: lessons_learned
imported_date: 2026-04-08
---

# Lesson: Feature Flags Must Fail Closed

## The Gotcha

Feature flag lookup for `access_requests_enabled` defaulted to `true` on any error. Database outage or permission error would silently enable the feature for all tenants.

## Pattern

```typescript
// ✅ CORRECT: Fail closed
const isEnabled = await db.query(`
  SELECT value FROM feature_flags 
  WHERE name = $1 AND tenant_id = $2
`).catch(() => null);

if (isEnabled !== 'true') {
  return { enabled: false }; // Default to disabled
}

// ❌ WRONG: Fail open
const isEnabled = featureFlag ?? true;
```

Rule: Feature flags must **fail closed** (deny) on unexpected errors. Default should be `false`.