source: requirement
imported_date: 2026-04-08
---
# Requirements: Community Activity Notifications

## Problem Statement
Residents want to stay informed about community updates and changes without having to manually check every page. Currently, when admins publish official documents or announcements, or when neighbors add new skills/interests, there is no automated notification or feed update, leading to missed information and reduced community engagement.

## User Persona
- **Residents**: Want to know when new information (documents, announcements) available or when neighbors share new skills.
- **Admins**: Want to ensure their community-wide announcements and documents reach all residents effectively.

## Context & Constraints
- **Scope**: Announcements, Official Documents, Skills, and Interests.
- **Targeting**: All community members must be notified.
- **Delivery Channels**:
    - **Announcements & Official Docs**: Priority Feed + Notifications System.
    - **Skills & Interests**: In-app notifications (toasts) only.
- **Priority**: All these events are considered high-priority updates.

## User Stories
- **US-1**: As a Resident, I want to see a new Official Document in my Priority Feed so I don't miss important community rules or guides.
- **US-2**: As a Resident, I want to receive a notification when a new community-wide announcement is published.
- **US-3**: As a Resident, I want to see a temporary notification (toast) when a neighbor adds a new skill or interest so I can discover new community talents.

## Technical Requirements
1. **Notification Triggers**:
    - Hook into `createAnnouncement` / `publishAnnouncement` server actions.
    - Hook into `createDocument` server action.
    - Hook into skill/interest creation logic (likely in profile actions).
2. **Priority Feed Integration**:
    - Insert records into a `feed_items` or similar table (to be verified in Phase 2).
    - Ensure these items appear in the `PriorityFeed` component.
3. **Notification System Integration**:
    - Call `createNotification` server action for all residents.
    - For Skills/Interests, ensure the notification type is handled as an ephemeral toast in the UI.

## Dependencies & Related Work
- **Existing Systems**: `notifications` table, `PriorityFeed` component, `Announcements` system, `Documents` system.
- **Related Issues**:
    - #141 [Brainstorm] View announcement archive leads to 404 (Announcements UI cleanup).
    - #113 [Brainstorm] Mapbox Cleanup & Facility Icons (Map updates).

## Technical Options

### 1. Simple Sequential Broadcast (Option A)
- **Description**: Fetch residents and loop over them to create notifications.
- **Pros**: Implementation speed, low complexity.
- **Cons**: Scale risk (Performance O(N)).
- **Effort**: S

### 2. Bulk Database Insert (Option B)
- **Description**: Use Supabase bulk insert for notifications.
- **Pros**: Much faster than sequential, atomic, scalable.
- **Cons**: Slightly more complex logic for batching.
- **Effort**: M

### 3. Server-Side Polling (Option C)
- **Description**: Real-time subscriptions for toasts.
- **Pros**: Instant feedback.
- **Cons**: High database resource usage (Realtime channels).
- **Effort**: L

## Recommendation
**Option B (Bulk Database Insert)** is recommended for the notification engine, combined with a polling-based `useCommunityActivity` hook for the frontend toasts. This balances performance and real-time responsiveness.

## Phase 3 Metadata
- **Priority**: P1
- **Size**: M
- **Horizon**: Q1 26

## Documentation Gaps
- TBD: Check `PriorityFeed` implementation details for custom item types.
- TBD: Verify if `createNotification` can broadcast to all users efficiently.

## Artifact Link

## 8. Technical Review


## 8. Technical Review (Phases 0-5 Summary)

### 8.1. Context & Architecture (Phase 0)
- **Status**: Mapped impact across `announcements.ts`, `documents.ts`, `interests.ts`, `profile.ts`, and `priority/route.ts`.
- **Finding**: Announcements already use bulk patterns; Documents use inefficient sequential loops.

### 8.2. Security Audit (Phase 1)
- **Critical Risk**: `createInterestAction` in `interests.ts` lacks authentication and tenant-affinity checks. 
- **Pattern**: RLS is verified for base tables, but Server Actions require hardening to prevent cross-tenant data leakage via PII.

### 8.3. Test Strategy (Phase 2)
- **Strategy**: Vitest for bulk logic verification, integration testing for the Priority API, and E2E for dashboard toast verification.

### 8.4. Performance Assessment (Phase 3)
- **SLA Risk**: The Priority Feed API is currently sequential. Refactor to `Promise.all` is required to hit < 200ms SLA.
- **Scalability**: Bulk inserts for Document notifications will reduce DB roundtrips from $N$ to 1.

### 8.5. Documentation Gaps (Phase 4)
- **Missing**: Notification Standards (`docs/06-decisions/0004-notification-standards.md`) and a central Trigger Registry.
- **Action**: Updated `docs/documentation_gaps.md`.

### 8.6. Final Strategic Alignment (Phase 5)
- **Verdict**: **READY FOR DEVELOPMENT**.
- **Implementation Path**: 1. Harden Auth -> 2. Bulk Refactor -> 3. API Parallelization -> 4. UI/Icon support.
