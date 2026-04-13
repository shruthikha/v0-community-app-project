---
title: Create root .env.example with all required variables
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: security
module: root
---

# Create root .env.example with all required variables

## Finding
No `.env.example` exists at the project root. The only example file is `packages/rio-agent/.env.example` which is incomplete. New developers and CI/CD pipelines have no reference for required environment variables.

## Files
- `.env.example` (create)

## Suggested fix
Create `.env.example` documenting all 28+ env vars with descriptions, example values, and clear markers for which are secrets vs public. Include comments explaining dev vs prod key separation.
