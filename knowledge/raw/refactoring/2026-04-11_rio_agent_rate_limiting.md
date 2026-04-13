---
title: Add rate limiting to Rio Agent API endpoints
status: open
created: 2026-04-11
updated: 2026-04-11
priority: medium
category: security
author: investigator/audit
---

# Add rate limiting to Rio Agent API endpoints

## Finding
The /chat endpoint in src/index.ts uses simple API key comparison with strict equality. There is no rate limiting protection against abuse, brute force attempts, or DoS attacks.

## Files
- packages/rio-agent/src/index.ts

## Recommendation
Implement rate limiting middleware (e.g., using @upstash/ratelimit or Redis-based solution) for /chat, /ingest, and /memories endpoints. Consider:
- Per-tenant rate limits
- Per-user rate limits
- Sliding window vs fixed window
- Different limits for read vs write operations

## Status
**Open** - No rate limiting currently in place. This is a security gap that should be addressed to prevent API abuse.