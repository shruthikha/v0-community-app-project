---
title: Supabase MCP token exposure in opencode.json
status: open
created: 2026-04-14
updated: 2026-04-14
effort: small
category: security
module: opencode.json
---

# Supabase MCP Token Exposure in opencode.json

## Finding

The opencode.json configuration file contains a hardcoded Supabase MCP token in the `supabase` configuration:

```json
"supabase": {
  "type": "remote",
  "url": "https://mcp.supabase.com/mcp",
  "headers": {
    "Authorization": "Bearer sbp_69671744aca25750d5dcb02fcc5a27da4bdf1597"
  }
}
```

This token was flagged in CodeRabbit PR #327 as a security concern. While the token appears to be a publishable key (starts with `sbp_`), it should not be committed to the repository.

## Files
- `opencode.json`

## Suggested fix

Replace the hardcoded token with OAuth configuration or environment variable:

```json
"supabase": {
  "type": "remote",
  "url": "https://mcp.supabase.com/mcp",
  "oauth": {}
}
```

Or use an environment variable:
```json
"supabase": {
  "type": "remote", 
  "url": "https://mcp.supabase.com/mcp",
  "headers": {
    "Authorization": "Bearer ${SUPABASE_MCP_TOKEN}"
  }
}
```

## Notes

- This is a pre-existing issue, not introduced in PR #327
- The token appears to be a publishable key (sbp_ prefix), but should still not be committed
- CodeRabbit flagged this as Critical severity
