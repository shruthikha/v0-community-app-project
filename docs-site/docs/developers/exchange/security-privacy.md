---
title: Security & Privacy
sidebar_position: 4
---

# Security & Privacy

The Exchange feature implements a strictly controlled multi-tenant security model to protect resident data and manage neighborhood scoping.

## 🛡️ Row Level Security (RLS)
Supabase RLS policies ensure that users only interact with content relevant to their community.

### `SELECT` Access
- **Community Scoped**: Visible to all `authenticated` users within the same `tenant_id`.
- **Neighborhood Scoped**: Restricted via a join to `neighborhood_associations`. Users must be members of the same neighborhood as the listing to view it.
- **Status Filter**: Standard users can only select listings where `status === 'published'`.

### `INSERT/UPDATE` Access
- **Creators Only**: Users can only modify listings where `created_by === auth.uid()`.
- **Lock-in Period**: Once a transaction is in the `picked_up` state, the listing creator is locked from editing core primary fields (title/description) to maintain the integrity of the borrower's agreement.

---

## 🚩 Moderation & Flagging
Residents can flag any listing they find inappropriate or inaccurate.

- **Storage**: Flags are stored in the `exchange_flags` table, linked to both the listing and the reporter.
- **Admin Visibility**: Flag counts are surfaced in the **Admin Exchange Table**.
- **Admin Actions**: Tenant admins have bypass permissions to `UPDATE` (Archive) or `DELETE` any listing regardless of ownership.

---

## 📍 Privacy Scoping
- **Listing Location**: Only generalized neighborhood data is disclosed in the listing. Specific household numbers are never automatically shared; residents must coordinate exact hand-over locations via the app's messaging system.
