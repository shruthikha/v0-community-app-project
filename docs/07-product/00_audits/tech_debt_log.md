# Tech Debt Log

Technical debt discovered during documentation and development. Review periodically to create issues and plan remediation.

| Date | Source | Description | Severity | File(s) | Issue # |
|---|---|---|---|---|---|
| 2026-02-22 | /document | [DONE] Missing RLS policy and API documentation for announcements table and actions | Med | `app/actions/announcements.ts`, `supabase/migrations/` | #130 |
| 2026-03-31 | Code Review | Shared Pool Shutdown: Utility script calls `pool.end()` on a shared singleton, potentially crashing the app if imported. | High | `packages/rio-agent/test-db.ts` | #266 |
| 2026-03-31 | Code Review | Aggressive Connection Termination: Missing time-based staleness filter in zombie connection cleanup could kill legitimate pool connections. | Med | `packages/rio-agent/test-db.ts` | #266 |
| 2026-03-31 | Code Review | ESM Import Timing: `dotenv.config()` called after static imports in test scripts, causing env var lookup failures in children at load time. | High | `packages/rio-agent/test-ingest.ts`, `test-db.ts` | #266 |
| 2026-03-31 | Code Review | Silent Failure Exits: Test scripts returning 0 success code on internal Supabase/RPC/Mastra failures by using `return` instead of `throw`. | Low | `packages/rio-agent/test-ingest.ts` | #266 |
