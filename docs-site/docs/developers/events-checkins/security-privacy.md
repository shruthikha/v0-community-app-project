# Security & Privacy

This document outlines the security measures and privacy controls enforced within the Events and Check-ins systems.

---

## 🛡️ Row Level Security (RLS)

All tables use strict RLS policies bound to the authenticated user's `tenant_id` and role.

### Visibility Enforcement
Queries for events and check-ins are wrapped in a visibility filter that checks:
1.  **Community-wide**: Always returns true for members of the resident's tenant.
2.  **Neighborhood-specific**: Checks if the resident's `neighborhood_id` matches the event's `visibility_target_ids`.
3.  **Private/Restricted**: 
    - Verifies if the resident is explicitly invited.
    - Verifies if the resident's **Family Unit** is invited.
    - Verifies if the resident is part of a **Neighbor List** that was invited.

---

## 🔐 PII Handling

- **Creator Information**: Resident names and profiles are only visible to other residents if they haven't explicitly set their profile to "Private" in the Privacy Settings.
- **Location Privacy**: For private household events, precise coordinates are only revealed to verified invitees.

---

## 🚫 Abuse Prevention

- **Rate Limiting**: Checks-ins are limited to avoid map spam.
- **Flagging**: A community-driven moderation system allows residents to report inappropriate events, triggering admin notification and dashboard visibility.
- **Input Sanitization**: All description and custom location label fields are sanitized via Supabase/PostgreSQL hooks before persistence.
