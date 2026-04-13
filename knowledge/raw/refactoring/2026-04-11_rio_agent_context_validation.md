---
title: Validate x-resident-context Base64 input
status: open
created: 2026-04-11
updated: 2026-04-11
priority: medium
category: security
author: investigator/audit
---

# Validate x-resident-context Base64 input

## Finding
In src/index.ts, the x-resident-context header is decoded from Base64 to UTF-8 without any schema validation. This could allow injection of malicious content into the system prompt.

```typescript
const residentContextRaw = c.req.header("x-resident-context");
const residentContext = residentContextRaw ? Buffer.from(residentContextRaw, 'base64').toString('utf-8') : '';
```

## Files
- packages/rio-agent/src/index.ts (line ~240)

## Recommendation
Add schema validation (Zod) for the decoded resident context to ensure it matches expected structure before injecting into the system prompt. Alternatively, use a more structured format (JSON) with validation.

## Status
**Open** - Decoding happens without validation.