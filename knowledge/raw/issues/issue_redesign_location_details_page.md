# Redesign location / lot details page

**Status:** Backlog  
**Priority:** Medium  
**Labels:** enhancement, ux

---

## Problem

The lot details page (`/t/{slug}/dashboard/locations/[id]`) has too many stacked sections (14+) which creates a poor UX, especially on mobile.

### Current Issues

1. **No mobile-friendly lot info** — Neighborhood card is `hidden md:block`, missing on mobile entirely
2. **Lot photos hidden** — Only show if `> 1 photo` (1 photo or hero-only gets hidden)
3. **Fragmented lot info** — Lot number in neighborhood card, photos in separate gallery section
4. **No visual hierarchy** — Everything is vertically-stacked cards with no grouping
5. **Poor mobile experience** — Users must scroll through everything to find what they need

### Page Structure (Current)

```
- Header (title, badges, actions)
- Hero image
- Description
- Facility details (if facility)
- Upcoming reservations (if facility)
- Walking path details (if walking path)
- Neighborhood card (desktop only!)
- Residents
- Pets
- Events section
- Check-ins section
- Exchange section
- Photo gallery (location)
- Photo gallery (lot home photos)
```

There are 14+ vertically-stacked cards/sections with no logical grouping or hierarchy.

---

## Goals for Redesign

- [ ] Create logical content groupings (lot info, people, activity, media)
- [ ] Make all lot-relevant content visible on mobile
- [ ] Integrate lot photos into main flow instead of separate gallery
- [ ] Add visual hierarchy (tabs, accordions, or collapsible sections)
- [ ] Improve information architecture

### Questions to Answer

1. Should we use tabs, accordions, or a single-page scroll?
2. How do we want to handle the different location types (facility, lot, walking path, neighborhood)?
3. What's the priority order of information for residents vs. admins?

---

## Out of Scope

- Backend logic changes
- New features (just redesign the existing page)
- Database changes

---

## Related

- Related to Issue #66: Residential Lot Images (lot photos feature)