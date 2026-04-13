source: requirement
imported_date: 2026-04-08
---
# Reply to Admin Messages - Resident Requests

## Problem Statement
When an admin responds to a Resident Request (e.g., "Does that work for you?"), the resident has no way to reply within the platform.
1.  **Dead End UX**: The communication channel is one-way (Admin -> Resident), forcing residents to email or call if the issue isn't truly resolved.
2.  **Operational Inefficiency**: Admins may mark items as "Resolved" when they are not, leading to multiple duplicate tickets.

## User Persona
*   **Primary**: Resident - Wants to confirm a resolution or provide extra details after an admin query.
*   **Secondary**: Admin - Wants to ensure the resident is satisfied before closing the ticket.

## Context & Background
Currently, the `resident_requests` table has a single `admin_reply` column. This limits the interaction to:
1.  Resident creates Request.
2.  Admin accepts/rejects or adds a single reply.
3.  End of flow.

**Desired State**:
A generic "Conversation" capability allowing back-and-forth messages on a request, while still maintaining specific process actions (like "Close Request").
*   **Visibility**: Comments should be private between Resident and Admin (unlike public post comments).

## Dependencies
*   **Database Schema**: Need a new `request_comments` table (one-to-many from `resident_requests`).
*   **Frontend**: Need a "Chat/Comment" UI in the Request Detail view.
*   **Notification System**: Notify Admin when Resident replies (and vice-versa).
*   **Security**: Ensure RLS (Row Level Security) strictly limits viewing these comments to the Request Owner and Admins.

## Issue Context
*   **Related Components**:
    *   `scripts/requests/01_create_resident_requests_table.sql` (Current schema).
    *   `app/t/[slug]/dashboard/requests/[requestId]/` (Current detail view).
*   **Missing Documentation**: No standardized "Comment System" exists yet; this might set the pattern for "Private Threading".

## Technical Options

### Option 1: Relational Child Table (`request_comments`)
Create a standard 1:N table `request_comments` linking to `resident_requests.id`.
*   **Schema**: `id`, `request_id`, `user_id`, `message`, `created_at`.
*   **Pros**:
    *   **Standard**: Clean interactions with RLS. easy to paginate.
    *   **Extensible**: Can add attachments/images to comments easily later.
*   **Cons**:
    *   **Refactor**: Must deprecate the existing `admin_reply` column (migrate it to the first comment).
*   **Effort**: Medium (M)

### Option 2: JSONB Append Log
Add a `history` JSONB column to `resident_requests` and append messages there.
*   **Pros**:
    *   **Speed**: No new table. Just one schema migration.
    *   **Atomic**: The entire conversation loads with the request.
*   **Cons**:
    *   **Querying**: Hard to query "all comments by User X".
    *   **RLS**: hard to secure individual messages (it's all or nothing).
    *   **Scalability**: Bad for long thread.
*   **Effort**: Low (S)

### Option 3: Unified "Messaging" System
Build a generic `conversations` and `messages` system, and link a Conversation to the Request.
*   **Pros**:
    *   **Reusable**: Can be used for DM (Direct Messages) between residents later.
*   **Cons**:
    *   **Over-engineering**: We don't have DMs yet. Building a full messaging platform just for this ticket is too much scope.
*   **Effort**: XL

### Option 4: Process-Flow Action Buttons (No Text)
Just add "Resolve" / "Re-open" buttons.
*   **Pros**: Very fast.
*   **Cons**: User explicitly rejected this ("Option 1 [Chat] is better").
*   **Effort**: Low (XS)

## Recommendation

### Selected Option: Option 1 (Relational Child Table)
We will implement **Option 1**. This is the standard pattern for ticket management systems.
*   **Migration**: We will migrate any existing `admin_reply` text into the new table as the first "Admin Comment".
*   **UX**: We will combine this with the user's request for "Buttons". The UI should have a text area for reply, AND explicit status buttons ("Close Ticket", "Re-open Ticket") that may or may not require a comment.

### Classification
*   **Priority**: P2 (Enhancement)
*   **Size**: M (Database migration + UI Component)
*   **Horizon**: Q2 26 (Post-Stability)

## 8. Technical Review

### Phase 0: Issue Details
*   **Title**: [Brainstorm] Reply to Admin Messages
*   **Summary**: Residents currently cannot reply to admin responses in Resident Requests. The proposed solution is to implement a conversation-style comment system.
*   **Selected Strategy**: Option 1 (Relational child table `request_comments`).
*   **Linked Requirement Doc**: `requirements_2026-01-25_reply_to_admin.md` (Self)

### Phase 0: Impact Map
*   **Schema**: New `request_comments` table needed.
*   **Data Layer**: `lib/data/resident-requests.ts`, `app/actions/resident-requests.ts`.
*   **Resident UI**: `app/t/[slug]/dashboard/requests/[requestId]/page.tsx`.
*   **Admin UI**: `app/t/[slug]/admin/requests/[requestId]/page.tsx`, `app/t/[slug]/admin/requests/admin-requests-table.tsx`.
*   **Types**: `types/requests.ts`, `types/notifications.ts`.

### Phase 0: Historical Context
*   **Recent Commits**: No existing "Reply to Admin" implementation found. Current `admin_reply` column is a simple text field.
*   **Regressions**: None identified; this is an greenfield enhancement for existing one-way communication.

### Phase 1: Security Audit
*   **Vibe Check (Backend-First)**: Implementation must use server actions for all mutations. RLS is the single source of truth for access control.
*   **Access Control (RLS)**:
    *   `SELECT`: `EXISTS (SELECT 1 FROM resident_requests WHERE id = request_id AND (created_by = auth.uid() OR role IN ('tenant_admin', 'super_admin')))`.
    *   `INSERT`: `auth.uid() = user_id` AND `EXISTS (SELECT 1 FROM resident_requests WHERE id = request_id AND (created_by = auth.uid() OR role IN ('tenant_admin', 'super_admin')))`.
    *   **Foreign Key**: `user_id` should reference `auth.users` (or `public.profiles` if 1:1) to ensure valid Supabase Auth linkage.
*   **Attack Surface**:
    *   **Comment Injection**: Validation on `message` length (min 1, max 2000) and character set.
    *   **Cross-Tenant Leakage**: Ensure `tenant_id` is validated through the linked request.

### Phase 2: Test Plan
*   **Sad Paths**:
    *   Unauthorized User: Attempt to post a comment on a request ID they don't own.
    *   Input Validation: Submit an empty comment or extreme length.
    *   Status Locking: Attempt to comment on a "Resolved" or "Rejected" request (if policy dictates closure).
*   **Test Strategy**:
    *   **Unit (Vitest)**: Mock Supabase client to verify that `addReply` server action correctly handles validation errors.
    *   **Integration (Supabase)**: Verify RLS policies by attempting cross-user `SELECT`/`INSERT` on `request_comments`.
    *   **E2E (Playwright)**:
        1. Resident submits request -> Admin replies -> Resident sees notification -> Resident replies back -> Admin sees reply.

### Phase 3: Performance Review
*   **Static Analysis**:
    *   **N+1 Risk**: Avoid fetching comments per-request in list views. Use `count` for preview or only fetch in detail view.
    *   **Indexing**: Mandatory index on `request_comments(request_id)` for fast retrieval in detail views.
    *   **Migration Impact**: Migrating `admin_reply` into `request_comments` will be a one-time operation.
*   **Live Introspection**: `resident_requests` is currently small, but as a core table, splitting comments out saves row-size overhead for the main list view.

### Phase 4: Documentation Plan
*   **User Manuals**:
    *   `docs/01-manuals/resident-guide/`: Add section on "Communicating with Admins regarding requests".
    *   `docs/01-manuals/admin-guide/`: Update request management section to include "Resident Conversations".
*   **Analytics**: Update `docs/02-technical/analytics/analytics-events.md` with `request_comment_added` (properties: `role`, `requestId`).
*   **Schema**:
    *   [NEW] `docs/02-technical/schema/tables/request_comments.md`.
    *   [MODIFY] `docs/02-technical/schema/tables/resident_requests.md` (mark `admin_reply` as deprecated).

### Phase 5: Strategic Alignment
*   **Conflicts Found**:
    *   **User Tagging (@mentions)**: High overlap. Comment UI should support tagging if tagging is implemented first.
    *   **Admin UI Redesign**: The request detail view in the admin panel is subject to change; styling must follow the new design system tokens.
*   **Sizing**: M (Medium)
*   **Decision**: **Prioritize** (Ready for Development).
    *   *Rationale*: Essential for closing the loop on resident feedback and reducing duplicate tickets.

## 9. Specification (Ready for Development)

### 🚀 Overview
Implement a back-and-forth messaging system for Resident Requests by introducing a `request_comments` table and updating UI components to support a conversation thread.

### 🏗️ Database Changes
```sql
CREATE TABLE request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES resident_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for detail view performance
CREATE INDEX idx_request_comments_request_id ON request_comments(request_id);

-- RLS: Only admins or the request creator can view/post
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;
```

### 🛠️ UI/UX Requirements
*   **Resident View**: Replace `admin_reply` block with a scrollable comment thread and a "Reply" text area.
*   **Admin View**: Add a "Conversation" tab or section to the request detail page.
*   **Status Integration**: Adding a comment should NOT automatically change request status unless explicit "Status + Comment" action is taken.

### 🔗 Notifications
*   Trigger `request_comment_added` notification for the other party (Admin or Resident).

✅ **[REVIEW COMPLETE] Issue "[Brainstorm] Reply to Admin Messages" is now Ready for Development.**
