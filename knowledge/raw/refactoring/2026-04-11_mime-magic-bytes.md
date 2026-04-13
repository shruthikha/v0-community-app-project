---
title: MIME validation relies on client-controlled file.type
status: open
created: 2026-04-11
updated: 2026-04-11
effort: medium
category: security
module: lib/upload-security.ts
---

# MIME validation relies on client-controlled file.type

## Finding
`validateFileType()` only checks `file.type` which is set by the browser and trivially spoofed. A malicious actor can upload an executable with `Content-Type: image/jpeg`.

## Files
- `lib/upload-security.ts` (line 15-22)
- `app/api/upload/route.ts` (line 19-24)

## Suggested fix
Add magic byte / file signature validation. Check first bytes of file content match claimed MIME type. Consider using `file-type` library for comprehensive detection.

## Related
- GitHub Issue: #299
- Audit: `knowledge/raw/audits/audit_2026-04-11_upload-api.md` (Finding H2)
