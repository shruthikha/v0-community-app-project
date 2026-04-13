---
title: Security Posture
---

# Security Posture

Security posture is the combined state of auth, authorization, RLS, logging, rate limiting, and data handling across the platform.

## What good looks like

- Service-role access is tightly controlled.
- Tenant isolation is enforced in the database.
- Logs avoid PII.
- Abuse-prone flows are rate limited.
- Validation happens before side effects.

## Related

- `knowledge/wiki/patterns/security-patterns.md`
- `knowledge/wiki/tools/supabase-security-checklist.md`
- `knowledge/wiki/lessons/pii-log-redaction.md`