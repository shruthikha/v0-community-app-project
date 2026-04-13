---
source: prd
imported_date: 2026-04-08
---
# Sprint 3 Implementation Plan (PRD)

**Date**: 2026-02-14
**Sprint Name**: Sprint 3 - Core Polish & Friction Reduction
**Sprint Start**: 2026-02-16

## 1. Executive Summary
Sprint 3 focuses on resolving critical authentication regressions (#108), system-wide Rich Text Editor (RTE) friction (#110), refining exchange module logic (#112, #113), and **updating the Product Tour (#117)**. Additionally, the "Rio" branding will be standardized across dashboard empty states (#98).

## 2. Issues & Sizing

| ID | Title | Priority | Size | Hours | Agent |
|----|-------|----------|------|-------|-------|
| #108 | [Bug] Double Login Regression | P0 | XS | 2-4h | `backend-specialist` |
| #110 | fix: Rich Text Editor Fixes | P1 | XS | 2-4h | `frontend-specialist` |
| #113 | Exchange Listing Constraints | P1 | XS | 2-4h | `backend-specialist` |
| #112 | Inventory Logic Refinement | P1 | S | 4-8h | `backend-specialist` |
| #117 | [Brainstorm] Product Tour Update 2026 | P1 | S | 4-8h | `frontend-specialist` |
| #98 | [Brainstorm] Rio Empty States | P2 | XS | 2-4h | `frontend-specialist` |

**Total Estimated Effort**: 16-32h (approx. 3-4 development days).

---

## 3. Architecture & Git Strategy

### Git Branching
- **Base Branch**: `main`
- **Feature Branches**: 
  - `feat/sprint-3/double-login-108`
  - `fix/sprint-3/rte-110`
  - `fix/sprint-3/exchange-constraints-113`
  - `feat/sprint-3/inventory-refinement-112`
  - `feat/sprint-3/product-tour-117`
  - `style/sprint-3/empty-states-98`
- **Merge Strategy**: Standard PR review with at least 1 approval.

### Pipeline & Infrastructure
- **CI/CD**: No new migration scripts required. Verification via `npm run lint` and `npx tsc --noEmit`.
- **Middleware**: #108 involves changes to `lib/supabase/middleware.ts`. **HIGH RISK**. Changes here affect every request in the application.

### Dependency Mapping
- **Shared Infrastructure**: `RichTextEditor.tsx` is used across multiple modules. Changes must be verified in both Onboarding and Dashboard contexts.
- **Model Dependencies**: #112 and #113 both touch the Exchange domain. #113 (type narrowing) should be implemented before #112 to ensure the backend logic uses the correct enum subset.

---

## 4. Implementation Details

### #108: Double Login Regression
- **Requirement**: Modify `lib/supabase/middleware.ts` to bypass the inactivity auto-logout check if `user.last_sign_in_at` is less than 60 seconds old.
- **Acceptance Criteria**:
  - [x] Given an expired session in an open tab, when the user logs in, they are redirected to the dashboard immediately on the first attempt.
  - [x] Normal inactivity logout still functions for sessions older than 60 seconds.

### #110: Rich Text Editor Fixes
- **Requirement**: Update `RichTextEditor.tsx` to handle synchronization gracefully (Option 1). Add Tailwind classes `[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5` to the editor props.
- **Acceptance Criteria**:
  - [ ] Spaces are preserved while typing in Any description field.
  - [ ] Bullet and numbered lists are visible in the editor and in detail views using standard typography.

### #113: Restrict Exchange Listing Types
- **Requirement**: Narrow `ExchangeCondition` and `ExchangePricingType` in `types/exchange.ts` to strictly match DB check constraints.
- **Acceptance Criteria**:
  - [x] Dropdowns in `CreateExchangeListingModal` and `EditExchangeListingModal` only show the valid DB subset.
  - [x] Attempting to save a listing no longer triggers "check constraint violation" errors.

### #112: Inventory Logic Refinement
- **Requirement**: Refine `markItemPickedUp` in `app/actions/exchange-transactions.ts`. 
  - IF category == "Food & Produce", do NOT restore inventory on completion.
  - IF category == "Services & Skills", continue restoring inventory.
- **Acceptance Criteria**:
  - [x] Completing a Food pickup does not increase listing quantity.
  - [x] Completing a Service pickup *does* increase listing quantity (freeing a slot).
  - [x] Cancelling a transaction *before* pickup still restores inventory for all types.

### #98: Rio Empty States
- **Requirement**: Extract a shared `RioEmptyState` component. Update all 6 dashboard widgets to use the new image (`rio_no_results_confused.png`) at 128px (w-32 h-32).
- **Acceptance Criteria**:
  - [ ] Consistent empty state UI across: Reservations, Events, Check-ins, Announcements, Exchange, and Requests.

### #117: Product Tour Update 2026
- **Requirement**: Update `TourCarousel` slides 1, 3, 4, 5, 6, 8, and 9 with new assets and copy.
- **Reference**: `docs/07-product/02_requirements/requirements_2026-02-15_product_tour_update.md`
- **Acceptance Criteria**:
  - [ ] **Slide 1**: Shows 8 icons (Family, Map, Events, Reservations + Marketplace, Directory, Requests, Announcements).
  - [ ] **Slide 3**: Displays "Feb festival" and "Construction guidelines" posted by "Ecovilla board & administration".
  - [ ] **Slide 4**: Neighbors have distinct avatars and correct desktop spacing.
  - [ ] **Slide 5**: Shows updated Map and Location screenshots.
  - [ ] **Slide 6**: Shows updated Events image and mentions "reservations".
  - [ ] **Slide 8**: Exchange story mentions "broader exchange economy".
  - [ ] **Slide 9**: Shows updated Request wizard step 1.
  - [ ] **Assets**: All new images load correctly from `/public/artifacts` without 404s.

---

## 5. Sprint Schedule

| Issue | Size | Est. Hours | Start Date | Target Date |
|-------|------|------------|------------|-------------|
| #108 | XS | 2-4h | 2026-02-16 | 2026-02-16 |
| #110 | XS | 2-4h | 2026-02-16 | 2026-02-17 |
| #113 | XS | 2-4h | 2026-02-17 | 2026-02-17 |
| #112 | S | 4-8h | 2026-02-17 | 2026-02-18 |
| #98 | XS | 2-4h | 2026-02-18 | 2026-02-18 |
| #117 | S | 4-8h | 2026-02-18 | 2026-02-19 |

---

## 6. Definition of Done (DoD)
- [ ] Code passes `npm run lint` & `npx tsc --noEmit`
- [ ] PR reviewed by at least 1 team member
- [ ] Manual QA verification completed per issue ACs
- [ ] No new P0/P1 bugs introduced
- [ ] Documentation updated (if applicable)

---

## 7. Release Notes

### Product Tour 2026 (#117)
🚀 **Product Tour 2026**
Updated the onboarding tour to reflect the latest Ecovilla features.

🗺️ **Updated Visuals**
Fresh maps, updated facility icons, and new "Exchange" transaction previews.

👥 **Community Focus**
New slides highlighting "Announcements" and "Documents" from the administration.


### Service & Food Inventory Logic (#112)
🚀 **Smart Inventory Management**
Improved tracking for exchange items to distinguish between consumables and services.

🍎 **Food & Produce**
Items in "Food & Produce" are now treated as one-time use (consumable). They will no longer restore inventory upon return/pickup.

🛠️ **Services & Skills**
Service listings correctly restore availability when a transaction is completed or cancelled, allowing for recurring appointments.

🔒 **Security Hardening**
Enhanced data protection for user creation and login processes, ensuring robust tenant data isolation.


### Exchange Item Constraints Fix (#113)
🚀 **Item Details Fix**
Listings can now be saved reliably during item condition updates.

🛠️ **Exchange Listings Database Sync**
Fixed an underlying sync issue preventing "Food & Produce" category items (which lack physical conditions like "Used") from saving successfully. Items will now securely save and correct real-time activity metrics.
