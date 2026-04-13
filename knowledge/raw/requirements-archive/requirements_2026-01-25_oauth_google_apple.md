source: requirement
imported_date: 2026-04-08
---
# Requirements: Google & Apple OAuth Implementation

## Problem Statement
Residents of the Ecovilla Community Platform (Nido) currently rely solely on email/password authentication. This process can be cumbersome, leading to password fatigue and increased friction during onboarding. Streamlining the login/signup process via Google and Apple ID will improve user retention and simplify access.

## User Persona
- **Resident**: Primarily mobile users who want quick, secure access to the community platform without managing additional credentials.
- **Admin**: May benefit from OAuth, but it is not the primary target for this phase.

## Context
- **Infrastructure**: The platform uses Supabase Auth, which natively supports Google and Apple OAuth providers.
- **Current State**: Manual email/password authentication is fully functional with Supabase middleware.
- **Constraints**: No credentials (Client IDs/Secrets) exist yet; these must be configured in the Supabase Dashboard.

## Dependencies
- **Existing Auth**: Relies on the existing Supabase configuration and middleware (`lib/supabase/*`, `middleware.ts`).
- **GitHub Issues**: No overlapping issues found.

## Functional Requirements
1.  **OAuth Integration**: Enable Google and Apple ID as authentication providers.
2.  **Account Linking**: 
    - If an email from Google/Apple matches an existing email/password account, the system MUST ask the user if they wish to link the accounts.
    - Upon confirmation, the OAuth identity should be linked to the existing user record.
3.  **Fallback Support**: Traditional email/password login MUST remain available.
4.  **Role Handling**: Ensure that OAuth users are correctly assigned the `resident` role based on existing RLS/Trigger logic.

## UI/UX Requirements
- **Design System**: Use `shadcn/ui` components for buttons.
- **Placement**: Common OAuth button patterns (e.g., "Continue with Google" / "Continue with Apple").
- **Prompts**: Clear UI prompts for account linking decisions.

## Issue Context & Documentation Gaps
- **Gap**: Documentation on the Supabase Project's Google/Apple credential setup is missing in `docs/`.
- **Gap**: No existing PRD for the overall auth strategy.

---

## Technical Options

### Option 1: Supabase `signInWithOAuth` (Client-Side)
Directly invoke Supabase's auth methods from the frontend login component.
- **Pros**: Fastest implementation; utilizes built-in Supabase logic for identity providers.
- **Cons**: Limited control over the intermediate state between "OAuth login" and "Account linking" if Supabase's auto-link fails or creates duplicates.
- **Effort**: **S**

### Option 2: Server Actions & Auth Callback (PKCE)
Initiate the flow via a Server Action and handle the result in a custom `api/auth/callback` route.
- **Pros**: Secure PKCE flow; allows for a custom "Account Found" intermediate page to handle the user's choice to link/manual login.
- **Cons**: Requires more boilerplate in the Next.js App Router structure.
- **Effort**: **M**

### Option 3: Logic-Heavy Database Triggers
Use Supabase's native OAuth but handle the "Ask User" and "Link Account" logic strictly within Postgres triggers (`on_auth_user_created`).
- **Pros**: Extremely robust; ensures data integrity regardless of the frontend client.
- **Cons**: Implementing "Ask User" visibility from a DB trigger is difficult; usually requires an `is_pending_link` flag in the `profiles` table.
---

## Recommendation & Classification

### Final Recommendation: **Option 2 (Server Actions & Auth Callback)**
Option 2 is recommended because it provides the necessary control flow to handle the "Account Linking" prompt gracefully. By using an internal callback route, we can check for existing email-based accounts before the Supabase session is fully established, allowing us to present a specialized UI to the user to confirm linking or switch to manual login.

### Metadata
- **Priority**: P1 (High value for onboarding)
- **Size**: M (Requires UI + Callback logic + Supabase config)
- **Horizon**: Q1 26

## 8. Technical Specification

### Phase 0: Context Gathering
- **Issue Details**:
    - **Title**: [Brainstorm] Google / Apple ID OAuth
    - **Goal**: Implement OAuth to reduce friction.
    - **Key Requirement**: Account Linking implementation (Option 2).
- **Impact Map**:
    - **Auth Core**: `middleware.ts`, `lib/supabase/*`.
    - **UI**: `app/login/page.tsx` (Needs new buttons).
    - **New**: `app/api/auth/callback/route.ts` (Needs creation for PKCE).
    - **Schema**: `scripts/001_create_initial_schema.sql` (Check triggers).
- **Historical Context**:
    - `middleware.ts`: Last touched Oct 31 2025 (Fix auth error handling). Stable.
    - `app/login`: Initialized Oct 30 2025. No recent churn.
    - **Risk**: Low code churn in auth area suggests stability, but also potential "cold code" that might have bitrot (e.g., deprecated Supabase methods).

### Phase 1: Security Audit
- **Vibe Check**: "Option 2" (Server-side handling) is **APPROVED**. It avoids client-side logic for sensitive operations like account linking.
- **Attack Surface Analysis**:
    - **CRITICAL VULNERABILITY (Role Injection)**: 
        - File: `scripts/001_create_initial_schema.sql` (Line 140)
        - Issue: `COALESCE(new.raw_user_meta_data->>'role', 'resident')` trusts client input. A user can POST `{ "data": { "role": "super_admin" } }` to `auth/signup` and escalate privileges.
        - **Remediation**: Hardcode `role` to `'resident'` in the trigger for self-signups. Admin updates should happen via `admin` SDK or direct SQL only.
    - **RLS Bypass**: RLS policies (e.g., `super_admins_select_all_users`) rely on this compromised column.
    - **Account Linking**: Must strictly verify `email_confirmed_at` IS NOT NULL before linking. 
- **Secret Management**:
    - Ensure Google/Apple Client Secrets are stored in `vault` or `.env` and NEVER exposed to client bundles (Option 2 helps this by checking secrets on server).

### Phase 2: Test Strategy
- **Sad Paths & Edge Cases**:
    - **Linking Refusal**: User signs in with Google, matches existing email, but declines "Link Account".
        - *Expectation*: User remains logged out (or logged in as a *new* user if we allow duplicate emails? No, `email` is UNIQUE in `public.users`).
        - *Requirement*: Explicitly handle unique constraint violation if linking is declined but they try to proceed.
    - **Unverified Emails**:
        - Scenario: Google account has `email_verified: false` (rare but possible).
        - *Expectation*: Block sign-up or require email verification step.
    - **Provider Cancel**: User hits "Cancel" on Google consent screen.
        - *Expectation*: Global error boundary catches the callback error parameter and shows a friendly toast.
- **Test Plan**:
    - **Unit (DB)**:
        - Test `handle_new_user` with injected `role: 'super_admin'`. Assert it persists as `resident`.
    - **Integration (API)**:
        - Mock `exchangeCodeForSession`. Test `GET /api/auth/callback?code=INVALID`. Expect Redirect -> Login + Error Message.
    - **E2E (Manual)**:
        - "The Double-Dip": Login with Email/Pass. Logout. Login with Google (same email). Verify "Link Account" prompt appears. Confirm linking works.

### Phase 3: Performance Assessment
- **Schema Analysis**:
    - `public.users`: `email` column is `UNIQUE`, creating an implicit B-Tree index. Lookups during the Auth Callback (`SELECT * FROM users WHERE email = ?`) will be O(1) / O(log N).
    - `auth.identities`: Managed by Supabase. Standard performance.
- **Query Impact**:
    - The "Account Linking" flow introduces 1 additional SELECT query per login event (to check for handling existing user). This is negligible overhead (<1ms).
- **Bottlenecks**:
    - **External Latency**: greatest bottleneck is the round-trip to Google/Apple and Supabase Auth servers. The application-side logic is efficient.
    - **No N+1 detected**: Flow handles single user context.

### Phase 4: Documentation Logic
- **New Documentation Required**:
    - `docs/02-technical/api/auth.md`: Specify the `/api/auth/callback` parameters (code, next) and error handling.
    - `docs/01-manuals/resident-guide/login.md`: Update with "Sign in with Google/Apple" screenshots and instructions.
    - `docs/02-technical/architecture/domains/identity.md`: Create domain doc explaining the "Single User, Multiple Identities" model and the "Link Account" security gates.
- **Updates**:
    - `docs/02-technical/architecture/auth-flow.mermaid`: Add the OAuth callback sequence.
    - `docs/02-technical/schema/tables/users.md`: Document the `handle_new_user` logic vs OAuth metadata.

### Phase 5: Strategic Alignment & Decision
- **Dependencies**: Potential conflict with "User Tagging" (#65) feature currently in development regarding `users` table schema.
- **Decision**: **Prioritize (Ready for Development)**.
- **Sizing**: Confirmed **M**.
- **Next Steps**:
    1. Fix Critical Role Injection Vulnerability first.
    2. Implement Option 2.
    3. Coordinate with User Tagging dev to ensure schema compatibility.
## 8. Technical Review
