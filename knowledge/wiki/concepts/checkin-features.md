---
title: Check-in Features
description: RSVP consistency, form refactor, comments system
categories: [events, check-in, ui]
sources: [requirements_2026-01-28_checkin_rsvp_consistency.md, requirements_2026-01-28_checkin_form_refactor.md, requirements_2026-01-28_checkin_comments.md]
---

# Check-in Features

## RSVP Consistency

Standardize Check-in RSVP with Events:

| Component | Pattern |
|-----------|---------|
| Buttons | 3-button group (Yes/Maybe/No) |
| Backend | `check_in_rsvps` already supports `'yes'`, `'maybe'`, `'no'` |
| Notifications | Compact DropdownMenu |

## Step-Based Forms

Refactor Check-in form to use steps (like Exchange Listings):

```
Step 1: What (Activity, Title, Description)
Step 2: When (Start Time, Duration)
Step 3: Where (Location)
Step 4: Who (Visibility)
Step 5: Review
```

## Comments System

Shared comments table with sparse foreign keys:

```sql
CREATE TABLE comments (
  id uuid PRIMARY KEY,
  check_in_id uuid REFERENCES check_ins(id),
  resident_request_id uuid REFERENCES resident_requests(id),
  -- ... constraint ensures exactly one is not null
);
```

---

## Related

- [series-events](../lessons/series-events.md)
- [server-actions](../patterns/server-actions.md)