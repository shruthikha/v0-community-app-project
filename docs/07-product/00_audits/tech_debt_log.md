# Tech Debt Log

Technical debt discovered during documentation and development. Review periodically to create issues and plan remediation.

| Date | Source | Description | Severity | File(s) | Issue # |
|---|---|---|---|---|---|
| 2026-02-22 | /document | [DONE] Missing RLS policy and API documentation for announcements table and actions | Med | `app/actions/announcements.ts`, `supabase/migrations/` | #130 |
| 2026-03-31 | Code Review | Shared Pool Shutdown: Utility script calls `pool.end()` on a shared singleton, potentially crashing the app if imported. | High | `packages/rio-agent/test-db.ts` | #266 |
| 2026-03-31 | Code Review | Aggressive Connection Termination: Missing time-based staleness filter in zombie connection cleanup could kill legitimate pool connections. | Med | `packages/rio-agent/test-db.ts` | #266 |
| 2026-03-31 | Code Review | ESM Import Timing: `dotenv.config()` called after static imports in test scripts, causing env var lookup failures in children at load time. | High | `packages/rio-agent/test-ingest.ts`, `test-db.ts` | #266 |
| 2026-03-31 | Code Review | Silent Failure Exits: Test scripts returning 0 success code on internal Supabase/RPC/Mastra failures by using `return` instead of `throw`. | Low | `packages/rio-agent/test-ingest.ts` | #266 |
| 2026-03-31 | /document | Missing technical documentation for `documents`, `document_reads`, and their relationship with `rio_documents` for AI indexing. | Med | `app/actions/documents.ts`, `supabase/migrations/` | #DocumentGap |
| 2026-03-31 | /document | RLS policies for `documents` table need rigorous verification and explicit documentation to prevent cross-tenant leakage. | High | `supabase/migrations/` | #SecurityGap |
| 2026-04-05 | /document | Missing Admin Check-in Registry: No dedicated page exists for admins to monitor active check-ins or bulk-manage them. | Med | `app/t/[slug]/admin/events` | #TechDebt |
| 2026-04-05 | /document | RSVP Logic Duplication: Nearly identical RSVP handling exists for both events and check-ins across multiple tables/actions. | Low | `app/actions/events.ts`, `app/actions/check-ins.ts` | #Refactor |
| 2026-04-05 | /document | Ephemeral Data Persistence: Expired check-ins are filtered out of the UI but persist indefinitely in the database. | Med | `lib/data/check-ins.ts` | #Cleanup |
| 2026-04-05 | Rio Agent | Missing strict coupling between `mastra_resources` and `documents` table (pre-source_document_id migration). | Med | `supabase/migrations/` | #Hardened |
| 2026-04-05 | Rio Agent | Manual "Ghost Memory" redaction logic in `thread-store.ts` duplicates logic outside of core Mastra agent. | Low | `packages/rio-agent/src/lib/thread-store.ts` | #Refactor |
| 2026-04-05 | /document | Missing Batch Update: Moving a family requires updating Lot ID for each member individually. | Med | `app/actions/family.ts` | #BatchDebt |
| 2026-04-05 | Rio Agent | RLS Connection Affinity: `pool.query` can lose tenant context between different pool clients. | High | `packages/rio-agent/src/index.ts` | #RLSAffinity |
| 2026-04-05 | Rio Agent | Missing "Global Kill-Switch": No single toggle exists to opt-out of Río data ingestion entirely. | Med | `privacy_settings` | #PrivacyDebt |
| 2026-04-05 | Rio Agent | Zombie Vector Data: Deleted threads can leave orphaned chunks in the vector store ("Ghost Memory"). | Med | `thread-store.ts` | #GhostMemory |
| 2026-04-05 | /document | Admin Exchange 404s and Missing Fields: Categories/Create buttons 404; missing return dates; notification flow gaps. | Med | `app/t/[slug]/admin/exchange/page.tsx` | #TechDebt |
| 2026-04-05 | /document | Exchange Notification Logic: Complex logic for "Item picked up" notification in `exchange-transactions.ts` could be simplified/centralized. | Low | `app/actions/exchange-transactions.ts` | #Refactor |
| 2026-04-05 | /document | `admin_internal_notes` is a UI/DB placeholder with no functional implementation or dedicated security review for its lifecycle. | Med | `app/actions/resident-requests.ts`, `types/requests.ts` | #TechDebt |
| 2026-04-05 | /document | Manual path revalidation in `resident-requests.ts` is inconsistent across different status update and comment paths. | Low | `app/actions/resident-requests.ts` | #Refactor |
| 2026-04-05 | /document | `NotificationType` enum has duplicate entries for `exchange_request_cancelled`. | Med | `types/notifications.ts` | #Refactor |
| 2026-04-05 | /document | `generateActionUrl` is inconsistent, mostly pointing to the main notifications page rather than deep contextual links. | Low | `lib/notification-utils.ts` | #Refactor |
| 2026-04-05 | /document | Lack of a centralized Registry for adding new notification triggers leads to ad-hoc implementation in various server actions. | Med | `app/actions/notifications.ts` | #ArchitectureGap |
| 2026-04-05 | /document | **Resident Dashboard**: Sorting logic in `/api/dashboard/priority` is hardcoded tiered scoring. Should be data-driven. | Med | `/api/dashboard/priority/route.ts` | #Refactor |
| 2026-04-05 | /document | **Resident Dashboard**: `active_checkins_count` stat calculates in-memory. Potential scaling bottleneck. | Low | `/api/dashboard/stats/route.ts` | #Performance |
| 2026-04-05 | /document | **Resident Dashboard**: Mixed data-fetching (SWR vs Server Props) leads to inconsistent loading states across widgets. | Med | `app/t/[slug]/dashboard/page.tsx` | #UXInconsistency |
| 2026-04-06 | Code Review | Memory Redaction Gap: `redactHistoricalFact()` fails to scrub `rio_messages`, only targeting `mastra_messages`. | Med | `packages/rio-agent/src/lib/forget-utils.ts` | #PrivacyGap |
| 2026-04-06 | Code Review | RAG Privacy Filtering: `search_documents` tool lacks document-level privacy filtering (missing `is_private` check). | High | `packages/rio-agent/src/agents/rio-agent.ts` | #SecurityGap |
| 2026-04-06 | Code Review | TypeScript Schema Mismatch: `users.email` and `family_units.primary_contact_id` nullability in `types/supabase.ts` is outdated. | Low | `types/supabase.ts` | #TypeDivergence |
