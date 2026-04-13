---
title: Redact PII from Logs
---

# Redact PII from Logs

Do not emit user identifiers, names, emails, or other personally identifiable information in debug logs or error messages.

## Why it matters

Logs are often retained longer than application data and may be accessible to more people or systems than the production database itself. PII in logs increases privacy risk and can violate data minimization practices.

## Pattern

- Replace raw IDs with hashes or opaque references.
- Keep error messages generic when they may surface user data.
- Remove debug logging before production release.
- Review server-side logs in data access and auth flows.

## Related files

- `knowledge/wiki/lessons/pii-handling.md`
- `knowledge/wiki/lessons/postHog-observability.md`
- `knowledge/wiki/patterns/security-patterns.md`

## Notes

This applies to AI chat logs, data-layer debugging, and any route that handles identity-related data.

## Audit Findings (2026-04-11)

### Scale of the Problem

| Area | Count | Severity |
|------|-------|----------|
| Supabase `error.message` leaked to clients | 80+ instances | HIGH |
| Console.log in map components | 42 statements | HIGH — logs resident names, IDs, coordinates |
| Debug console in `lib/` directory | 56+ statements | MEDIUM |
| Cron error responses with internal details | Multiple | HIGH — `details: String(error)` |
| Upload error messages leaking Supabase details | Multiple | MEDIUM |
| Announcement titles logged (potential PII) | Cron job | MEDIUM |

### Specific Patterns Found

```typescript
// ❌ Cron — leaks stack traces
return NextResponse.json({ error: "Failed", details: String(error) })

// ❌ Map — logs resident names
console.log('[LocationInfoCard] residents:', residents.map(r => `${r.first_name} ${r.last_name}`))

// ❌ Upload — leaks internal paths
return NextResponse.json({ error: error.message })
```

### Remediation Priority

1. **Cron endpoints** — Remove `details` field from all error responses
2. **Map components** — Remove all 42 console.log statements
3. **API routes** — Sanitize all 80+ error.message exposures
4. **Lib directory** — Remove 56+ debug console statements
5. **Upload endpoint** — Sanitize error responses

## Related

- `patterns/standardized-error-handling.md` — Error sanitization helper
- `lessons/pii-handling.md` — PII handling patterns
- `patterns/file-upload-security.md` — Upload error sanitization

## Audit Findings (2026-04-11)

### Scale of the Problem

| Area | Count | Severity |
|------|-------|----------|
| Supabase `error.message` leaked to clients | 80+ instances | HIGH |
| Console.log in map components | 42 statements | HIGH — logs resident names, IDs, coordinates |
| Debug console in `lib/` directory | 56+ statements | MEDIUM |
| Cron error responses with internal details | Multiple | HIGH — `details: String(error)` |
| Upload error messages leaking Supabase details | Multiple | MEDIUM |
| Announcement titles logged (potential PII) | Cron job | MEDIUM |

### Specific Patterns Found

```typescript
// ❌ Cron — leaks stack traces
return NextResponse.json({ error: "Failed", details: String(error) })

// ❌ Map — logs resident names
console.log('[LocationInfoCard] residents:', residents.map(r => `${r.first_name} ${r.last_name}`))

// ❌ Upload — leaks internal paths
return NextResponse.json({ error: error.message })
```

### Remediation Priority

1. **Cron endpoints** — Remove `details` field from all error responses
2. **Map components** — Remove all 42 console.log statements
3. **API routes** — Sanitize all 80+ error.message exposures
4. **Lib directory** — Remove 56+ debug console statements
5. **Upload endpoint** — Sanitize error responses

## Related

- `patterns/standardized-error-handling.md` — Error sanitization helper
- `lessons/pii-handling.md` — PII handling patterns
- `patterns/file-upload-security.md` — Upload error sanitization