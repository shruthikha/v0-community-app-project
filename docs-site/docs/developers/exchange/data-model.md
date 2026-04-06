---
title: Data Model
sidebar_position: 1
---

# Data Model

The Exchange system uses four primary tables to manage listings, transactions, categorizations, and moderation.

## `exchange_listings`
Stores the catalog of items, services, and produce available for exchange.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key. |
| `status` | `enum` | `draft`, `published`, `archived`. |
| `available_quantity` | `integer` | Current stock. Tracked for auto-pausing. |
| `is_available` | `boolean` | Master toggle (manual or auto-set when quantity = 0). |
| `pricing_type` | `enum` | `free`, `fixed_price`, `pay_what_you_want`. |
| `condition` | `enum` | `new`, `like_new`, `good`, `fair`, `poor`. |
| `visibility_scope` | `enum` | `community`, `neighborhood`. |

## `exchange_transactions`
Tracks the lifecycle of an exchange "Handshake".

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key. |
| `listing_id` | `uuid` | FK to `exchange_listings`. |
| `borrower_id` | `uuid` | FK to `profiles`. |
| `status` | `enum` | `requested`, `confirmed`, `picked_up`, `returned`, `completed`, `cancelled`. |
| `requested_quantity` | `integer` | Quantity requested by the borrower. |
| `proposed_pickup_date` | `timestamp` | Set by borrower. |
| `expected_return_date` | `timestamp` | **Optional.** If set, triggers reminder logic. |

## `exchange_categories`
Defines the taxonomy (e.g., "Household Items", "Food & Produce").
- Includes a `requires_return` boolean used by the UI and API to toggle return-date requirements.

## `exchange_flags`
Resident-reported flags for moderation purposes.
