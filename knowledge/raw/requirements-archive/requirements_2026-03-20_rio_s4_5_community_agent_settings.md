source: requirement
imported_date: 2026-04-08
---
# Requirements: Río S4.5–4.6 — Community Agent Settings Page + Feature Toggles

**Issue**: [#200](https://github.com/mjcr88/v0-community-app-project/issues/200)
**Epic**: [#162 — Río AI Sprint 4: Admin Experience](https://github.com/mjcr88/v0-community-app-project/issues/162)
**Sprint**: Sprint 10
**Date**: 2026-03-20

---

## Context

Tenant admins need a UI to configure their community agent's persona (Prompt Tier 2) and to enable or disable AI features per tenant. This is an independent track from the ingestion work and can be built in parallel.

## Problem Statement

Currently, Río's Tier 2 prompt and feature flags can only be changed via direct database edits or seeding scripts. Admins need a self-service settings page.

## User Personas

- **Tenant Admin**: Wants to customize how the AI presents itself to residents — name, tone, language, policies — and control feature availability.

## Dependencies

- **Independent** — can be built in parallel with S4.0 → S4.4 chain.
- **Reads from**: `rio_configurations` table, `tenants.features` JSONB.
- **Writes to**: Same, via `updateRioSettings()` server action.

## Key Design Decisions

1. **Route**: `/t/[slug]/admin/rio/settings` — follows tenanted admin pattern.
2. **Nav**: New "Community Agent" item added to the admin sidebar (`app/t/[slug]/admin/layout.tsx`).
3. **Injection filter**: Applied server-side before writing any prompt field. Blocks known prompt injection patterns.
4. **No sandbox/test in this sprint**: The "Test in Sandbox" feature (original S4.7) is deferred until the chat interface (Sprint 11) is available.

## Functional Requirements

- **FR1**: Settings page loads with current values from `rio_configurations` and `tenants.features`.
- **FR2**: Admin can update persona prompt, tone, language, sign-off, community policies, and emergency contacts.
- **FR3**: `rag_enabled` and `memory_enabled` toggles update `tenants.features.$rio` without page reload.
- **FR4**: Character limit of 2,000 chars on persona prompt and policies fields, enforced with a visible counter.
- **FR5**: A "Community Agent" nav link appears in the admin sidebar.
- **FR6**: The route is admin-only — residents receive 403.

## Security Requirements

- **SR1**: Server-side injection filter (in `updateRioSettings()` action) rejects prompts containing:
  - `"ignore previous instructions"`
  - `"you are now (a|an)"`
  - `"disregard (your|all) (training|instructions)"`
  - `"act as (a|an|if)"`
  - `"forget (everything|all) (you|your)"`
- **SR2**: Return 400 with a human-readable message when injection is detected.
- **SR3**: `raw_app_meta_data` (not `user_metadata`) used for role checks.

## Technical Requirements

| File | Change |
|---|---|
| `app/t/[slug]/admin/rio/settings/page.tsx` | [NEW] Server Component: fetches config + features |
| `components/admin/rio-settings-form.tsx` | [NEW] Client form with Zod validation + char counters |
| `app/actions/rio-settings.ts` | [NEW] `updateRioSettings()` server action with injection filter |
| `components/admin/feature-toggles.tsx` | [NEW] Toggle switches for `rag_enabled`, `memory_enabled` |
| `app/t/[slug]/admin/layout.tsx` | [MODIFY] Add "Community Agent" nav link |
| `lib/injection-filter.ts` | [NEW] `containsInjection(text: string): boolean` |

## Acceptance Criteria

- [ ] AC1: Page loads with current persona prompt and feature toggles from the database.
- [ ] AC2: Updating persona prompt and saving → `rio_configurations.system_prompt` updated.
- [ ] AC3: Toggling `rag_enabled` to false → `tenants.features.$rio.rag = false` updated.
- [ ] AC4: Submitting a prompt with `"ignore previous instructions"` → validation error, save rejected.
- [ ] AC5: Policies field enforces 2,000 char limit with visible counter.
- [ ] AC6: "Community Agent" appears in admin sidebar nav.
- [ ] AC7: Resident accessing the route → 403 redirect.

## Classification

- **Priority**: P1
- **Size**: M (1–2 days estimated)
- **Branch**: `feat/sprint-10-rio-admin`
