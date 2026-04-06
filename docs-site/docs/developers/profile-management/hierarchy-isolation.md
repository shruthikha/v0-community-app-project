---
title: Profile Hierarchy & Thread Isolation
sidebar_label: Data & Security
---

# Profile Data Hierarchy & Río Thread Isolation

Understanding how resident data is structured and isolated is critical for maintaining community privacy and ensuring that Río conversations remain strictly private to the resident.

## 1. The Multi-Tenancy Data Model

Nido uses a hierarchical model to organize community data:

- **Tenant**: The top-level community entity (e.g., "Riverside Community").
- **Lot**: A physical location within the community (identified by `lot_number`).
- **Family Unit**: A logical grouping of residents and pets linked to a Lot.
- **User (Resident)**: An individual profile linked to a `Family Unit`.

### Relationships
- `profiles` (managed via Supabase Auth) map 1:1 to `users`.
- `users` belong to one `family_units` (via `family_unit_id`).
- `family_units` are linked to one `lots` (via `lot_id`).

---

## 2. Privacy Filtering Logic

Public visibility is governed by the `user_privacy_settings` table. When fetching profiles for the directory, the `applyPrivacyFilter` utility (`lib/privacy-utils.ts`) is invoked.

### How it works:
1. **Fetch Settings**: Retrieves the target user's toggles (e.g., `show_email: false`).
2. **Determine Relationship**: Checks if the viewer is in the same Household, a Neighbor, or an Admin.
3. **Apply Mask**:
   - **Internal Fields**: Always visible to Admins.
   - **Private Fields**: Masked if toggled off, UNLESS the viewer is in the same Household.
   - **Public Fields**: Name, Lot, and Profile Picture are always visible to established community members.

---

## 3. Río Thread Isolation

Río ensures that conversations are private by isolating threads at the infrastructure level using **Mastra** and standard **RLS**.

### Thread ID Namespacing
To prevent accidental data leakage, thread IDs are generated using a namespaced format:
`tenant:{tenantSlug}:user:{userId}:thread:{originalId}`

This is handled by the `generateTenantThreadId` utility in `packages/rio-agent/src/lib/thread-store.ts`.

### Persistence & Memory Retrieval
- **Scoped Recall**: When Río searches for "Memory" (facts learned about a resident), it uses a `userId` filter in the PgVector query.
- **Context Injection**: Resident profiles are injected into the agent's working memory at runtime using the `x-resident-context` header. Facts learned during chat are stored with a strict `user_id` foreign key.

:::important
Even if a resident makes their profile "Public" in the directory, their **Río Chat History** and **Private Facts** remain isolated and are never visible to other neighbors or included in global community embeddings.
:::
