# Lessons Learned & "Gotchas"

## Supabase / PostgreSQL

### 1. Migrating Auth Users (Preserving UIDs)
**Context:** When moving users from Production to Development (or Staging), you must preserve their `auth.users.id` (UUID) because `public` tables (like `profiles`, `users`) reference this ID as a Foreign Key.

**The Gotcha:**
Using the Supabase Python SDK (or GoTrue API), `admin.create_user()` logic is strict:
- If you pass `uid="..."`, it **IGNORES** it and generates a random new UUID.
- You **MUST** pass `id="..."` to force the specific UUID.

**Incorrect (Generates Random ID):**
```python
supabase.auth.admin.create_user({
    "uid": "a3b2...", # IGNORED
    "email": "..."
})
```

**Correct (Preserves ID):**
```python
supabase.auth.admin.create_user({
    "id": "a3b2...", # RESPECTED
    "email": "..."
})
```
**Impact:** If missed, the User logs in successfully (new ID), but queries to `public.users` fail (RLS blocks access) because the authenticated ID doesn't match the existing foreign key record.

### 5. Testing Supabase Clients in Vitest
**Context:** Supabase JS client v2 returns a "thenable" object (Promise-like) from `createServerClient`.
**The Gotcha:**
- If you mock the client itself as "thenable" (having a `.then` method), `await createServerClient()` will try to resolve it immediately during initialization.
- If you mock chained methods like `.from().select()` by returning `this`, the client itself becomes the query builder.
- **Pattern:** Always separate the `client` (not thenable) from the `queryBuilder` (thenable) in your mocks. Use `vi.hoisted` to ensure the mock factory runs before imports.

## GeoJSON & Map Data

### 2. DB Constraints vs UI Options
**Context:** When using strict Postgres `CHECK` constraints (e.g., `valid_path_surface`), the Frontend validation/options must be _identical_ to the DB allowed values.
**The Gotcha:**
- DB had `CHECK (path_surface IN ('paved', 'natural', ...))`
- UI had "Mixed" option.
- Result: Silent 500 errors on save.
**Pattern:** Always check `information_schema.check_constraints` when adding new dropdowns.

### 3. Server Action Types for Legacy Schema
**Context:** Some legacy columns might be `text` even if they store numbers (e.g., `path_length` as "1200").
**The Gotcha:**
- Client sends `number` (1200).
- Server Action typed as `number`.
- DB insertion fails or requires cast if ORM is strict.
**Pattern:** Server Action input types should be loose (`string | number`) to accept client data, then explicitly cast/validate before DB insertion.

### 4. Next.js Cache Invalidation for Admin Dashboards
**Context:** Next.js App Router aggressively caches GET requests.
**The Gotcha:** Admin makes a change -> Refresh -> Old data shows.
**Pattern:** For "Live" dashboards, always explicitly set `export const dynamic = 'force-dynamic'` or use `revalidatePath` on the Server Action.

### 6. Mobile Wrapper Div Misalignment (Issue #69)
**Context:** Tab alignment fix (`grid-cols-3`) worked on desktop but was invisible on mobile.
**The Gotcha:** The `TabsList` was wrapped in an extra `<div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">` that the search bar above it did not have. On mobile, this created a different layout context (scroll container + negative margin), causing the grid to not fill width properly despite `w-full` being set.
**Pattern:** When two UI elements must visually align (e.g., search bar + tabs), they **must** share the same wrapper structure. Never add mobile-specific wrappers (`-mx-*`, `overflow-x-auto`, `no-scrollbar`) to only one of them.
**Debugging Tip:** When a Tailwind fix works on desktop but not mobile, run `tailwind-merge` output through `node -e` to verify class resolution, then check the **wrapper divs** for mobile-only classes.

### [2026-02-16] Middleware Session Grace Period (Issue #108)
**Type**: Pattern
**Context**: Middleware checks `last-active` cookie to enforce inactivity timeouts.
**The Gotcha**: Upon a fresh login, the browser sends the request *before* the `last-active` cookie is set/propagated, causing the middleware to see "No Cookie" -> "Inactive" -> "Logout", triggering a loop or double-login friction.
**Pattern**: Trusted **Grace Period**.
Use `user.last_sign_in_at` (from Supabase Auth, the source of truth) to detect if the session is brand new (< 60s). If so, bypass the cookie check.
**Rule**: Never rely solely on client-side cookies for "Am I active?" checks during the login transition state. always have a server-side baked-in grace period.

### [2026-02-22] DB Constraints vs Typescript Schema (Issue #113)
**Type**: Pattern
**Context**: Database enums restrictions must be mapped strictly to typescript logic, notably for empty states.
**The Gotcha**: A Check Constraint allows `null` but the API/Form submits Empty String `""`. Typescript allows union `"" | null` but the DB constraint fails on `""`.
**Pattern**: Explicit Fallback Mapping.
When handling constrained DB fields with optional/empty selections on the frontend, explicitly scrub and cast empty strings back to `null` in the Server Action before db submission to prevent Postgres Check Constraint Violations.

### [2026-02-23] Route Handler Redirect Hostname Mismatch (Issue #70)
**Type**: Gotcha
**Context**: Password reset auth exchange in a Route Handler used `new URL(path, request.url)` to build the redirect URL.
**The Gotcha**: Next.js 16 with `-H 0.0.0.0` sets `request.url` hostname to `0.0.0.0`, but the browser connects via `localhost`. Cookies set on the `0.0.0.0` response are NOT sent to `localhost` on the redirect — the browser treats them as different hosts.
**Pattern**: Always use the `Host` header from the request to construct redirect URLs in Route Handlers. Never rely on `request.url` for the hostname.
```typescript
const host = request.headers.get("x-forwarded-host") || request.headers.get("host")
const protocol = request.headers.get("x-forwarded-proto") || "http"
const origin = `${protocol}://${host}`
return NextResponse.redirect(new URL("/target", origin))
```

### [2026-02-23] Supabase Strips Query Params from `redirect_to` (Issue #70)
**Type**: Gotcha
**Context**: Password reset flow passed tenant context via `?next=/t/slug/update-password` in the `redirect_to` URL.
**The Gotcha**: Supabase's own redirect chain silently strips query parameters from the `redirect_to` URL. The `?next=...` param was lost.
**Pattern**: Encode contextual data in the URL **path** (e.g., `/auth/confirm/tenant-slug`) not as query parameters. Use dynamic route segments (`[slug]`) to extract them.

### [2026-03-01] Rate-Limit Double Execution (Issue #99)
**Type**: Gotcha
**Context**: `withPublicRateLimit` middleware wrapped rate-limit + handler in a single try/catch, with handler called again in the catch for "fail open" behavior.
**The Gotcha**: If the handler itself throws (e.g., DB insert fails), the catch block calls the handler a second time, causing duplicate side effects (double inserts, double emails).
**Pattern**: Narrow try/catch to infrastructure code only. Handler execution must happen exactly once, outside the catch block. Rate-limit failures fail open (skip limiting), but handler errors propagate normally.

### [2026-03-01] PII in URL Query Parameters (Issue #99)
**Type**: Anti-Pattern
**Context**: Approve button passed `?first_name=X&email=Y` to pre-populate the create-resident form.
**The Gotcha**: URL query params are stored in browser history, appear in server access logs, analytics dashboards, and `Referer` headers sent to third parties. This creates persistent PII exposure that's difficult to remediate.
**Pattern**: Pass only opaque identifiers (e.g., `?from_request=uuid`) in URLs. Fetch associated PII server-side using the ID. This keeps PII out of browser history, logs, and analytics.

### [2026-03-01] Zod `.trim()` Must Precede Validators (Issue #99)
**Type**: Gotcha
**Context**: Zod schema for access requests used `.min(1, 'Required').transform(val => val.trim())`.
**The Gotcha**: `.transform()` runs after all validators. A whitespace-only string `"   "` passes `.min(1)` (length 3), then becomes `""` after transform — the validation is already passed.
**Pattern**: Use Zod's built-in `.trim()` preprocessor before validators: `z.string().trim().min(1)`. This ensures normalization happens before length/format checks.

### [2026-03-01] Fail-Closed Feature Flags (Issue #99)
**Type**: Pattern
**Context**: `access_requests_enabled` feature flag defaulted to `true` on any query error.
**The Gotcha**: A database outage, permission error, or misconfiguration would silently enable the feature for all tenants — exposing an unauthenticated public form that shouldn't be active.
**Pattern**: Feature flags must default to `false` (deny) on unexpected errors. Only fail open for known graceful conditions (e.g., column missing pre-migration). Initialize flag as `false`, then set to `true` only after a confirmed successful query.

### [2026-03-08] Wizard Logic Parity (Issue #100)
**Context**: Onboarding flows often have a standalone form (e.g., `/onboarding/interests`) and a multi-step Wizard modal (e.g., `/onboarding/profile`).
**The Gotcha**: Updating only one of these paths leads to a broken experience for users taking the other path.
**Lesson**: Always verify if a feature has multiple entry points (Wizards, Modals, Standalone Pages). A "Quick Fix" on one file might miss the same logic duplicated in a component like `RootsStep.tsx`.

### [2026-03-08] Scoped RLS for Link Tables (Issue #100)
**Context**: Tables that link users to global entities (e.g., `user_interests`).
**The Gotcha**: Using a blanket `FOR ALL USING (true)` policy allows any user to delete or insert links for **any other user** if they can guess the IDs.
**Lesson**: Harden link tables with user-scoped `INSERT` and `DELETE` policies.
```sql
-- ❌ WRONG (blanket access)
CREATE POLICY "Users manage links" ON table FOR ALL USING (true);

-- ✅ CORRECT (scoped access)
CREATE POLICY "Users insert own links" ON table FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own links" ON table FOR DELETE USING (auth.uid() = user_id);
```
### [2026-03-08] Backend-First Auth for Social Interactions (Issue #64)
**Type**: Pattern
**Context**: Implementing a comment system where residents can interact on public requests.
**The Gotcha**: RLS policies for "Residents can see comments ON requests they can see" become recursive or complex to debug when joined with creator/admin permissions.
**Lesson**: For multi-participant social features, favor **Backend-First** authorization in Server Actions using the `service_role` (admin) client. Perform explicit, manual auth checks in the action logic. This simplifies debugging, improves performance by bypassing RLS overhead, and keeps security rules centralized in code rather than split between SQL and Typescript.

### [2026-03-08] Opaque IDs vs Metadata for Actions (Issue #64)
**Type**: Pattern
**Context**: Reopening requests or marking statuses.
**The Gotcha**: Passing the entire request object to a status-update action.
**Lesson**: Keep actions focused on **Opaque IDs** (`requestId`). Always re-fetch the target entity server-side using the ID to ensure the most current state and permissions are checked immediately before the modification. Do not trust state passed from the client for critical auth/status transitions.

### [2026-03-09] React Functional Updaters & Side-Effects (Issue #109)
**Type**: Anti-Pattern
**Context**: Firing auto-save queries seamlessly when an item is toggled.
**The Gotcha**: Putting an async side-effect `triggerAutoSave()` inside a React state functional updater `setSelected(prev => { triggerAutoSave(); return newSelected; })`. React often calls updater functions during render (or multiple times in StrictMode), which triggers the "Cannot update a component while rendering a different component" crash limit.
**Lesson**: Compute the next state outside of the functional updater and call the generic setter `setSelected(newSelected)`, then fire the side-effect synchronously below it. Functional updaters must be 100% pure functions.

### [2026-03-12] Tab-Based Feature Migration (Issue #141)
**Type**: Gotcha
**Context**: Re-routing features (Announcements) into tabs on a unified page.
**The Gotcha**: Hardcoded links in secondary UI components (widgets, notifications) often point to the old route, leading to 404s even if the feature itself is working.
**Lesson**: When consolidating routes, perform a global search for the old route strings. Navigate to the new unified route using search parameters (e.g., `?tab=announcements`) and ensure the state is correctly initialized on the target page.
### [2026-03-14] Supabase Transaction Pooler vs Direct Connection (Issue #167)
**Type**: Gotcha
**Context**: Local development server connecting to a remote Supabase instance.
**The Gotcha**: The regular PostgreSQL connection host (e.g., `db.xxx.supabase.co`) often fails to resolve via `getaddrinfo ENOTFOUND` on standard residential or VPN-protected network configurations.
**Pattern**: Use the **Transaction Pooler** URI (port `6543`) for local development connectivity to remote Supabase DBs. It uses a stable hostname (`aws-1-us-east-1.pooler.supabase.com`) that resolves more reliably across diverse network environments.

### [2026-03-14] Mastra core vs @mastra/memory Extracts (Issue #167)
**Type**: Gotcha
**Context**: Upgrading or scaffolding Mastra components.
**The Gotcha**: The abstract `MastraMemory` class is in `@mastra/core/memory`, but the concrete `Memory` class (required for instantiation) is frequently moved to a standalone `@mastra/memory` package. Attempting to import `Memory` from `@mastra/core` will result in a lint error: `Module '@mastra/core/memory' has no exported member 'Memory'`.
**Lesson**: Always install `@mastra/memory` separately when using persistent agents, and verify the package exports if an expected class is missing from the core.

### [2026-03-15] Nixpacks Deterministic Builds (Issue #167)
**Type**: Gotcha
**Context**: Deploying Node.js applications to PaaS providers (like Railway) using Nixpacks.
**The Gotcha**: The default Nixpacks `install` phase often uses `npm install`, which can mutate the `package-lock.json` and pull in newer minor/patch versions of nested dependencies, causing unexpected build or runtime failures that are hard to reproduce locally.
**Lesson**: Always override the install command in `nixpacks.toml` to use `npm ci` for deterministic, reproducible builds.

### [2026-03-15] PaaS Environment Variable Collisions (Issue #167)
**Type**: Anti-Pattern
**Context**: Connecting a service to a remote Supabase instance while using PaaS addons (e.g., attach Postgres DB).
**The Gotcha**: When using generic names like `DATABASE_URL`, PaaS providers often automatically inject or override these variables with internal connection strings, silently breaking your remote DB connection.
**Lesson**: Namespace critical environment variables (e.g., `RIO_DATABASE_URL`) to prevent PaaS auto-injections from shadowing your explicit configurations.

### [2026-03-15] Fail-Fast Service Initialization (Issue #167)
**Type**: Pattern
**Context**: Initializing LLMs or third-party SDKs using environment variables (`OPENROUTER_API_KEY`).
**The Gotcha**: Using default fallback values (e.g., `process.env.OPENROUTER_API_KEY ?? "stub-key"`) masks missing configurations. In production, this leads to confusing, delayed downstream errors when the service attempts to make an API call.
**Lesson**: Fail fast on startup. Use a `requireEnv()` helper that validates the presence of critical secrets and explicitly throws if they are missing in production.

### [2026-03-15] SSE Content-Type Mismatch (Issue #167)
**Type**: Gotcha
**Context**: Implementing Server-Sent Events (SSE) streaming endpoints using web frameworks like Fastify or Hono.
**The Gotcha**: Standard text streaming helpers (e.g., `streamText` in Hono) set the `Content-Type` to `text/plain`. While the stream works technically, standard SSE clients expect and mandate `text/event-stream`.
**Lesson**: Always use the framework's dedicated SSE helper (e.g., `streamSSE` in Hono) or explicitly set the `Content-Type: text/event-stream` header with `Cache-Control: no-cache` and `Connection: keep-alive` to satisfy client contracts.
### [2026-03-15] Vercel AI SDK SSE Transformation (Issue #168)
**Type**: Pattern
**Context**: Proxying a Mastra (or other) SSE stream to a Vercel AI SDK `useChat` client.
**The Gotcha**: The `DefaultChatTransport` in the Vercel AI SDK expects SSE chunks matching the `uiMessageChunkSchema` (e.g., `data: {"type": "text-delta", "delta": "..."}`). Simple token streams or mismatched JSON structures will cause `AI_UIMessageStreamError` (missing text part) or failed rendering.
**Pattern**: Explicit Stream Transformation.
In the BFF (Next.js), implement a `TransformStream` that:
1. Buffers incoming bytes to handle split SSE envelopes.
2. Identifies the start of a new message part and emits a `text-start` event with a unique ID.
3. Maps the source token (e.g., `data.token`) to the `text-delta` event structure with the same message ID.
4. Corrects internal format to matching `data: { ... }\n\n` specification.

### [2026-03-15] Mastra v1.x stream() vs fullStream (Issue #168)
**Type**: Gotcha
**Context**: Using Mastra v1.x `Agent.stream()` in a server environment.
**The Gotcha**: In v1.x, `agent.stream()` returns a `MastraModelOutput` object. While it has a `.fullStream` property, using `.textStream` is preferred for clean token proxying. Also, memory options have migrated from positional string arguments to a nested `memory: { thread: string, resource: string }` object.
**Pattern**: Use `.textStream` for simple proxying and the new `memory` object structure to ensure conversation persistence works as expected.
### [2026-03-18] Frontend Cache as Security Confusion (Issue #169)
**Type**: Gotcha
**Context**: Testing multi-user isolation on a shared browser using a simple test page that caches `threadId` in `localStorage`.
**The Gotcha**: If the `localStorage` key is only scoped by `tenantId`, switching users on the same browser causes the new user to accidentally "inherit" the previous user's `threadId`. The backend (correctly) throws a `403 Forbidden`, which can be confusing without a "Clear Chat" or "Reset Session" mechanism.
**Pattern**: Scope local persistence keys by `user_id` AND `tenant_id`, and always provide a manual "Reset" button for testing/debugging.

### [2026-03-18] Backend-First Thread Store Abstraction (Issue #169)
**Type**: Pattern
**Context**: Enforcing multi-tenant and multi-user isolation for AI conversations.
**Pattern**: Use a dedicated `ThreadStore` abstraction that wraps the low-level framework memory. This abstraction should:
1. **Namespace IDs**: Prefix client-provided IDs with `tenantId` before saving to the DB.
2. **Metadata Validation**: Store `tenantId` and `userId` in thread metadata and verify these during *every* retrieval to prevent horizontal (tenant) and vertical (user) leakage.

### [2026-03-18] Resident-Level Thread Isolation (Issue #169)
**Type**: Rule
**Context**: Determining if residents within the same tenant should share threads.
**Rule**: In community-based assistants, AI threads MUST be resident-specific. Never allow one resident to access another's conversation history unless it is a explicitly designed as a "Community Channel" tool. backend-first authorization must enforce `auth.uid()` checks on the thread metadata.

### [2026-03-18] PgVector Strict Schema Management (Issue #170)
**Type**: Gotcha
**Context**: Using `PgVector` from `@mastra/pg` with a custom table.
**The Gotcha**: `PgVector` expects an internal table schema (`vector_id`, `embedding`, `metadata`). If you create a custom table with different column names (e.g., `id`, `tenant_id`, `content`), the `query()` and `upsert()` methods will fail with `column "vector_id" does not exist`. 
**Pattern**: Let Mastra manage the vector table via `indexName`. Store application-specific fields (tenant_id, content) inside the `metadata` JSONB column and use metadata filtering in your queries.

### [2026-03-18] Embedding Dimension Truncation (Issue #170)
**Type**: Pattern
**Context**: Using `gemini-embedding-001` with a database column defined as `vector(1536)`.
**The Gotcha**: `gemini-embedding-001` returns 3072 dimensions by default. Attempting to insert these into a 1536-dim column results in a Postgres error `expected 1536 dimensions, not 3072`.
**Pattern**: Explicitly truncate the embedding array using `.slice(0, 1536)` before insertion. Matryoshka Representation Learning (MRL) ensures that the prefix of the vector contains most of the semantic information.

### [2026-03-31] Environment URL Primacy (Railway vs Agent)
**Type**: Pattern / Gotcha
**Context**: Multi-environment deployments where `RIO_AGENT_URL` is used for local development and `RIO_RAILWAY_URL` is used for production.
**The Gotcha**: Some BFF routes were falling back to `RIO_AGENT_URL` (localhost) even in production if `RIO_RAILWAY_URL` was misconfigured or missing from the specific route's closure. This caused intermittent 500 errors or hung requests.
**Pattern**: **Centralized Configuration Helper**. Use a unified `getAgentBaseUrl()` helper that strictly prioritizes the production URL and throws a "Fail-Closed" error in production if no valid endpoint is resolved. This prevents accidental traffic routing to dead/dev-only local endpoints.

### [2026-03-31] AI SDK State-Lag & Stable Transport (Issue #266)
**Type**: Gotcha
**Context**: Using the Vercel AI SDK `useChat` hook with dynamic `threadId` updates.
**The Gotcha**: Even with a functional `body` property in `DefaultChatTransport`, React's asynchronous state update for `threadId` might not catch up before the `useChat` send trigger is fired. If the transport instance reference changes (via `useMemo` dependency), `useChat` might still be using the old reference with a stale closure.
**Pattern**: **Stable Transport + Direct Storage Lookup**.
1. Keep the `DefaultChatTransport` instance stable (memorize without `threadId` in dependencies).
2. In the `body` function, resolve the `threadId` directly from `localStorage` (`localStorage.getItem(key)`).
**Impact**: This ensures that the newly created server-side thread ID is used immediately, bypassing any React hydration or state propagation delays.

---
