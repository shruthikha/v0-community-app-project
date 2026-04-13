source: requirement
imported_date: 2026-04-08
---
# Requirements: Profile Auto-Save & Visible Save Button

## 1. Problem Statement
**What problem are we solving?**
Users currently have to manually click "Save Changes" at the bottom of the profile editing form to persist their updates. This creates two issues:
1.  **Risk of Data Loss**: If a user navigates away or forgets to save, their changes are lost.
2.  **Friction**: The "Save Changes" button can be far down the page (especially on mobile), requiring scrolling. Users expect modern apps to save their progress automatically.

**Why is this important?**
Improving the profile editing experience reduces friction for users completing their profiles, which is a key step in community onboarding and engagement.

## 2. User Persona
**Who is this for?**
-   **Residents**: Users updating their personal information, bio, interests, and skills.
-   **Admins**: Users managing their own profiles within the tenant.

## 3. Context
**Where does this fit?**
-   **Feature Area**: User Settings / Profile Management.
-   **Component**: `ProfileEditForm` (`app/t/[slug]/dashboard/settings/profile/profile-edit-form.tsx`).
-   **Current Behavior**: Manual save via a submit button at the bottom of the form. local state is used for all fields.

## 4. Requirements
**Functional Requirements**:
1.  **Auto-Save on Blur**: When a user clicks outside a text field (blur) or finishes interacting with a control (select, toggle), the change should be saved to the database.
2.  **Visible "Next" Button**: The existing "Save Changes" button should be renamed to "Next" (or similar context-appropriate text if it leads somewhere, otherwise "Done" or just keep "Save" as a manual trigger). *User specified: "The button should remain there but we can call it 'Next'"*.
3.  **Visual Feedback**:
    -   Show a "Saving..." indicator when an auto-save is in progress.
    -   Show a "Saved" indicator (checkmark) briefly after a successful save.
    -   Handle validation errors gracefully (e.g., don't save invalid email/phone, show error near field).
4.  **Scope**: Applies to the "Complete Profile" flow in the dashboard settings, *not* the onboarding product tour.

**Non-Functional Requirements**:
-   **Performance**: Updates should be optimistic where possible or debounced/blurred to prevent excessive API calls.
-   **UX**: The "Next" button implies a flow. If this is a standalone settings page, "Next" might suggest navigation. We need to clarify if this form is part of a larger wizard or a standalone page. *Assumption based on user input: "if people go back and forth... don't need to start over". This implies a multi-step mental model even if it's a single page.*

## 5. Dependencies
-   **Supabase Client**: `createClient` in `lib/supabase/client`.
-   **Components**: `Input`, `Textarea`, `Combobox`, `MultiSelect`.
-   **Existing Issues**: [To be filled by Agent]

## 6. Technical Considerations (Input for Phase 2)
-   The form currently uses a single large state object (`formData`). Auto-saving individual fields might require refactoring to handle partial updates more cleanly or a `useAutoSave` hook.
-   `handleProfilePhotoChange` and `handleBannerChange` currently defer to submit. They need to trigger save immediately or on a slight delay.


## 6. Technical Options

### Option 1: Silent Submit + Event Listeners (Refactoring)
Refactor the existing `handleSubmit` to decouple the saving logic from the UI feedback (alerts/navigation).
-   **Method**:
    -   Extract the core Supabase update logic from `handleSubmit` into a `saveProfile(silent: true)` function.
    -   Attach `onBlur` to text inputs (`First Name`, `Last Name`, `Phone`, etc.) to trigger `saveProfile`.
    -   Attach `onValueChange` to Selects/Comboboxes to trigger `saveProfile` immediately.
    -   Keep the "Save" button (renamed to "Next") as a manual trigger that shows the toast and navigates/refreshes.
-   **Pros**: Reuses existing robust dirty-checking logic. Precise control over when saves happen (on blur).
-   **Cons**: Requires touching every input field in the JSX to add the handler.
-   **Effort**: Medium

### Option 2: `useDebounce` on `formData`
Watch the entire `formData` state and auto-save after a period of inactivity.
-   **Method**:
    -   Add a `useEffect` dependent on `formData`.
    -   Debounce the call to `saveProfile` by 1-2 seconds.
    -   Show a "Saving..." spinner during the debounce/save cycle.
-   **Pros**: Very little code change in the JSX (don't need to touch every input). Covers all fields automatically.
-   **Cons**: Can be "chatty" with the API. Risk of race conditions if the user edits rapidly. Might save incomplete data (though validation handles this).
-   **Effort**: Low

### Option 3: Atomic Field Auto-Save
Isolate each field's state and save logic.
-   **Method**:
    -   Create a generic `<AutoSaveInput>` component that handles its own state and saves on blur.
    -   Replace existing standard inputs with this component.
-   **Pros**: Highly modular. Performance is isolated.
-   **Cons**: Major refactor of the form structure. `ProfileEditForm` is already complex; this might fracture the `formData` state source of truth.
-   **Effort**: High

## 7. Recommendation
**Selection**: **Option 1 (Silent Submit + Event Listeners)**
This approach strikes the best balance between UX quality and code stability.
-   **Why**:
    -   **Reliability**: `onBlur` is the standard pattern for "save when done". It prevents saving while the user is still typing (unlike pure debounce) or saving incomplete states.
    -   **Code Reusability**: We can reuse the extensive dirty-checking logic already present in `handleSubmit`, ensuring we only send changed fields to Supabase.
    -   **UX**: Matches the user's specific request ("save once a user clicks somewhere outside of the box").

**Feature Metadata**:
-   **Priority**: P1 (High Quality of Life improvement)
-   **Size**: S (Small - logic exists, just rewiring triggers)
-   **Horizon**: Q1 26

## 8. Technical Review

### Phase 0: Issue Details
- **Issue**: #109 [Brainstorm] Profile Auto-Save & Visible Save Button
- **Goal**: Implement auto-save on blur and rename "Save Changes" to "Next".
- **Author**: mjcr88

### Phase 0: Impact Map
- **Primary Component**: `app/t/[slug]/dashboard/settings/profile/profile-edit-form.tsx`
- **Database Tables**:
  - `users` (updates profile fields)
  - `user_interests` (deletes and inserts)
  - `user_skills` (deletes and inserts)
  - `skills` (inserts new skills)
- **Dependencies**:
  - `@/lib/supabase/client`
  - `@/components/ui/*` (Input, Select, etc.)
  - `@/lib/analytics` (ProfileAnalytics)

### Phase 0: Historical Context
Top 3 recent commits affecting `profile-edit-form.tsx`:
1. `8d30417` (Jan 18): fix: address code review feedback (admin flow logic, profile form mutations)
2. `dcd132b` (Jan 18): feat: refine admin resident flow, update UI to Household
3. `f4f017f` (Jan 16): feat: PR #23 - PostHog analytics integration


### Phase 1: Security Audit
- **Vibe Check**:
  - **Violation**: Client-side DB updates via `supabase-js` in `ProfileEditForm`.
  - **Recommendation**: Refactor to Server Actions for better validation and control.
- **Attack Surface**:
  - **CRITICAL**: The `users_own_data` RLS policy allows `ALL` operations for owners.
  - **Vulnerability**: `public.users` contains sensitive columns `role`, `is_tenant_admin`. A malicious user could effectively escalate privileges by updating these fields on their own profile.
  - **Mitigation**: Update RLS to strict column-level security or use a Postgres Trigger to prevent updating sensitive columns, OR move to Server Actions and use `service_role` (carefully) or valid logic that ignores sensitive fields. Best approach: Restrict RLS to non-sensitive columns if possible, or separate sensitive data.


### Phase 2: Test Strategy
- **Sad Paths**:
  - **Network Failure**: User blurs field while offline. System must show error indicator and ideally retry or prompt user.
  - **Validation Collision**: User enters invalid phone format; auto-save should NOT trigger for that field, or show inline error and revert.
  - **Rapid Switching**: User tabbing through fields very fast. Ensure race conditions in `updates` object are handled (Option 1's granular updates help here).
  - **Session Timeout**: Auth token expires during auto-save.
- **Test Plan**:
  - **Unit Tests**:
    - Validate field-specific dirty checking logic.
    - Test `saveProfile` with mock Supabase responses (success/fail).
  - **Integration Tests**:
    - Verify `user_interests` and `user_skills` sync logic (delete/insert cycle).
  - **E2E Tests (Playwright)**:
    - Edit 'About', click outside, verify toast/indicator.
    - Refresh page and verify state persistence.
    - Test "Next" button navigation and final save trigger.


### Phase 3: Performance Assessment
- **Schema Static Analysis**:
  - `users`, `user_interests`, `user_skills`, `skills` tables have appropriate B-Tree indexes on foreign keys (`user_id`, `tenant_id`, `interest_id`, `skill_id`).
  - **Bottleneck Identified**: The current logic for interests/skills is "delete-all-then-re-insert". While safe for small data, it adds unnecessary overhead to every auto-save event.
  - **Optimization**: Ideally, only sync interests/skills if they have changed, OR use a Postgres function to handle the diff server-side.
- **Live Introspection**:
  - `production` table sizes are minimal (all < 100 rows). Performance impact of current strategy is negligible for now but should be optimized for scale.


### Phase 4: Documentation Plan
- **User Manuals**:
  - Update `docs/01-manuals/resident-guide` to include "Profile Auto-Save" feature (explain that "Next" button also saves).
- **Analytics**:
  - Add `profile_autosave_triggered` and `profile_autosave_success/failure` events to `docs/02-technical/analytics/posthog-analytics.md`.
- **Schema & RLS**:
  - **MANDATORY**: Create `docs/02-technical/schema/policies/users.md` and document the privilege escalation risk identified in Phase 1.
  - Create table documentation for `user_interests` and `user_skills` in `docs/02-technical/schema/tables/`.
- **Infrastructure**:
  - No changes needed.


### Phase 5: Strategic Alignment & Decision
- **Conflicts**: 
  - #115 (Profile Picture Cropping) affects the same form components.
  - #100 (Interest Creation) affects interest sync logic.
- **Sizing**: **S** (Small).
- **Decision**: **PRIORITIZE** (Ready for Development).
- **Implementation Note**: The existing RLS vulnerability MUST be addressed by moving the profile update logic to a Server Action that enforces a strict allow-list of fields (e.g., bio, phone, interests) and prevents modification of `role` or `is_tenant_admin`.

