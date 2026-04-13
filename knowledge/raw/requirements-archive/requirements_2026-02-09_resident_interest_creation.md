source: requirement
imported_date: 2026-04-08
---
# Requirements: Resident Interest Creation & Directory Search Fix

## 1. Problem Statement

Two issues need to be addressed regarding the **Interests** feature:

### 1A. Interest Creation is Admin-Only
Currently, only admins can create interest categories via the admin panel (`/admin/interests/create`). Residents can only **select** from the admin-curated list during onboarding and in their profile. This creates a bottleneck — residents cannot express interests that haven't been pre-defined by an admin.

**Skills** already provide the desired UX: residents click the search field → see all available options as a dropdown → type to progressively filter the list → if no match exists, a **"Create '[typed text]'"** button appears. The `skills` table has an RLS `INSERT` policy for all users. Interests should mirror this exact interaction pattern.

### 1B. Neighbor Directory Search by Interest Doesn't Work
The neighbor directory has an "Interests" filter section (UI exists at `neighbours-page-client.tsx:516-526`) and the client-side filtering logic is implemented (lines 168-171). However, the filter may not work correctly because:

- The `allInterests` prop is populated from the `interests` table (admin-created only).
- If few or no admin-created interests exist, the filter dropdown is empty.
- The `applyPrivacyFilter` may strip `user_interests` data when `show_interests` is false, causing filter mismatch.
- The text search (lines 152-153) also checks `user_interests` for name matching.

Once interests are user-created (like skills), the `allInterests` list will be populated naturally, and the filter should begin working. However, a data-fetching approach similar to how `uniqueSkills` is derived (from resident data) may be more reliable.

## 2. User Persona

- **Resident (Ana)**: Wants to add her own interests (e.g., "Bird Watching", "Pottery") during onboarding or profile editing, even if an admin hasn't pre-defined them. Wants to find neighbors with similar interests via the directory.
- **Admin (Marcus)**: Currently the sole creator of interests. After this change, admins retain the ability to manage (edit/delete) interests, but creation is no longer admin-exclusive.

## 3. User Stories

- **INT-1**: As a Resident, I want to create new interests from the onboarding flow so I can express my personal hobbies without waiting for an admin.
- **INT-2**: As a Resident, I want to search for neighbors by interest in the directory so I can find like-minded community members.
- **INT-3**: As a Resident, I want newly created interests to be immediately available so other residents can also select them.

## 4. Context & Scope

### Current Architecture

| Aspect | Interests (Current) | Skills (Reference) |
|--------|--------------------|--------------------|
| **Creation** | Admin-only (admin panel) | Resident + Admin |
| **RLS INSERT** | Admin-only `FOR ALL` | Users: `FOR INSERT WITH CHECK (true)` |
| **Onboarding Form** | Select-only (`interests-form.tsx`) | Select + Create (`skills-form.tsx`) |
| **"Open to help"** | N/A | Yes (`open_to_requests` toggle) |
| **Directory Filter** | UI exists, may not work | Works (derives from `user_skills`) |
| **Admin CRUD** | Full admin panel | No dedicated admin panel |

### Files Involved

| File | Role |
|------|------|
| `app/t/[slug]/onboarding/interests/interests-form.tsx` | Onboarding form (needs create capability) |
| `app/t/[slug]/admin/interests/` | Admin CRUD pages (keep as-is) |
| `app/t/[slug]/dashboard/neighbours/neighbours-page-client.tsx` | Directory filters (fix interest search) |
| `app/t/[slug]/dashboard/neighbours/page.tsx` | Server-side data fetching |
| `app/t/[slug]/dashboard/settings/profile/` | Profile editing (needs create capability) |
| `scripts/014_create_interests_table.sql` | DB schema (needs INSERT policy) |

### What Changes, What Stays

- ✅ **Keep**: Admin interest management (edit, delete) in admin panel
- ✅ **Keep**: Interest selection UI pattern (search + select)
- ✅ **Add**: Resident ability to create new interests (like skills)
- ✅ **Fix**: Directory search/filter by interests
- ❌ **Not needed**: "Open to help" toggle (interests don't have this, unlike skills)

## 5. Dependencies

| Issue | Title | Relationship |
|-------|-------|-------------|
| #69 | [Brainstorm] Neighbor Directory Tab Alignment | Same page, non-blocking |
| #71 | [Brainstorm] Admin UI Redesign | Admin interests page affected, non-blocking |
| None | No blocking dependencies | — |

## 6. Issue Context

> **Documentation Gap**: No current documentation exists for the interests/skills domain model or the admin content management flows. Added to `documentation_gaps.md`.

---

## 7. Technical Options

### Option 1: Mirror Skills Pattern (Direct Port)

Replicate the exact interaction pattern from `skills-form.tsx` into `interests-form.tsx`:

**UX Flow:**
1. Resident clicks search field → **dropdown shows all available interests**
2. Typing progressively **filters the dropdown** via `includes()` match
3. If no match → **"Create '[typed text]'"** button appears at top of results
4. Click "Create" → inserts into DB, auto-selects, clears search

**Technical Changes:**
1. **RLS**: Add `CREATE POLICY "Users can create interests" ON interests FOR INSERT WITH CHECK (true)` via migration.
2. **`interests-form.tsx`**: Port `handleCreateInterest` function, search input with progressive filter, "Create" fallback button, and state management (~30 lines from `skills-form.tsx`).
3. **Directory**: Update `allInterests` to derive from resident data (like `uniqueSkills`) instead of a separate query.

| Pros | Cons |
|------|------|
| Proven UX pattern (skills already work this way) | Allows any text as an interest (no validation) |
| Minimal code — port ~30 lines from skills | `UNIQUE(tenant_id, name)` constraint handles exact dupes |
| Fastest to implement | Admin interests page becomes partially redundant |

**Effort**: XS (~2-4 hours)

---

### Option 2: Combobox with Fuzzy Match

Same RLS change as Option 1, but add fuzzy matching to prevent near-duplicates.

**Changes:**
1. **RLS**: Same `INSERT` policy as Option 1.
2. **`interests-form.tsx`**: Replace simple search with a combobox that uses `string.includes()` or Levenshtein distance to suggest existing matches before offering "Create new".
3. **Directory**: Same `allInterests` derivation as Option 1.

| Pros | Cons |
|------|------|
| Reduces duplicates ("Yoga" suggested when typing "yoga") | More complex UI component |
| Better UX for discovery | Fuzzy logic adds edge cases |
| Still no moderation bottleneck | Over-engineering for alpha phase |

**Effort**: S (~4-8 hours)

---

### Option 3: Moderated Creation (Request + Approve)

Residents request new interests, admins approve them before they become available.

**Changes:**
1. **New table**: `interest_requests` with `status` (pending/approved/rejected).
2. **`interests-form.tsx`**: "Request" button instead of "Create", toast notification.
3. **Admin panel**: New approval queue page.
4. **Directory**: No change needed (only approved interests appear).

| Pros | Cons |
|------|------|
| Full admin control over taxonomy | Defeats purpose — user confirmed no moderation |
| Clean interest list | Significant development effort |
| | Blocks resident discovery until admin acts |

**Effort**: M (~1 sprint)

---

## 8. Recommendation

> **Option 1: Mirror Skills Pattern** is recommended.

### Justification

The user explicitly confirmed: *"the same as skills, immediately available."* This eliminates Option 3. Option 2 adds complexity for a problem (duplicates) that isn't critical at the alpha stage — admins can always clean up the `interests` table via the existing admin panel.

Option 1 is battle-tested (skills have used this pattern since launch), requires minimal code changes (~30 new lines + 1 migration), and maintains architectural consistency across the skills/interests domain.

### Duplicate Mitigation (Built-in)

The `interests` table already has a `UNIQUE(tenant_id, name)` constraint. Combined with the case-insensitive search in the form's filter, this provides basic duplicate prevention without additional work.

### Classification

| Property | Value |
|----------|-------|
| **Priority** | P2 — Medium (UX improvement, not a blocker) |
| **Size** | XS — Extra Small (~2-4 hours) |
| **Horizon** | Now — Alpha feature |
| **Risk** | Low — proven pattern, no new tables |

### Implementation Summary

| Step | Change | File(s) |
|------|--------|---------|
| 1 | Add RLS `INSERT` policy for interests | New migration SQL |
| 2 | Add `handleCreateInterest` to onboarding form | `interests-form.tsx` |
| 3 | Add create capability to profile settings (if exists) | Profile interests form |
| 4 | Derive `allInterests` from resident data | `neighbours/page.tsx` |
| 5 | Verify directory filter works end-to-end | `neighbours-page-client.tsx` |

## 9. Technical Review Phase Results

### Phase 1: Vibe & Security Audit
- **Critical Finding**: The RLS policy for `resident_interests` is currently `FOR ALL` with `USING (true)`, meaning any resident can delete or modify any other resident's interest linkages.
- **Fix Required**: Change policy to `USING (auth.uid() = resident_id)` and add `CHECK` policy for inserts.
- **Interests Table**: Requires a new `INSERT` policy for residents to enable self-expression.

### Phase 2: Test Strategy
- **Unit Testing**: Add tests for `applyPrivacyFilter` to ensure `journey_stage` is correctly nulled when `show_journey_stage` is false.
- **Integration Testing**: Hardened RLS policies must be verified with multi-session testing (Tenant Admin vs. Resident A vs. Resident B).
- **Manual Verification**: Test interest creation flow specifically for deduplication and immediate availability.

### Phase 3: Performance Assessment
- **N+1 Avoidance**: Observed that fetched residents currently perform multiple sub-selects for interests/skills. Consider moving to a single optimized join if performance becomes a bottleneck.
- **Scalability**: For communities over 1000 residents, client-side filtering should be moved to server-side with pagination.

### Phase 4: Documentation Logic
- **Schema Updates**: `docs/02-technical/schema/tables/interests.md` needs to reflect resident-led creation.
- **User Documentation**: Resident profile settings guide needs update to mention "Create New Interest" capability.

### Phase 5: Strategic Alignment
- **Decision**: Mirroring the skills pattern is the most consistent and efficient path forward.
- **Impact**: Removes a major friction point for new communities during onboarding.
