---
source: prd
imported_date: 2026-04-08
---
# PRD: Sprint 6 - Community Engagement & Extensions (2026-03-12)

## Goal Description
Sprint 6 finishes the core "Community Dashboard" roadmap by adding social interaction layers (Comments), advanced marketplace features (Seeking Mode), and technical performance enhancements (Offline Map). This prepares the app for the Río AI launch in Sprint 7.

## User Review Required
> [!NOTE]
> **Shared Comments Infrastructure**: This sprint heavily utilizes the `comments` table. 
> **Offline Performance**: Issue #157 requires IndexedDB integration for Mapbox tile persistence.

## Selected Issues & Sizing

| Issue | Title | Type | Size |
|-------|-------|------|------|
| #115 | Profile Picture Cropping | UX | S |
| #66 | Residential Lot Images | Feature | M |
| #74 | Exchange Seeking Mode | Feature | S |
| #79 | Check-in Comments | Feature | M |
| #80 | Check-in Form Refactor | UX | S |
| #153 | Community Notifications | Feature | M |
| #157 | Offline Map Cache | Eng | L |

## Architecture & Git Strategy

### Git Strategy
- **Model**: Individual feature branches off `main`.
- **Naming**: `feat/{issue_number}-{summary}`.

### Technical Focus
- **Social Layer (#79, #153)**: Implement real-time notifications via Supabase Realtime when comments are added to check-ins.
- **Wizard Pattern (#80)**: Align the Check-in form with the step-based patterns used in Exchange.
- **Offline Map (#157)**: Use `mapbox-gl-offline-maps` or custom IndexedDB cache for tile persistence.

## Verification Plan

### Automated Tests
- Unit tests for the custom cropping logic (#115).
- RLS policy tests for Lot Image access (#66).

### Manual Verification
1. **Engagement**: Post a comment on a check-in and verify the host receives a browser notification.
2. **Offline**: Load the map, go airplane mode, refresh, and verify tiles still render at previously viewed zoom levels.

## Acceptance Criteria
- [ ] **AC1**: User can crop uploaded profile photos to a 1:1 ratio (#115).
- [ ] **AC2**: Exchange listings support "Seeking" type with distinct visual badges (#74).
- [ ] **AC3**: Check-in creation follows a 5-step wizard with data persistence (#80).
- [ ] **AC4**: Map functions correctly without internet access if tiles were cached (#157).
