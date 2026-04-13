source: requirement
imported_date: 2026-04-08
---
# Requirements: Check-in Comments

## Problem Statement
Users attending or interested in a Check-in (event) currently have no way to communicate with the host or other attendees within the app. There is a need for a social layer to facilitate coordination ("On my way!") and social interaction ("Can't wait!").

## User Persona
- **Attendee:** Wants to let the host know they are running late or ask a quick question.
- **Host:** Wants to see enthusiasm for their event and receive important updates from guests.

## Context
- **Feature:** Adds a "Comments" section to the Check-in Detail Modal.
- **Style:** Public comment board (not private DMs), similar to a Facebook post.
- **Threading:** Supports replies (threaded).
- **Visibility:** Inherits from Check-in visibility (Neighborhood vs. Private).
- **Notifications:** Only the Check-in Creator receives notifications for now.

## Dependencies
- **Existing Check-ins Table:** `check_ins`
- **Notifications System:** Need to hook into the existing notification infrastructure.
- **Reference:** User mentioned similar logic scoped for "Resident Requests".

## Issue Context
- **Related Logic:** Potential reuse of backend/frontend patterns from "replying to resident requests".

## Technical Options

### Option 1: Dedicated `check_in_comments` Table
Create a specific table linked only to `check_ins`.

**Schema:**
```sql
create table check_in_comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  check_in_id uuid references check_ins(id) on delete cascade,
  user_id uuid references auth.users(id),
  parent_id uuid references check_in_comments(id), -- For threading
  content text not null,
  created_at timestamptz default now()
);
```

| Pros | Cons | Effort |
|------|------|--------|
| **Simple RLS**: Policies directly check `check_ins` visibility. | **Siloed**: Cannot be easily reused for "Resident Requests". | Medium |
| **Referential Integrity**: Strong FK constraints. | **Duplicates**: Logic copied if we add comments elsewhere. | |
| **Performance**: Indexes are specific to check-ins. | | |

### Option 2: Polymorphic `comments` Table (Global)
Create a single `comments` table using `entity_type` and `entity_id`.

**Schema:**
```sql
create table comments (
  id uuid primary key,
  entity_type text check (entity_type in ('check_in', 'resident_request')),
  entity_id uuid, -- No FK constraint possible directly
  user_id uuid references auth.users(id),
  ...
);
```

| Pros | Cons | Effort |
|------|------|--------|
| **Reusable**: Immediately ready for "Resident Requests". | **Weak Integrity**: No DB-level FK enforcement on `entity_id`. | High |
| **Centralized**: One place for moderation/admin tools. | **Complex RLS**: Policies must dynamic query based on type. | |

### Option 3: Shared Table with Sparse Foreign Keys
A single `comments` table with specific nullable FK columns.

**Schema:**
```sql
create table comments (
  id uuid primary key,
  check_in_id uuid references check_ins(id),
  resident_request_id uuid references resident_requests(id),
  ...
  check (
    (check_in_id is not null)::int + 
    (resident_request_id is not null)::int = 1
  )
);
```

| Pros | Cons | Effort |
|------|------|--------|
| **Best of Both**: Reusable AND Strong Integrity. | **Maintenance**: Must add column for every new feature. | Medium |
| **Unified UI**: Same frontend component works everywhere. | **Sparse**: Table grows wide with nulls (negligible impact). | |

## Recommendation
**Option 3 (Shared Table with Sparse FKs)**.
It provides the reusability the user requested (for resident requests) without sacrificing database integrity or complicating RLS rules excessively. It perfectly bridges the gap between a siloed solution and a "too generic" polymorphic one.

### Classification
- **Priority:** P1
- **Size:** M
- **Horizon:** Q1 26

## 8. Technical Review

### Phase 0: Context Gathering
- **Issue**: [Brainstorm] Check-in Comments (Issue #79) [Link](https://github.com/mjcr88/v0-community-app-project/issues/79)
- **Goal**: Add social layer (comments/replies) to Check-ins.
- **Impact Map**:
    - **Schema**: `check_ins` (primary parent), potential new `comments` table.
    - **Frontend**: `components/check-ins/check-in-detail-modal.tsx` (UI for display/posting).
    - **Logic**: `lib/data/check-ins.ts` (data layer), `app/actions/check-ins.ts` (server actions).
- **Historical Context**:
    - `lib/data/check-ins.ts` refactored in WP1 (Nov 2025).
    - `check-in-detail-modal.tsx` stable, but critical for engagement.

### Phase 1: Security Audit
- **Vibe Check**: Passed. "Option 3" (Shared Table) allows standard RLS inheritance.
- **Attack Surface**:
    - **spam**: No rate limiting mentioned.
    - **moderation**: Needs definition (User delete own? Host delete any?).
    - **input**: Text content needs sanitization (handled by standard React/Supabase patterns).
- **RLS Requirements**:
    - **Select**: Inherit visibility from `check_ins`.
    - **Insert**: Verify access to parent `check_in`.
    - **Update/Delete**: Policies for owner (edit/delete) and host (moderate/delete).

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Unauthorized**: Commenting on private check-in without invite.
    - **Orphaned**: Replying to a deleted comment.
    - **Empty**: Submitting whitespace-only comment.
- **Test Plan**:
    - **Unit**: RLS policy tests (SQL).
    - **Integration**: `postComment` action (success/fail).
    - **E2E**: Full flow (Host creates -> Guest comments -> Thread updates).

### Phase 3: Performance Assessment
- **Schema**: Shared `comments` table.
- **Indexes**: MUST add index on `check_in_id` (and `resident_request_id` later) for efficient filtering.
- **N+1**: Fetching comments with user profiles. Solution: Use `select(*, user:user_id(*))` to fetch author details efficiently.
- **Constraint**: `chk_entity_type` constraint is lightweight.

### Phase 4: Documentation Logic
- **Manuals**: Update `resident-guide` to explain commenting features.
- **Schema**: Create `docs/02-technical/schema/tables/comments.md`.
- **Policies**: Create `docs/02-technical/schema/policies/comments.md` (MANDATORY).
- **Analytics**: Add `comment_posted` to `analytics-events.md`.
- **API**: Document `postComment` action in `api-reference.md`.

### Phase 4: Documentation Logic
- **Manuals**: Update `resident-guide` to explain commenting features.
- **Schema**: Create `docs/02-technical/schema/tables/comments.md`.
- **Policies**: Create `docs/02-technical/schema/policies/comments.md` (MANDATORY).
- **Analytics**: Add `comment_posted` to `analytics-events.md`.
- **API**: Document `postComment` action in `api-reference.md`.
