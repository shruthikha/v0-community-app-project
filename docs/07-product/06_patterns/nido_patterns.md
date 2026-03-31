---
name: nido-patterns
description: Essential patterns and "gotchas" for the Nido codebase (Next.js, Supabase, Mapbox, TipTap).
skills: [react-patterns, nextjs-best-practices, database-design]
---

# Nido Project Patterns

> **Context**: Nido is a multi-tenant SaaS for community management.

## 1. Supabase & Multi-Tenancy

### Client-Side Access
ALWAYS use the typed client hook from `@/lib/supabase/client`.
```tsx
import { createClient } from '@/lib/supabase/client'

// Inside component
const supabase = createClient()
```

### Server-Side Access (Server Actions/Components)
Use `@/lib/supabase/server`.
```tsx
import { createClient } from '@/lib/supabase/server'

// Inside async component/action
const supabase = await createClient()
```

### RLS & Tenant Isolation
- **CRITICAL**: Every table has a `tenant_id` column.
- **NEVER** manually filter by `tenant_id` in queries if RLS is enabled (it should be), BUT...
- **ALWAYS** include `tenant_id` when **inserting** data.
```tsx
const { error } = await supabase.from('events').insert({
  ...data,
  tenant_id: tenantId // Mandatory
})
```

## 2. Mapbox Implementation

### Viewer Component
Primary map component: `components/map/MapboxViewer.tsx`
- Uses `react-map-gl`.
- Handles `locations` geojson data.

### Common Gotchas
- **Popup/Marker Z-Index**: Ensure markers don't overlap with the Mobile Dock (z-index issue).
- **Map Resize**: Always invalidate map size when a sidebar toggles.

## 3. TipTap Rich Text

### Content Sanitization
- We use `DOMPurify` before rendering content from TipTap.
- Utility: `lib/sanitize-html.ts`

### Editor Component
- Path: `components/ui/rich-text-editor.tsx`
- Tailwind prose class: `prose prose-stone dark:prose-invert`

## 4. Mobile Web / PWA optimization

### Mobile Dock (`components/ecovilla/navigation/mobile-dock.tsx`)
- Fixed at bottom.
- Ensure strict `pb-[80px]` (padding-bottom) on main page containers so content isn't hidden behind the dock.
- **Safe Area**: Check for `env(safe-area-inset-bottom)` support.

## 🧠 Collective Memory (Learnings)

### [2026-01-19] Postgres Views Security Bypass
**Type**: Gotcha
Standard Views run with the owner's privileges (usually admin), BYPASSING RLS on the underlying tables.
**Fix**: Always use `active_check_ins WITH (security_invoker = true)` to force RLS compliance for the querying user.

### [2026-01-19] Explicit RLS Enablement
**Type**: Gotcha
Creating a table in Supabase/Postgres does NOT enable RLS by default. It defaults to 'disabled', meaning public access (relying solely on application-level filtering).
**Fix**: You must explicitly run `ALTER TABLE x ENABLE ROW LEVEL SECURITY`.

### [2026-01-19] Public Storage Buckets
**Type**: Gotcha
A `public` bucket allows file access via URL without any authentication. `storage.objects` RLS policies (e.g., `bucket_id = 'documents'`) DO NOT protect public buckets from direct URL access.
**Fix**: Use Private buckets for sensitive docs (leases, IDs) and rely on Signed URLs or RLS-protected download endpoints.

### [2026-01-19] The Documentation Triad
**Type**: Pattern
Information must be strictly routed to ensure truthfulness:
1. **Work/Status** → **Jira** (Tickets)
2. **Strategy/Business** → **Google Docs** (Collaboration)
3. **Product Truth/Manuals/Specs** → **Codebase `docs/`** (Docusaurus)
*Never* mix these. Do not put "Plans" in Docusaurus or "Specs" in Google Docs.

### [2026-01-19] Design Truth Location
**Type**: Pattern
Design Principles and Tokens live in **`docs/03-design/`**.
Component Examples and visual testing live in **Storybook**.
Codebase `CODEBASE.md` links these two. There is no other source of design truth.

### [2026-01-19] No Custom Wrappers for UI Libs
**Type**: Anti-Pattern
**Context**: Found `Button.tsx` wrapping Shadcn's simple `cva` with a custom `getButtonStateClasses` logic.
**Problem**: This creates a non-standard abstraction layer ("The Nido Way" vs "The Shadcn Way") that breaks copy-paste compatibility and makes updates painful.
**Rule**: Use Shadcn components exactly as provided. Do not wrap them in "Design System" helper functions.

### [2026-01-19] Production Scaffolding Pollution
**Type**: Anti-Pattern
**Context**: Found `app/test-*` folders committed to the repo.
**Problem**: These create active public routes (e.g. `yoursite.com/test-utils`) that likely contain unoptimized or insecure code.
**Rule**: Playground code goes in `_playground/` (which Next.js ignores) or `stories/`. Never in `app/`.

### [2026-01-19] Client Component Overuse
**Type**: Anti-Pattern
**Context**: 343 files using `"use client"`.
**Problem**: This indicates we are building a Single Page App (SPA) inside the App Router, negating Server Component performance benefits.
**Rule**: Move `"use client"` down to the leaves (buttons, inputs). Do not wrap entire pages or layouts unless they use Context Providers found only in the client.

### [2026-01-19] The dangerousSetInnerHTML Trap
**Type**: Gotcha
**Context**: Found raw HTML rendering in `PriorityFeed.tsx` and `ExchangeListingDetailModal.tsx`.
**Problem**: This acts as an open door for XSS attacks if the content comes from user input (descriptions, comments), bypassing React's built-in escaping.
**Rule**: NEVER use `dangerouslySetInnerHTML` without `DOMPurify.sanitize(content)`.

### [2026-01-19] The Div-Button Trap
**Type**: Gotcha
**Context**: Found `div onClick={...}` used for main interactions in `PriorityFeed.tsx`.
**Problem**: This violates WCAG 2.1 Criteria 2.1.1 (Keyboard). Users cannot tab to it or activate it with Enter/Space, and screen readers treat it as text. Legal compliance failure.
**Fix**: Use `<button>` or `<div role="button" tabIndex={0} onKeyDown={handleKey}>` with proper styles.

### [2026-01-21] Mapbox Satellite Label Contrast
**Type**: Pattern
**Context**: Lot labels were illegible on Satellite view (variegated dark/light background).
**Problem**: Standard white or green text gets lost against complex satellite imagery.
**Fix**: Use **Dark Text** (`#111827`) with a **Thick White Halo** (`width: 2`). This high-contrast combination works on almost any background map style.

### [2026-01-21] Date Picker UTC Snapping
**Type**: Gotcha
**Context**: `RequestBorrowDialog` was saving dates as UTC midnight, causing them to appear as "Yesterday" in Western timezones (e.g., -6h).
**Problem**: Javascript generic `Date` objects often zero out time in UTC, which shifts the day when viewed in local time.
**Fix**: Explicitly handle local timezone rendering or strip time components safely before saving to ensure the calendar date remains stable.

### [2026-01-21] Jira API Group Visibility
**Type**: Gotcha
**Context**: Automated Jira comments failed with `GROUP_VISIBILITY_SETTING_NOT_ENABLED`.
**Problem**: The "Developers" group name is not standard across all Atlassian Cloud instances or may not have `comment` permissions enabled by default configuration.
**Fix**: Use `site-admins` for visibility restrictions or omit the `commentVisibility` parameter to default to internal/public based on project settings.

### [2026-01-21] Lender Self-Notification Pattern
**Type**: Pattern
**Context**: Lenders couldn't easily find the transaction to "Mark Returned" after confirming pickup because it disappeared from their actionable feed.
**Problem**: Bilateral actions (like Pickup) usually only notify the *other* party.
**Fix**: When an action enables a subsequent step (like "Mark Returned"), generate a **Self-Notification** for the actor. This bumps the item to the top of their feed, making the next step immediately accessible.

### [2026-01-21] Map Point Distribution Logic
**Type**: Pattern
**Context**: Multiple check-ins at the same "Community Hub" created overlapping markers that flickered (z-fighting) and were impossible to select individually.
**Problem**: Pins on exact same coordinates obscure each other.
**Fix**: Use a **Circular Distribution Algorithm** (Radius ~8m). If multiple points share coordinates, spread them out by calculating offsets: `lat + radius * cos(angle)`, `lng + radius * sin(angle)`. This ensures visibility without distorting the true location significantly.

### [2026-01-21] Native Migration Blockers
**Type**: Architectural Constraint
**Context**: Next.js Server Actions ("use server") and Radix UI ("shadcn") are functionally incompatible with React Native/Expo.
**Problem**: Client components importing server code cannot be bundled for native. HTML-based primitives (Radix) crash in Native View hierarchies.
**Strategy**: Native Migration is a **Rewrite**, not a Port. It requires a Monorepo with a shared business logic package, a dedicated API layer (tRPC/REST) to replace Server Actions for the native app, and a "Universal UI" library (NativeWind/Reusables) to replace Radix.

### [2026-01-26] Inventory Race Conditions
**Type**: Gotcha
**Context**: `confirmBorrowRequest` checked quantity (`SELECT`) then decremented it (`UPDATE`) in separate queries.
**Problem**: In high-concurrency (or malicious) scenarios, two requests can pass the check simultaneously, driving inventory negative (classic TOCTOU).
**Fix**: Use Atomic Updates. `UPDATE items SET quantity = quantity - 1 WHERE id = ? AND quantity > 0`. Never check-then-set in code for critical resources.

### [2026-01-26] Infinite Supply Logic Flaw
**Type**: Anti-Pattern
**Context**: Exchange logic restored inventory for *all* items upon "Pickup", assuming a cycle (Borrow -> Return).
**Problem**: Consumable or one-way items (Food, services) should *not* restore inventory. This created an infinite supply exploit.
**Fix**: Business logic must explicitly categorize inventory flow types (Cyclic vs. Linear) and handle state transitions accordingly.

### [2026-01-26] Tailwind Schizophrenia
**Type**: Gotcha
**Context**: Project used `tailwind.config.ts` (v3 format) while importing Tailwind v4 CSS.
**Problem**: v4 expects CSS-first configuration. Feeding it a legacy TS config forces compatibility mode, slowing builds and causing double-processing of utilities.
**Fix**: Migrate fully to v4. Move tokens to `globals.css` `@theme` block and delete `tailwind.config.ts`.

### [2026-01-26] The Mapbox Monolith
**Type**: Pattern
**Context**: `MapboxViewer` imported `react-map-gl` and `turf` directly in `app/`.
**Problem**: This bundles the entire GIS stack (800KB+) into the main entry chunk or layout bundle, slowing down pages that don't even show the map.
**Fix**: **MANDATORY**: Always lazy load heavy UI libs.
```tsx
const MapboxViewer = dynamic(() => import('./MapboxViewer'), { 
  ssr: false, 
  loading: () => <Skeleton /> 
})
```


### [2026-01-26] Unprotected Service Role Usage
**Type**: Anti-Pattern
**Context**: Found `/api/link-resident` using `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS, but verified NO user session or permissions.
**Problem**: This allows any anonymous user to trigger admin-level actions (data deletion, account takeover) just by guessing the endpoint.
**Rule**: NEVER use `service_role` in an API route without first verifying `supabase.auth.getUser()` AND checking the user's role (e.g. `is_tenant_admin`).

### [2026-01-26] The 'Ignore Build Errors' Trap
**Type**: Anti-Pattern
**Context**: `next.config.mjs` had `eslint: { ignoreDuringBuilds: true }` and `typescript: { ignoreBuildErrors: true }`.
**Problem**: This silences critical security warnings (like `dangerouslySetInnerHTML`) and type safety checks during deployment, allowing vulnerabilities to ship to production.
**Rule**: Never enable these flags in production. If the build fails, fix the code.

### [2026-01-26] The Zombie Toolchain
**Type**: Gotcha
**Context**: Project had Storybook, Chromatic, and Playwright installed but "sleeping" in the garage.
**Problem**: Tools without enforcement are just npm bloat.
**Learning**: World-class quality comes from *orchestration* (CI/CD enforcement), not just installation. If a tool is in `package.json`, it MUST run in CI.

### Empty States
- **Standard Component**: Always use `RioEmptyState` (from `@/components/dashboard/rio-empty-state`) for empty states in dashboard widgets and lists.
- **Visual**: Use the "Rio Confused" image (`rio_no_results_confused.png`).
- **Functionality**: Retain primary action buttons (e.g., "Create", "Browse") within the empty state to guide users.
- **Consistency**: Avoid manual implementations of empty states with custom images or layouts.

### User Interface
### [2026-02-06] Geolocation "Lazy Enable" Pattern
**Type**: Pattern
**Context**: Issue #86 (User Location Beacon).
**Problem**: Requesting location permissions on page load (useEffect) causes high rejection rates ("Permission Fatigue") and poor UX.
**Rule**: NEVER prompt for sensitive permissions (Location, Camera, Mic) on mount. ALWAYS require a user interaction (Click "Find Me") to trigger the permission prompt.
**Implementation**: Use a hook that monitors permission state but only triggers `navigator.geolocation.getCurrentPosition` inside an `enable()` function bound to a button handler.

### [2026-02-07] Event Bus Sync
**Type**: Pattern
**Context**: Issue #78 (RSVP Sync). Independent widgets (Priority Feed, Upcoming List) needed to share ephemeral state without a global store (Redux) or deep Context prop-drilling.
**Problem**: RSVPing in one widget left the others stale until a full page refresh or server revalidation (slow).
**Solution**: Use a lightweight, typed Custom Event Bus: `window.dispatchEvent(new CustomEvent('rio-sync', { detail: payload }))`.
**Rule**: Use only for **ephemeral, cross-widget UI state** (like optimistic updates). Do not use for critical business logic or data persistence. Always namespace events (e.g., `rio-series-rsvp-sync`).
**Cleanup**: MUST remove event listeners in `useEffect` return function to prevent memory leaks (`window.removeEventListener`).

### [2026-02-11] Mobile Wrapper Structural Parity
**Type**: Anti-Pattern
**Context**: Issue #69 (Tab Alignment). Tabs used `grid-cols-3 w-full` but were wrapped in a scroll container (`overflow-x-auto -mx-4 px-4`) that the adjacent search bar did not have.
**Problem**: On mobile, the extra wrapper created a different layout context. The negative margin shifted the container, and `overflow-x-auto` turned it into a scroll box that prevented the grid from expanding to full width. Fix appeared correct in code and production build CSS, but was invisible on mobile.
**Rule**: When UI elements must visually align, they MUST share the same wrapper structure. Never add mobile-specific wrappers (`-mx-*`, `overflow-x-auto`) to only one element in a group. If horizontal scrolling is needed, apply it consistently or use a shared component.
**Debugging**: Use `node -e "const { twMerge } = require('tailwind-merge'); console.log(twMerge(defaults, overrides))"` to verify class resolution when `cn()` overrides aren't working as expected.

### [2026-02-12] RLS Infinite Recursion
**Type**: Anti-Pattern
**Context**: Issue #72 (Admin Resident Creation). Failed with `infinite recursion detected in policy for relation "users"`.
**Problem**: RLS policies on the `users` table used subqueries that selected from `users` (e.g., checking if `auth.uid()` is a tenant admin). This triggers the policy again, creating an infinite loop.
**Fix**: Encapsulate the permission check in a `SECURITY DEFINER` function (e.g., `is_tenant_admin_of_tenant`). This runs with the creator's privileges, bypassing RLS for that specific check and breaking the recursion.

### [2026-02-16] Metadata Security: App vs User
**Type**: Pattern
**Context**: Issue #112 (New User Creation). `raw_user_meta_data` was used for `tenant_id` and `role`.
**Problem**: `user_metadata` is often client-writable (profile data). Using it for authorization fields allows privilege escalation if the client is compromised or the API is misused.
**Rule**: ALWAYS use `raw_app_meta_data` (via `admin.createUser` or `admin.updateUserById`) for trusted, admin-only fields like roles, tenant IDs, and subscription status.

### [2026-02-16] PII Logging Gate
**Type**: Pattern
**Context**: Issue #112 (Login Debugging). Console logs printed User IDs and Tenant IDs in production.
**Problem**: This exposes Personally Identifiable Information (PII) to anyone with a browser console, violating privacy standards.
**Rule**: Wrap ALL debug logs containing IDs or user data in `if (process.env.NODE_ENV !== "production")`.
```tsx
if (process.env.NODE_ENV !== "production") {
  console.log("[v0] User:", authData.user.id)
}
```

### [2026-02-16] Foreign Key Updates
**Type**: Pattern
**Context**: Issue #112 (User ID Sync). `auth.users` ID sync to `public.users` failed because related tables (family, tenants) restricted updates.
**Problem**: If a Primary Key changes (rare, but possible during migrations or syncs), all referencing Foreign Keys must update automatically or the operation fails.
**Rule**: Default to `ON UPDATE CASCADE` for all Foreign Keys referencing IDs that might be synced or migrated. Use `ON DELETE SET NULL` or `CASCADE` based on business logic, but `UPDATE` should almost always `CASCADE`.

### [2026-02-23] Route Handler Redirect Host Mismatch
**Type**: Gotcha
**Context**: Issue #70 (Password Reset). Auth exchange Route Handler used `new URL(path, request.url)` for redirects.
**Problem**: `request.url` uses the server's bind address (`0.0.0.0`) not the browser's hostname (`localhost`). Cookies set for one hostname are not sent to the other on redirect.
**Rule**: Always use `request.headers.get("host")` (or `x-forwarded-host`) to construct redirect URLs in Route Handlers. Never use `request.url` as the base for browser-facing redirects.

### [2026-02-23] Supabase `redirect_to` Strips Query Params
**Type**: Gotcha
**Context**: Issue #70 (Password Reset). Tenant slug passed as `?next=...` query param in `redirect_to`.
**Problem**: Supabase's internal redirect chain silently drops query parameters.
**Rule**: Encode contextual data in the URL **path** (e.g., `/auth/confirm/[slug]`), not as query params.

### [2026-02-23] Middleware Must Skip Auth Exchange Routes
**Type**: Pattern
**Context**: Issue #70 (Password Reset). Middleware's `getUser()` call ran before the auth exchange route handler.
**Problem**: Middleware refreshed stale session cookies, overwriting the new recovery session cookies set by the route handler. Timeout enforcement also killed recovery sessions that lacked `last-active` cookies.
**Rule**: Add an early return in middleware for `/auth/` paths. Auth exchange routes must manage their own cookies without middleware interference.

### [2026-03-01] Rate-Limit Try/Catch Scope
**Type**: Gotcha
**Context**: Issue #99 (Request Access). `withPublicRateLimit` wrapped both rate-limit logic AND the handler in a single try/catch.
**Problem**: If the handler threw an error, the catch block called the handler again ("fail open"), causing double execution of side-effectful operations (duplicate DB inserts, double API calls).
**Rule**: ALWAYS separate infrastructure try/catch from handler execution. Rate-limit errors should fail open (skip limiting), but handler errors must propagate normally.
```typescript
// ❌ WRONG: Handler runs twice if it throws
try { rateLimit(); return handler(req); } catch { return handler(req); }

// ✅ CORRECT: Handler runs exactly once
try { result = rateLimit(); } catch { /* fail open */ }
if (result && !result.success) return 429;
return handler(req); // throws propagate to caller
```

### [2026-03-01] PII in URL Query Parameters
**Type**: Anti-Pattern
**Context**: Issue #99 (Request Access). Approve action passed name, email, family in URL query params to pre-populate the create-resident form.
**Problem**: Query params appear in browser history, server access logs, analytics, and Referer headers — exposing PII to third parties and persisting it in places that are hard to purge.
**Rule**: NEVER pass PII (names, emails, phone numbers) in URL query params. Pass only opaque IDs (e.g., `?from_request=uuid`) and fetch the associated data server-side.

### [2026-03-01] Zod Trim Ordering
**Type**: Gotcha
**Context**: Issue #99 (Request Access). Zod schema used `.min(1).transform(val => val.trim())` — trim applied after validation.
**Problem**: Whitespace-only strings like `"   "` pass `.min(1)` (length 3) and only become `""` after the transform, allowing empty names through validation.
**Rule**: Use `.trim()` before `.min(1)` to normalize input before validation. In Zod, `.trim()` is a built-in preprocessor: `z.string().trim().min(1, 'Required')`.

### [2026-03-01] Fail-Closed Feature Flags
**Type**: Pattern
**Context**: Issue #99 (Request Access). Feature flag lookup for `access_requests_enabled` defaulted to `true` on any error.
**Problem**: A database outage, permission error, or misconfiguration would silently enable the feature for all tenants — the opposite of safe behavior.
**Rule**: Feature flags must **fail closed** (deny) on unexpected errors. Only fail open for known graceful conditions (e.g., column doesn't exist pre-migration). Default should be `false` until the query confirms `true`.

### [2026-03-08] Inline Creation in Search Dropdowns
**Type**: Pattern
**Context**: Adding a "Create" option when a search query finds no match in a dropdown (e.g., Interests, Skills).
**Problem**: Clicking the "Create" button can trigger the search input's `onBlur` event, closing the dropdown before the click is registered.
**Fix**: Use `onMouseDown={(e) => e.preventDefault()}` on the dropdown elements. This prevents the input from losing focus and ensures the `onClick` or `onMouseDown` handler fires successfully.

### [2026-03-08] Data-Driven Filter Derivation
**Type**: Pattern
**Context**: Populating filter options (e.g., Interests in the Neighbor Directory).
**Problem**: Querying the `interests` table directly shows all possible interests, most of which might not be used by any resident. This creates "dead" filter options.
**Fix**: Derive filter options from the **active dataset** (e.g., the `residents` array).
```tsx
const allInterests = Array.from(new Set(residents.flatMap(r => r.interests || [])))
```
This ensures only occupied interests are shown, and newly created interests appear as filters immediately after a resident selects them.

### [2026-03-08] RLS vs Server Action Auth
**Type**: Pattern
**Context**: Resident requests permitted residents to comment on public requests from others, leading to complex and hard-to-debug RLS policies involving `EXISTS` subqueries.
**Problem**: When RLS requires complex multi-join subqueries for authorization (e.g. "is this request public?", or "is the user an admin in the same tenant?"), it becomes brittle, opaque to debug, and prone to infinite recursion.
**Fix**: Use **Defense-in-Depth RLS** (simple tenant insulation) alongside **Backend-First Authorization** in Server Actions. Use `createAdminClient` inside the action to bypass RLS, manually run the complex authorization checks with clear error states and Typescript types, and then execute the writes.
### [2026-03-12] Searchable Dropdown Value Decoupling & Ranking
**Type**: Pattern
**Context**: Issue #155 (Lot Search). Shared `Combobox` was searching by UUID (the internal `value`).
**Problem**: UUID search makes it impossible for users to find items by name/number.
**Fix**: Decouple `value` (ID) from `label` (UI) and `search` (Searchable string).
**Ranking Tip**: Place the most likely match target (e.g. "D 401") at the absolute start of the `search` string. Typed characters that match index 0 rank significantly higher in `cmdk`.

### [2026-03-12] In-Render Array Mutation
**Type**: Anti-Pattern
**Context**: Issue #155 (Lot Search). `.sort()` was called on a raw_v state variable inside the render cycle.
**Problem**: `.sort()` mutates the source array. This can corrupt cached state or lead to unstable UI ordering.
**Fix**: Always copy the array before sorting (`[...arr].sort()`) and preferably wrap it in `useMemo` for stability and performance.

### [2026-03-12] Selection Sticky Focus in cmdk
**Type**: Gotcha
**Context**: Issue #155 (Lot Search). The dropdown was jumping to the bottom because the currently selected item ("None") matched the search query and $cmdk$ prioritized keeping the focused item in view.
**Problem**: If a low-score match is currently selected, common list components may auto-scroll to it, obscuring higher-score matches at the top.
**Fix**: Ensure non-priority options (like "None" or "Reset") have search values that do NOT match common search prefixes (e.g., set `search: "zz-none-zz"`). This forces the item to disappear during specific searches, resetting the focus to the top match.

### [2026-03-12] Tab-Based Feature Migration
**Type**: Pattern
**Context**: Issue #141 (Announcement Archive 404). A feature (Announcements) was moved from its own dedicated route to a tab inside a unified "Official" page.
**Problem**: Hardcoded links in widgets continued to point to the old route (`/dashboard/announcements`), leading to 404 errors.
**Fix**: Update navigational links across the codebase to use the new unified route with appropriate search parameters (e.g., `/dashboard/official?tab=announcements`). Use `revalidatePath` on the old paths to clear any stale cache, even if the route is technically "dead".
**Strategy**: When consolidating features into tabs, audit global components (Widgets, Notifications, Feed) for navigational debt.

### [2026-03-16] RLS on Framework Tables (Mastra)
**Type**: Gotcha
**Context**: Issue #168 (Persistence & RLS). Framework-managed tables (like `mastra_threads`/`messages`) often lack tenant context in their internal insertion logic.
**Problem**: Adding `NOT NULL` tenant columns and RLS policies breaks the framework's internal writes if it doesn't support passing that metadata.
**Fix**:
1. Use a **Robust Metadata Trigger**: Map `metadata->>'tenantSlug'` to a UUID `tenant_id` column.
2. **Metadata Inheritance**: If the framework doesn't pass metadata to child rows (e.g., messages), use a trigger to inherit `tenant_id` and `user_id` from the parent (e.g., thread).
3. **Trigger Security**: Use `SECURITY DEFINER` for triggers that perform lookups (e.g., slug to UUID) to avoid RLS recursion or permission denied errors for the database user performing the write.

### [2026-03-16] UUID Casting in Triggers
**Type**: Gotcha
**Context**: Issue #168 (Persistence & RLS). Triggers extracting UUIDs from JSONB metadata crashed the entire write if the metadata was missing or malformed.
**Problem**: A simple `metadata->>'tenantId'::uuid` cast throws an error on `null`, which aborts the transaction.
**Fix**: Use a `BEGIN...EXCEPTION` block in PL/pgSQL to safely handle casting errors, or explicitly check for `NULL` before casting. Always include a fallback (e.g., `NULL` or a default) To prevent "Silent Crash" of the application logic.

### [2026-03-16] Security-First Thread Management
**Type**: Pattern
**Context**: Issue #168 (Mastra Thread Isolation). AI assistants using persistent thread storage MUST verify ownership of the thread before continuing a conversation.
**Problem**: Relying solely on client-provided `threadId` allows "Conversation Hijacking" where a user can access another user's or tenant's message history just by knowing their UUID.
**Fix**: In the agent entry point (BFF/Agent Service), fetch the thread metadata BEFORE processing the stream. Compare the stored `tenantId`/`userId` with the current request's session headers. If they mismatch, return a **403 Forbidden** immediately. Do not "fail-open" to a default thread.

### [2026-03-16] Redacted Logging for PII
**Type**: Pattern
**Context**: Issue #168 (PII in Logs). Infrastructure logs often capture `userId`, `tenantId`, and `threadId` for debugging.
**Problem**: Logging raw UUIDs/IDs in production violates privacy standards and exposes PII to log aggregation services.
**Fix**: Use a hashing or masking helper in your logging layer. Unless `DEBUG_LOGGING=true` is enabled, convert sensitive identifiers to a truncated hash (e.g., `sha256(id).slice(0, 10)`). This preserves the ability to trace a single user's flow across log lines without exposing their actual identity.

### [2026-03-16] Upstream Abort Propagation
**Type**: Pattern
**Context**: Issue #168 (Dangling Model Streams). Long-running AI streams consume expensive tokens even after the user closes their browser tab or disconnects.
**Problem**: Backend services often continue generating text from the LLM upstream even if the client downstream has disconnected, wasting resources.
**Fix**: Always wire the incoming HTTP `AbortSignal` to the AI SDK's stream call (e.g., `rioAgent.stream(..., { abortSignal: req.signal })`). This allows the framework to signal the LLM provider to stop generation immediately upon client disconnect.

### [2026-03-16] Payload Schema Enforcement
**Type**: Pattern
**Context**: Issue #168 (Rio Agent Robustness). AI service endpoints often handle raw JSON bodies that are passed directly to downstream model generators or stream handlers.
**Problem**: Passing untrusted or malformed JSON payloads to expensive AI operations can lead to opaque 500 errors, resource leaks, or unexpected behavior if the payload shape doesn't match internal expectations.
**Fix**: ALWAYS use a validation schema (like **Zod**) at the very entry point of your service handler. Parse the request body and validate required fields (`messages`, `threadId`, etc.) BEFORE any logic or database lookups occur. Return a **400 Bad Request** with clear structural errors if the shape is invalid. This ensures your service "fails fast" and remains robust against malformed client requests.
### [2026-03-21] Embedding Dimension Strictness
**Type**: Gotcha
**Context**: Issue #160 (RAG Ingestion). `gemini-embedding-001` (v1) outputs 768 dimensions, while `openai/text-embedding-3-small` (our standardized model) outputs 1536 dimensions.
**Problem**: pgvector `vector(1536)` columns REJECT 768-dim inserts. Silent failure or truncation in some clients can corrupt semantic recall.
**Fix**: Always match the model to the column. If using a 1536-dim column, use `text-embedding-3-small`. Otherwise, migrate the column to `vector(768)`.

### [2026-03-21] Path-Based Storage RLS
**Type**: Pattern
**Context**: Issue #233 (Documents Bucket). Complex RLS checking `auth.uid()` against the `public.users` table for `tenant_admin` role often fails in storage contexts due to JWT claim limitations.
**Rule**: Enforce multi-tenant isolation in Storage via **path-prefixing**.
**Implementation**: 
1. Prefix all uploads with `tenant_id` (e.g. `documents/{tenant_id}/{file_name}`).
2. Use RLS: `CREATE POLICY ... ON storage.objects USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id'))`.
3. This is more performant and robust than cross-table joins in Storage policies.
### [2026-03-21] Idempotent AI Ingestion
**Type**: Pattern
**Context**: Issue #200 (Admin Ingestion). Manually triggering "Re-index" on a document that is already being processed.
**Problem**: Client-side `upsert` is not atomic. If an admin clicks "Re-index" while a background job is running, it could reset the status to 'pending' and trigger a redundant and potentially conflicting job.
**Fix**: Use a **Server-Side RPC** (`upsert_rio_document_if_not_processing`) that checks the current `status` in a single Postgres transaction. If `status = 'processing'`, the request is ignored or rejected, ensuring the active job completes without disruption.

### [2026-03-21] Multi-Layer Action Gating
**Type**: Pattern
**Context**: Issue #200 (Admin Ingestion). Re-index buttons appearing for draft documents or non-admin users.
**Problem**: UI components often forget to re-verify the "Source of Truth" status (e.g. `doc.status === 'published'`) before showing expensive AI actions.
**Rule**: AI actions in list views MUST be gated by a **Triad of Checks**:
1. **User Role**: `is_tenant_admin` (BFF/Action Level).
2. **Object Status**: `doc.status === 'published'` (UI & API level).
3. **Operational Lock**: `isProcessing === doc.id` (Local state level) to prevent double-clicks.
This ensures a robust, fail-safe user experience even under heavy load.
### [2026-03-22] Cross-Tenant Storage Boundaries
**Type**: Pattern
**Context**: Issue #238 (PR Remediation). Standard RLS on `storage.objects` often fails if it depends on joins to `public.users` due to JWT claim caching.
**Problem**: A `tenant_admin` might delete files from another tenant if the policy only checks their role but not the specific folder path.
**Fix**: Use **Path-Prefixing + JWT Extraction**. All files must be stored in `/{tenant_id}/{filename}`. The RLS policy must compare the folder name directly to the `tenant_id` claim in the auth JWT: `(storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')`. This is bulletproof and avoids recursive user table lookups.

### [2026-03-22] Atomic Status-Gated Upsert
**Type**: Pattern
**Context**: Issue #238 (Ingestion Race Conditions). Parallel triggers (e.g. double-click) created duplicate processing jobs.
**Problem**: Checking status in `if` logic inside a Server Action is prone to race conditions (TOCTOU).
**Fix**: Move the logic to a **Single SQL Transaction** using `ON CONFLICT (...) DO UPDATE ... WHERE status <> 'processing'`. This ensures the database itself rejects the update if a job is already active, providing a true atomic lock.

### [2026-03-22] BFF Proxy Timeout Enforcement
**Type**: Pattern
**Context**: Issue #238 (Proxy Hanging). Ingestion and health check proxies were hanging indefinitely when the internal agent was unresponsive.
**Problem**: Hanging requests consume server-side event loop capacity and degrade overall system availability.
**Rule**: NEVER perform a `fetch` in a BFF route without an `AbortSignal` timeout.
**Implementation**: Use `AbortController.timeout(ms)` (Node 18+) or a manual `Promise.race` to ensure proxies fail fast (e.g., 5-15s) and return a clean 504/503.

### [2026-03-22] Prompt/Schema Alignment Strictness
**Type**: Gotcha
**Context**: Issue #236 (Draft Ingestion). Code used `prompt_tone` in forms/actions, while DB used `prompt_persona`.
**Problem**: Mismatched keys between UI, Server Actions, and Postgres columns cause silent failures (upserting nulls) or crash on save.
**Rule**: Always verify column names in the migration files BEFORE typing form schemas (Zod). Documentation should use the canonical DB name (e.g., `persona`) across all layers.

### [2026-03-22] Embedding Model Tracking
**Type**: Pattern
**Context**: Issue #236 (Vector Migrations). Models evolve (e.g., Gemini v1 -> OpenAI v3), and dimensions change.
**Problem**: Semantic search breaks if chunks for the same tenant use different models or dimensions.
**Rule**: Always store the `embedding_model` name alongside the document. This allows the system to detect "Stale Embeddings" and prompt for a manual re-index when global model defaults change.

### [2026-03-24] RAG Relationship Strictness
**Type**: Gotcha
**Context**: Issue #193 (RAG Integration). The `search_documents` tool performed an `INNER JOIN` between `rio_document_chunks` and `rio_documents` to retrieve metadata (document name, source URL) for citations.
**Problem**: In tests/seeding, if only chunks were inserted without the corresponding `rio_documents` record, the search would return zero results despite vector similarity, causing silent RAG failures.
**Fix**: ALWAYS seed the parent `rio_documents` record before inserting chunks. Ensure the `document_id` in chunks matches a valid record in the parent table to satisfy the join.

### [2026-03-24] Zero Policy Storage & Signed URLs
**Type**: Pattern
**Context**: Vibe Code Check Phase 2. The `documents` bucket was initially public, exposing knowledge base files to unauthenticated URL probing.
**Rule**: Storage buckets for internal or semi-private documentation MUST be private (`public: false`). 
**Implementation**: 
1. The Agent (Backend) uses `SUPABASE_SERVICE_ROLE_KEY` to download files directly for processing.
2. The Client (Frontend) must use `supabase.storage.from('documents').createSignedUrl(path, 60)` to provide temporary access to residents for viewing sources. This ensures that even if a URL leaks, it is short-lived and non-predictable.

### [2026-03-25] Mastra v1.x Instance Naming (CLI Scope)
**Type**: Gotcha
**Context**: `mastra dev` failed with `mastra is not defined`.
**Problem**: Using `export const mastra = new Mastra({...})` can lead to naming collisions or scoping issues when the CLI's internal bundler renames exports (e.g., to `m`). This is especially true if `mastra` is also the default export.
**Fix**: Define the instance using a different internal name (e.g., `app`) and then explicitly export it:
```typescript
const app = new Mastra({...});
export const mastra = app;
export default app;
```

### [2026-03-25] Production SSL Certificate Chains (Railway/Supabase)
**Type**: Gotcha
**Context**: `MastraError: self-signed certificate in certificate chain` in production.
**Problem**: Cloud database providers (like Railway or Supabase) often use self-signed certificates. Strict SSL validation in the `pg` driver or `Mastra.PostgresStore` will abort the connection.
**Fix**: Conditionally disable strict certificate validation in production if the DB URL points to a non-local host:
```typescript
ssl: isLocal ? false : { rejectUnauthorized: false }
```
*Note: Only apply this to backend-to-backend infrastructure (Agent to DB) where the network path is trusted (e.g., within Railway VPC).*

### [2026-03-25] Mastra v1.x Logger Initialization
**Type**: Gotcha
**Context**: `TypeError: this[#storage].__setLogger is not a function`.
**Problem**: `Mastra` `v1.13.2+` tries to inject its internal logger into the storage instance during construction. If using an older storage pattern or registering it late, this internal call fails.
**Fix**: Always initialize and pass the `storage` instance directly into the `Mastra` constructor. Avoid legacy `.register()` calls (removed in v1.x).

### [2026-03-28] Framework-RLS Session Initialization
**Type**: Pattern
**Context**: Issue #262 (Río Memory). Frameworks like Mastra manage their own database connections, which often lack the session context required by Postgres RLS policies (e.g. `auth.uid()`).
**Problem**: Framework writes fail or return empty results because the database doesn't know who the "current user" is within that specific connection pool.
**Fix**: Implement an `initRls()` helper that executes `SET LOCAL app.current_tenant = ...` and `SET LOCAL app.current_user = ...` immediately before any framework storage call. This ensures the connection is securely "stamped" with the resident's identity for the duration of the transaction.

### [2026-03-28] BFF-First Security Gates
**Type**: Pattern
**Context**: Issue #262 (RAG Bypass). Client-side components passing their own configuration (e.g. `isRagEnabled`) to a shared AI route.
**Problem**: Malicious or buggy clients can override tenant-level security choices (e.g. turning on RAG for a tenant that has it disabled) by simply changing the request body.
**Rule**: AI configuration must be derived **server-side** from the tenant's profile. Client-provided flags should only be used to *disable* features already enabled for the tenant, never to *enable* those that are globally restricted.

### [2026-03-29] Historical Fact Redaction (Forgetting)
**Type**: Pattern
**Context**: Issue #259 (Privacy Settings). When a resident deletes a learned fact (e.g. "I like Pokémon") from their working memory, the LLM often "re-learns" it by reading its own past messages in the conversation history ("Ghost Memory").
**Problem**: Working Memory deletion alone is insufficient for GDPR compliance if the PII persists in raw logs or semantic recall buffers.
**Fix**: Implement an **Automated Forgetting Trigger**. When a memory index is deleted:
1. Perform a case-insensitive `regexp_replace(content, fact, '[REDACTED]', 'gi')` on all `mastra_messages` for that user.
2. `DELETE` all related chunks from the `memory_messages` vector table.
3. Enforce **Memory Sovereignty** in the system prompt, instructing the agent to ignore conflicting facts found in historical context.

### [2026-03-29] Dynamic Path Revalidation
**Type**: Gotcha
**Context**: Issue #259 (Privacy Settings). `revalidatePath("/t/[slug]/dashboard/...")` failed to clear the cache when the literal `[slug]` was used.
**Problem**: Next.js `revalidatePath` requires the actual path seen by the user. Generic segment patterns do not match dynamic instances correctly in all cache layers.
**Fix**: Always interpolate the actual slug: `revalidatePath(\`/t/\${slug}/dashboard/...\`)`.

### [2026-03-29] Agent Thread Defensiveness
**Type**: Gotcha
**Context**: Issue #262 (Río Memory). Agent update handlers assumed a thread would be found from context.
**Problem**: If `listThreads` returns empty (e.g. race condition or session purge), the next line trying to access `threads[0].id` crashes with a 500.
**Fix**: Always validate ID existence: `if (!threadId) return c.json({ error: "..." }, 404)`.

### [2026-03-29] POSIX Regex Injection
**Type**: Gotcha
**Context**: Issue #259 (Historical Pruning). User-provided facts were used directly in `regexp_replace` and `~*` operations.
**Problem**: A malicious (or accidental) string like `.*` or `(a|b)*` can cause ReDoS or unintended widespread redaction.
**Fix**: Always escape regex metacharacters before SQL insertion: `fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.

### [2026-03-29] Focus-Visibility for Mobile UI
**Type**: Pattern
**Context**: Accessibility Audit. Action buttons that appear on `:hover` (group-hover) were unreachable on mobile or for keyboard users.
**Fix**: Use `focus-within:opacity-100` alongside `group-hover:opacity-100`. This ensures that tabbing into the hidden element makes it visible and interactive.
### [2026-03-30] Stale UI Thread Identity (403 Forbidden)
**Type**: Security / UX Sync
**Context**: Complex AI features where the `threadId` is persisted in `localStorage` for session continuity, but the backend database might be pruned or reset independently.
**The Gotcha**: The frontend opens with a cached `threadId`. It attempts to send a message or fetch history. The backend (correctly) returns `403 Forbidden` or `404 Not Found` because the thread record is gone or owned by a previous session. The UI hangs or shows an unrecoverable error.
**Pattern**: **Server-Authoritative Validation**.
1. **Validate on Open**: Never trust a cached `threadId`. On every UI mount/open, call a lightweight `/active` or `/verify` endpoint to ensure the thread still exists and is authorized.
2. **Atomic Reset**: If validation fails or rotation is required, atomically clear the local message store *before* setting the new ID to prevent "Ghost History" (stale messages flashing).
3. **Interaction Guards**: Use a `isRefreshing` state to disable inputs/send buttons until the server confirmation is complete.
