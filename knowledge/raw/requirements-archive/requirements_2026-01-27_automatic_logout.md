source: requirement
imported_date: 2026-04-08
---
# Requirements: Automatic Logout Logic

## Issue Context
- **Topic**: Automatic Logout / Session Timeout
- **Date**: 2026-01-27
- **Source**: User Request / Brainstorming
- **Status**: Ready for Development
- **Issue**: [#77](https://github.com/mjcr88/v0-community-app-project/issues/77)

### Documentation Gaps
- `docs/02-technical/architecture/domains/identity.md`: Missing specific session management and timeout specifications.

## Problem Statement
Currently, user sessions may persist indefinitely or rely solely on default cookie lifetimes. This poses a security risk, particularly on shared devices where a subsequent user could access the previous user's account if they didn't explicitly logout. There is no mechanism to differentiate between a "trusted device" (Remember Me) and a temporary session.

## User Persona
- **All Users (Admin & Resident)**: Need protection from unauthorized access if they leave their device unattended.
- **Regular Users (Mobile/Desktop App)**: Need convenience to stay logged in on trusted devices ("Remember Me").

## Context & Scope
### Requirements
1.  **Idle Timeout**: Automatically log users out after **2 hours of inactivity**.
2.  **Remember Me**: Provide an optional "Remember Me" checkbox at login.
    - If checked: Session persists (e.g., 30 days or indefinite until explicit logout).
    - If unchecked: Session adheres to the strict 2-hour inactivity rule.
3.  **Warning**: No UI warning required before logout.
4.  **Mechanism**: Security best practices should be followed. Ideally, this involves invalidating the session on the backend, not just clearing client-side storage.

## Dependencies
- **Auth System**: Must integrate with existing Authentication provider (e.g., Supabase Auth, NextAuth, or custom JWT).
- **Frontend**: Login form needs UI update for "Remember Me".

## Technical Options

### Option 1: Frontend Idle Timer + Supabase Session Persistence
**Description**: Use a React hook (e.g., `react-idle-timer`) to track user activity events (mouse, keyboard). If inactive for 2 hours, trigger `supabase.auth.signOut()` and redirect to login. for "Remember Me", we toggle `supabase.auth.startSession({ persistSession: true/false })` based on the checkbox.

- **Pros**: 
    - Easiest to implement.
    - Good UX (can show "Are you still there?" modal).
    - "Remember Me" is natively supported by Supabase client.
- **Cons**: 
    - Insecure if used alone (Client-side only). An attacker who steals the token can still use it until it naturally expires on the server.
    - Doesn't work if the tab is closed but the browser is left open (unless we use strict cookies).
- **Effort**: Low (Sprint 1)

### Option 2: Middleware Enforcement (Server-Side) with Rolling Sessions
**Description**: Implement logic in Next.js Middleware. A "Last-Active" timestamp is stored (in a signed cookie or Redis). The middleware checks this timestamp on every request. If > 2 hours, it rejects the request and clears auth cookies. "Remember Me" would set a flag to bypass this check or extend the timeout to 30 days.

- **Pros**: 
    - More secure (Server-enforced API protection).
    - Works even if the frontend code is tampered with.
- **Cons**: 
    - Higher complexity (Cookie management).
    - Performance overhead (Middleware runs on every request).
    - Supabase Auth tokens might still be valid unless we explicitly revoke them via Admin API.
- **Effort**: Medium (Sprint 1-2)

### Option 3: Supabase Native Row Level Security (RLS) & Token Config
**Description**: Configure the Supabase Project Security Settings to have a short JWT lifespan (e.g., 1 hour). Use RLS policies that check a `profiles.last_seen` timestamp. If `now() - last_seen > 2 hours` AND `remember_me` is false, deny access. Frontend updates `last_seen` periodically (heartbeat).

- **Pros**: 
    - Strongest Security (Database level enforcement).
    - Centralized logic.
- **Cons**: 
    - High Database load (Writes on every few minutes for every user).
    - "Remember Me" logic is complex to implement inside JWT/RLS without custom claims.
    - Determining "Activity" strictly from DB calls is laggy.
- **Effort**: High (Sprint 2)

## Recommendation

### Selected Option: Option 2 (Middleware Enforcement)
We recommend implementing **Option 2**. While Option 1 gives quick UI benefits, it fails the "best practices from a security perspective" requirement because a stolen token remains valid. Option 2 provides a robust security posture by validating session activty on the server side (Edge Middleware) without the heavy database cost of Option 3.

### Implementation Logic
1.  **Cookie**: Create a `last_active` signed cookie.
2.  **Middleware**: On each request:
    - If `remember_me` cookie is present: Skip check.
    - If `last_active` > 2h old: Redirect to `/logout`.
    - Else: Update `last_active` to `now`.

### Classification
- **Priority**: P2 (Important Security Hygiene)
- **Size**: M (Requires Middleware logic + Testing)
- **Horizon**: Q1 26

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue**: `[Brainstorm] Automatic Logout / Session Timeout` (Draft)
- **Map**:
    - **Core Info**: `middleware.ts` (Application Root), `lib/supabase/middleware.ts` (Auth Helper).
    - **UI**: `components/library/login-form.tsx` (Needs 'Remember Me' Checkbox).
- **History**:
    - `middleware.ts`: Minimal visual changes. Last logic update Oct 2025.
    - `login-form.tsx`: Visual update Nov 2025 (`feat(wp3b)`).

### Phase 1: Security & Vibe Audit
- **Vibe Check**: **PASS**. Option 2 (Server-side middleware) aligns with "Backend-First" security.
- **Attack Surface**:
    - **Cookie Tampering**: `last_active` and `remember_me` cookies MUST be HttpOnly and **Signed/Encrypted** to prevent client-side modification.
    - **Logout Cleanup**: The `/logout` action must explicitly clear these custom cookies alongside the Supabase session.
    - **Middleware Scope**: Current matcher excludes static files correctly.

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Cookie Forgery**: Manually editing the `last_active` cookie should trigger immediate logout or ignore.
    - **Edge Renewal**: User is active at 1h 59m. Request should extend session. User inactive until 2h 01m -> Logout.
- **Test Plan**:
    - **Unit**: Verify crypto signing/verifying functions in `lib/crypto.ts` (to be created).
    - **E2E (Playwright)**:
        - `tests/e2e/auth-timeout.spec.ts`:
            - Test A: Login without Remember Me -> Fast forward time -> Refresh -> Expect Login.
            - Test B: Login *with* Remember Me -> Fast forward -> Refresh -> Expect Dashboard.

### Phase 3: Performance Assessment
- **Latency**: Adding cookie parsing and re-signing in Middleware adds negligible CPU overhead (<5ms). However, `supabase.auth.getUser()` triggers a network fetch to Supabase Auth on every navigation, which is existing behavior but worth noting.
- **Database**: No new tables or columns required. The 'Remember Me' state is client-side (cookie) + server-side verification, not DB stored.

### Phase 4: Documentation Plan
- **User Guide**: Create/Update `docs/01-manuals/resident-guide/login.md` to explain the "Remember Me" checkbox and 2-hour safety timeout.
- **Architecture**: Update `docs/02-technical/architecture/domains/identity.md` to document the Timeout policy and Middleware implementation details.
- **Missing Docs**: Logged gap for Identity Domain and Login Guide.

### Phase 5: Strategic Alignment & Decision
- **Decision**: Prioritized for Q1 2026.
- **Sizing**: Medium (Requires Middleware logic + Testing).
- **Execution**: Converted to Issue #77 and marked as 'Ready for Development'.
