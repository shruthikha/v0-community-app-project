source: requirement
imported_date: 2026-04-08
---
# Requirements: Double Login Regression on Auto-Logout

## 1. Problem Statement

Users are experiencing a "double login" friction when attempting to log in after their session has expired (auto-logout) in an open window.
1.  **First Attempt**: User enters credentials and clicks "Sign in". The form clears/resets silently. No error message is shown, and the user is *not* logged in.
2.  **Second Attempt**: User enters credentials again. Login succeeds immediately.

This regression appears to be related to the recent implementation of "Auto Logout / Remember Me" and a subsequent fix that silenced a "You do not have access to this tenant" error.

## 2. User Persona

-   **Returning User**: A resident or admin who leaves a tab open. When they return, their session has expired (due to inactivity or token expiry). They expect a single, successful login attempt to restore their session.

## 3. Context & Issue Context

### Recent Changes
-   **PR #154**: Implemented `auto-logout` and `remember-me` functionality. This introduced client-side or server-side checks for session inactivity.
-   **Silenced Tenant Error**: A subsequent PR (likely linked to checking tenant access) suppressed a "You do not have access to this tenant" error that was appearing incorrectly on logout/login.
-   **Auto-Logout Behavior**: The system correctly logs them out, but the state transition during the *next* login attempt seems to be flawed, possibly due to a race condition between "clearing the stale session" and "establishing the new session".

### Current Behavior
-   **Scope**: Only happens on open windows where the user might have been auto-logged out.
-   **Error**: Previously showed "you do not have access to this tenant". Now acts silently (form reset).

## 4. Dependencies

-   **PR #154**: `feat: implement inactivity auto-logout and remember me persistence`
-   **PR #238**: `fix: silence tenant access error on public routes` (Suspected cause of the "silent" failure)

## 5. Technical Options

### Option 1: Trust `last_sign_in_at` (Exception in Middleware)

**Mechanism**: Modify `lib/supabase/middleware.ts` to check `user.last_sign_in_at`. If the user signed in within the last 1-2 minutes, bypass the `last-active` cookie check.

**Implementation**:
-   File: `lib/supabase/middleware.ts`
-   Logic:
    ```typescript
    const lastSignIn = new Date(user.last_sign_in_at).getTime();
    if (now - lastSignIn < 60000) { // 1 minute grace period
        // Skip auto-logout check
    }
    ```

**Pros**:
-   **Robust**: Uses the definitive source of truth (Supabase Auth) to distinguish "fresh login" from "old session".
-   **Secure**: Doesn't weaken the inactivity timeout for actual inactive sessions (which will have an old `last_sign_in_at`).
-   **Simple**: Minimal code change, localized to middleware.

**Cons**:
-   **Clock Skew**: Slight risk if server time and auth server time drift significantly (unlikely with Supabase).

**Effort**: XS (Extra Small)

---

### Option 2: Exclude Server Actions from Middleware

**Mechanism**: Modify `lib/supabase/middleware.ts` to detect if the request is for a Server Action (specifically `setSessionPersistence`) and skip the timeout logic.

**Implementation**:
-   Inspect `request.headers.get("next-action")` or `request.method === "POST"`.
-   Skip the `last-active` enforcement for these requests.

**Pros**:
-   **Targeted**: Solves the specific race condition where the Server Action is intercepted.

**Cons**:
-   **Security Risk**: potentially allows bypassing inactivity checks if an attacker constructs a POST request or mimics a Server Action.
-   **Fragile**: Next.js internal headers (`next-action`) are implementation details.

**Effort**: S (Small)

---

### Option 3: Client-Side Pre-Cleanup

**Mechanism**: Attempt to clear the `last-active` cookie from the client side before submitting the login form.

**Implementation**:
-   File: `app/t/[slug]/login/login-form.tsx`
-   Add a `document.cookie = "last-active=; ..."` in `handleSubmit`.

**Pros**:
-   **Client-Controlled**: Explicitly clears state before starting the new flow.

**Cons**:
-   **Impossible**: The `last-active` cookie is `httpOnly: true` for security, so JS cannot delete it.
-   **Ineffective**: This option is technically not feasible without changing the cookie security settings (which is bad).

**Effort**: N/A (Disqualified)

---

## 6. Recommendation -> Phase 3 (Product Owner)

### ✅ Recommended: Option 1 — Trust `last_sign_in_at`

**Rationale**:
This is the only solution that correctly handles the race condition by using the source of truth (the User object's `last_sign_in_at`) rather than relying on a secondary, potentially stale signal (the cookie) or fragile headers. It ensures that a freshly authenticated user is never locked out, while maintaining the security of the inactivity timeout for truly inactive sessions.
This approach aligns with the "Deep Discovery" principle of solving the root cause (state mismatch) rather than patching the symptom (suppressing errors).

### Classification

| Property | Value |
|----------|-------|
| **Priority** | **P0** - Critical Regression (blocks login for returning users) |
| **Size** | **XS** - Extra Small (Middleware logic tweak + verification) |
| **Horizon** | **Nu** (Immediate) - Fix before next release |
## 8. Technical Review

### Phase 1: Security Audit
- **Reviewer**: Auto-Review Protocol
- **Status**: PASSED
- **Analysis**: The proposed fix acts as a trusted exception to the strict inactivity rule. By verifying `user.last_sign_in_at` (a claim managed by Supabase Auth), we move the source of truth for "activity" from a client-side cookie to the backend session state. This aligns with "Backend-First" principles.
- **Attack Surface**:
    -   **Spoofing**: Cannot spoof `last_sign_in_at` without a valid session signing key.
    -   **Bypass**: A truly inactive user (valid token, old timestamp) will still be caught by the logic because `now - lastSignIn` will exceed the grace period.
    -   **Race Condition**: Effectively resolved.

- **Reviewer**: Auto-Review Protocol
- **Status**: PASSED
- **Analysis**: Trusting `last_sign_in_at` is secure. It relies on the authoritative Supabase Session timestamp. A user with a valid, fresh session token has proved their identity recently. Bypassing the secondary "inactivity" check in this specific case (fresh login) corrects a state mismatch without opening a vulnerability.

### Phase 2: Test Strategy
- **Manual Verification**:
    1.  **Stale Cookie Scenario**: Login -> Delete `last-active` cookie -> Refresh/Navigate. Ensure logout happens.
    2.  **Fresh Login Scenario**: Trigger auto-logout -> Open Login Page -> Login. Ensure FIRST attempt works and no redirect loop occurs.
- **Automated Tests**:
    -   Existing middleware tests are limited.
### Phase 2: Test Strategy
- **Automated Tests**:
    -   *Status*: No existing `middleware.test.ts` found.
    -   *Recommendation*: Do not block this fix on new automated infrastructure. Manual verification is sufficient for this tailored fix.
- **Manual Verification Protocol**:
    1.  **Baseline (Stale Session)**:
        -   *Action*: Login -> Manually delete `last-active` cookie via DevTools -> Refresh page.
        -   *Expectation*: User is logged out (redirected to login).
    2.  **Fix Verification (Race Condition)**:
        -   *Action*: Trigger auto-logout (or manually clear cookies while keeping tab open) -> Enter credentials -> Click Login.
        -   *Expectation*: Login succeeds on **first attempt**. No silent form reload.
    3.  **Sad Path (Session Token Expiry)**:
        -   *Action*: Wait for actual Supabase token expiry (1h) or revoke session from dashboard.
        -   *Expectation*: `getUser()` returns error -> Middleware logs out.

### Phase 3: Performance Assessment
- **Schema**: No database changes involved.
- **Latency**: Negligible impact. `getUser()` is already called; accessing `last_sign_in_at` property is O(1).
- **Optimization**: No new indices or queries needed.

### Phase 4: Documentation Logic
- **Audit**:
    -   *Manuals*: No user-facing workflow change (bug fix for login friction).
    -   *API/Schema*: No changes.
    -   *Architecture*: Aligns with Identity Domain (Backend-First).
- **Updates**: None required beyond this requirement document.
- **Gaps**: None identified.
