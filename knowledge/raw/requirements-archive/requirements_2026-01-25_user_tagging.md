source: requirement
imported_date: 2026-04-08
---
# User tagging - Implementation of @mentions

## Problem Statement
Residents creating community content (Events, Check-ins) currently cannot mention or tag other neighbors in the description.
1.  **Low Engagement**: No notification is triggered if a user is discussed or relevant to a post.
2.  **Disconnected Experience**: Users have to manually invite or message neighbors separately.
3.  **Missed Context**: Reading "Dinner with John" is static; it doesn't link to John's profile or verify which John it is.

## User Persona
*   **Primary**: Resident (Community Builder) - Wants to highlight friends or co-hosts in their posts.
*   **Secondary**: Tagged User - Wants to be notified when they are mentioned in the community.

## Context & Background
Currently, the app supports **Explicit Invitations** via `event_invites` table and `ResidentInviteSelector.tsx` for access control.
However, the **Description** fields (Event details, Check-in notes) are plain text.
*   **Current State**: Plain text descriptions. No links, no notifications.
*   **Desired State**: "Rich" text where typing `@` opens a user selector, inserts a link/chip, and triggers a notification.

## Dependencies
*   **Frontend Component**: Need a "Rich Text Editor" or "Mention Input" component (replacing simple `Textarea`).
*   **Backend Logic**: Need to parse the text on save to detect mentioned User IDs.
*   **Notification System**: Need to trigger an `INSERT` into `notifications` table for every parsed user.
*   **Privacy**: Tagging should likely respect visibility (can only tag people visible to you).

## Issue Context
*   **Related Components**:
    *   `components/event-forms/resident-invite-selector.tsx` (Logic for fetching residents exists here).
    *   `app/api/notifications/` (Existing notification infrastructure).
*   **Missing Documentation**: No standard "Rich Text" component exists in the codebase yet.

## Technical Options

### Option 1: "Poor Man's Mentions" (Client Regex)
Keep the simple `Textarea` or `Input`. When user types `@`, show a simple popover (using `cmdk` or similar). On save, the text is just plain text like "Dinner with @JohnDoe".
*   **Pros**:
    *   **Simplicity**: No heavy Rich Text Editor (RTE) library needed.
    *   **Data Structure**: Keeps data as simple strings.
*   **Cons**:
    *   **Fragile Parsing**: If John changes his name, the old text breaks or remains stale.
    *   **UX Issues**: Handling spaces in names, deleting half a name, etc., is buggy in plain text.
    *   **Notification Logic**: Backend must re-parse regex on every save to find new mentions vs old ones.
*   **Effort**: Low (S)

### Option 2: Headless Rich Text (Tiptap / Slate)
Implement a robust headless editor like **Tiptap**. Store the content as JSON or HTML. Mentions are proper "Nodes" with `id` and `label`.
*   **Pros**:
    *   **Robustness**: Handles name changes (store ID, render Name).
    *   **UX**: "Chip" style deletion (delete whole name at once).
    *   **Extensibility**: Opens door for bold, links, lists later.
*   **Cons**:
    *   **Heavy**: Adds a significant dependency.
    *   **Migration**: Existing descriptions are plain text; need a migration strategy or hybrid renderer.
*   **Effort**: High (L) - Requires installing Tiptap, creating components, updating DB schema type for description (or using JSONB).

### Option 3: "hybrid" Explicit Metadata
Keep description as plain text (or simple markdown), but add a separate `related_users` (or `mentions`) array to the Event/Check-in table. The UI allows "Tagging" users via a button (using the existing `ResidentInviteSelector`), and we append their names to the bottom of the description automatically: "Mentioning: @John, @Jane".
*   **Pros**:
    *   **Backend-First**: Very clean data model (`event_mentions` table).
    *   **Reuse**: Reuses `ResidentInviteSelector` exactly as is.
    *   **Notifications**: Trivial to trigger (just iterate the `mentions` array).
*   **Cons**:
    *   **UX**: Not true "inline" mentions. Can't say "Hey @John, thanks". It's just a list at the bottom.
*   **Effort**: Medium (M)

## Recommendation

### Selected Option: Option 2 (Tiptap / Headless RTE)
We will proceed with **Option 2**. While Option 3 is simpler to build, it fails the "Premium Design" and "Micro-animations" user rule. Tiptap offers the industry-standard "Notion-like" experience that users expect. It separates the *reference* (User ID) from the *display* (User Name), which is critical for long-term data integrity (what if users change names?).

**⚠️ Implementation Note**: Before starting work, the assignee should briefly re-evaluate Option 2 vs Option 3. If Tiptap proves too heavy for the initial MVP, Option 3 (Metadata List) is an acceptable fallback, but Option 2 is the desired "North Star" UX.

### Classification
*   **Priority**: P2 (Enhancement)
*   **Size**: L (Large - requires new library integration)
*   **Horizon**: Q2 26 (Post-Stability)

## 8. Technical Review

### Phase 0: Context Gathering

#### Phase 0: Issue Details
- **Source**: [Issue Item 151881834](https://github.com/users/mjcr88/projects/1/views/2?pane=issue&itemId=151881834)
- **Goal**: Implement "@mentions" in Event and Check-in descriptions using Tiptap.
- **Selection**: Option 2 (Tiptap / Headless RTE) is the preferred direction.

#### Phase 0: Impact Map
- **Frontend Components**:
    - `components/tiptap-editor.tsx`: Base editor that needs `@tiptap/extension-mention` configuration.
    - `app/t/[slug]/dashboard/events/(management)/create/event-form.tsx`: Management form using description field.
    - `components/ui/rich-text-editor.tsx`: Alternative primitives that might need sync.
- **Data Layer**:
    - `lib/supabase/`: Client handles data persistence. Descriptions are currently strings but may receive HTML/JSON from Tiptap.
    - `types/notifications.ts`: Already includes `"mention"` type (Line 50).
- **API**:
    - `app/api/notifications/`: Infrastructure exists for triggering notifications.

#### Phase 0: Historical Context
- **Dependencies**: Tiptap core extensions are already in `package.json`.
- **Recent Changes**: 
    - `ResidentInviteSelector.tsx` was recently refactored (Jan 17) to fix Neighbor List type and data mapping.
    - Notification system was hardened (Jan 20) for Alpha Cohort reliability.
    - Tiptap was integrated into `document-form.tsx` for admin use.
- **Risk/Regression**: Need to ensure rich text parsing doesn't break existing plain-text descriptions in the database.

🔁 [PHASE 0 COMPLETE] Handing off to Security Auditor...

### Phase 1: Vibe & Security Audit

#### Vibe Check
- **Backend-First**: Implementation must ensure that mention parsing and notification triggers happen in Server Actions, not on the client.
- **Zero Policy RLS**: Database policies for `notifications` must strictly enforce `recipient_id = auth.uid()`.
- **Premium Design**: Mentions in the UI must use "Chip" style (Tiptap Mentions) with smooth transitions, adhering to the project's aesthetic standards.

#### Attack Surface
- **Stored XSS (Critical)**:
    - **Risk**: Current implementation of `createEvent` and `createExchangeListing` does not sanitize the `description` field. rendering uses `dangerouslySetInnerHTML`.
    - **Vector**: Tiptap mentions generate HTML nodes (e.g., `<span data-type="mention">`). An attacker could manipulate this to inject scripts.
    - **Mitigation**: **MANDATORY**: Use `isomorphic-dompurify` to sanitize HTML on the server during the `create/update` actions.
- **PII Leak (High)**:
    - **Risk**: The autocomplete for mentions must not leak sensitive data (email, phone).
    - **Status**: `getResidents` correctly limits fields to `id`, `first_name`, `last_name`, and `profile_picture_url`.
- **Broken Access Control (Medium)**:
    - **Risk**: Tagging users in other neighborhoods or tenants.
    - **Status**: Prevented by `tenant_id` mandatory filter in fetching residents.
- **Notification Spam (Medium)**:
    - **Risk**: Re-tagging the same user in updates to trigger multiple notifications.
    - **Remediation**: Logic must deduplicate mentions and only notify "new" mentions compared to the previous state.

🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...

### Phase 2: Test Strategy

#### Unit & Integration Tests (Vitest)
- **Mention Parsing**:
    - Test `extractMentions(html: string)` to correctly return an array of unique User IDs.
    - Handle edge cases: No mentions, invalid IDs, duplicate mentions.
- **HTML Sanitization**:
    - Test that `DOMPurify.sanitize()` preserves `<span data-type="mention" data-id="...">` while stripping unsafe attributes (e.g., `onclick`).
- **Notification Logic**:
    - Mock Supabase and verify `createNotification` is called with `type: 'mention'` for each tagged user.

#### Component Testing (Storybook)
- **Autocomplete Trigger**:
    - Verify typing `@` in the editor opens the resident selection dropdown.
- **Selection Behavior**:
    - Verify clicking a user inserts the mention chip.
    - Verify searching in the dropdown filters residents.
- **Mobile UX**:
    - Ensure the mention dropdown is accessible and scrollable on mobile screen sizes.

#### E2E / Manual Verification
- **Full Flow**:
    1. Resident A creates an event and tags Resident B.
    2. Backend triggers a mention notification.
    3. Resident B receives a real-time notification/sees it in their list.
    4. Clicking the notification navigates Resident B to the event details.
- **Security Check**:
    - Attempt to inject `<script>` tags via the mention display name and verify they are escaped/sanitized.

🔁 [PHASE 2 COMPLETE] Handing off to Performance Engineer...

### Phase 3: Performance Assessment

#### Real-time Lookup
- **Risk**: Fetching all residents in a tenant (`getResidents`) for every mention autocomplete.
- **Assessment**: Current communities are small (< 500 residents). In-memory filtering (current `ResidentInviteSelector` pattern) is acceptable for V1.
- **Scalability**: If tenant size exceeds 1k residents, Autocomplete should shift to a server-side search with a 300ms debounce.

#### Backend Handshake
- **Risk**: Sequential notification inserts blocking the server action.
- **Assessment**: `createEvent` and `createCheckIn` are already complex.
- **Optimization**: **MANDATORY**: Mention notification triggers must be batched using a single `supabase.from('notifications').insert(payloads)` call to minimize round trips.

#### Client Rendering
- **Risk**: Heavy DOM overhead from multiple TipTap mentions.
- **Assessment**: Uses lightweight chips. No significant risk identified for typical usage (1-5 mentions per post).

#### Database Indexing
- **Verification**: Ensure `notifications` table has indices on `target_id` and `type` to maintain high performance in the Activity Feed as mention volume grows.

🔁 [PHASE 3 COMPLETE] Handing off to Documentation Lead...

### Phase 4: Documentation Logic

#### Codebase Docs
- **Rich Text Standards**: Update `docs/07-product/00_audits/` (or create `docs/08-technical/tiptap-mentions.md`) to define the standard for handling rich text descriptions:
    - HTML Sanitization via `DOMPurify`.
    - Mention node structure (`span[data-id]`).
- **Notification Schema**: Document the `mention` notification type in `types/notifications.ts` (inline) and any relevant architectural docs.

#### User Orientation
- **Tooltips**: Add a small tooltip or "Editor Tip" in the UI: *"Type @ to mention a neighbor"*.
- **Product Updates**: Draft a community announcement template: *"New Feature: You can now tag neighbors in your events and check-ins!"*

#### API Reference
- **Server Actions**: Update documentation for `createEvent` and `createCheckIn` to reflect that `description` now accepts HTML and triggers secondary actions (notifications).

🔁 [PHASE 4 COMPLETE] Handing off to Product Manager...

### Phase 5: Strategic Alignment & Decision

#### Decision Record
- **Selected Path**: **Option 2: Headless Rich Text (Tiptap)**.
- **Rationale**: Best balance of UX (chip-style mentions) and data integrity (structured mention nodes). Preferred over plain text metadata to avoid fragile regex-based parsing on the client.
- **Classification**: 
    - **Sizing**: **L** (Large) - Involves cross-cutting changes to editor, actions, and notification system.
    - **Complexity**: High (Security/XSS risk Management).
- **Recommendation**: **PRIORITIZE** (Move to "Ready for Development"). Mentions are a core catalyst for social activity in the neighborhood.

#### Strategic Recommendations
1.  **Safety First**: Implementation **MUST** include a parallel fix for the existing Stored XSS vulnerability in `events` and `check-ins`.
2.  **Notification Batching**: Do not ship without batched notification triggers to avoid performance degradation as neighbor lists grow.
3.  **V1 vs V2**:
    - **V1 (MVP)**: Tagging individual residents in Events and Check-in descriptions.
    - **V2 (Future)**: Tagging "Family Units" or "Neighbor Lists" (e.g., `@Board-Members`, `@West-Wing`).

#### Go-No-Go Criteria
- [ ] Tiptap mention extension successfully integrated into `RichTextEditor`.
- [ ] `DOMPurify` sanitization verified in `createEvent` action.
- [ ] Notifications triggered and received in the Dashboard.

🏁 [PROTOCOL COMPLETE] Specification is now **READY FOR DEVELOPMENT**.

---
