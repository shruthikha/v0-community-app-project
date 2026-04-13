---
source: prd
imported_date: 2026-04-08
---
# PRD: Sprint 5 - UX Polish & Bug Bash (2026-03-12)

## Goal Description
Sprint 5 focuses on stabilizing the mobile experience and resolving critical UX bugs discovered during the community beta. This is a "Bug Bash" sprint designed to improve perceived quality and fix high-friction onboarding steps before expanding the AI feature set.

## User Review Required
> [!IMPORTANT]
> **Single Branch Strategy**: All 7 issues will be developed on a single branch `fix/sprint-5-bug-bash` to expedite delivery and minimize conflict overhead in shared map components.
> [!WARNING]
> **Issue #116 Cleanup**: We are deleting the legacy `/dashboard/map` route. Redirects will be handled via Next.js middleware or a catch-all route.

## Selected Issues & Sizing

| Issue | Title | Type | Size |
|-------|-------|------|------|
| #116 | View on Map Refactor | UX | XS | [x] |
| #114 | Mapbox Cleanup & Icons | Parked | XS |
| #141 | Announcement Archive 404 | Bug | S | [x] |
| #140 | Family UI Overflow | Bug | S | [x] |
| #139 | Event Creation Test Icon | Polish | XS | [x] |
| #156 | List Member Visibility | Bug | S | [x] |
| #155 | Lot Search Fix | Bug | S | [x] |

## Architecture & Git Strategy

### Git Strategy
- **Branch**: `fix/sprint-5-bug-bash`
- **Merging**: Squash merge to `main` after full sprint validation.

### Technical Focus
- **Map Consolidation (#116, #114)**: Unify marker rendering in `MapboxViewer.tsx`. Remove `resident-map-client.tsx`.
- **UI Overflow (#140)**: Apply `overflow-hidden` and responsive padding to the member cards.
- **Search Logic (#155)**: Implement robust normalization for lot numbers (e.g., "D-401" vs "D401"). Also fix the "Reject" button visibility in the admin review modal.

## Verification Plan

### Automated Tests
- `npm run lint` & `type-check`
- Playwright smoke test for Map redirection and Lot search variants.

### Manual Verification
1. **Redirect**: Access `/dashboard/map` and verify it lands on `/dashboard/community-map`.
2. **Onboarding**: Complete "Request Access" using a non-standard lot number format.

## Acceptance Criteria
- [ ] **AC1**: Map markers for facilities display icons or emojis without duplication (#114).
- [ ] **AC2**: Family member cards do not cause horizontal scrolling on iPhone SE-sized screens (#140).
- [x] **AC3**: Lot search matches exact and partial strings regardless of spaces (#155).
- [x] **AC4**: All members are searchable in the List creation modal (#156).
- [x] **AC5**: Admin confirm rejection button is visible and correctly styled (#155).
- [x] **AC6**: Announcement "View All" and "View Archive" links correctly point to the Official page announcements tab (#141).
