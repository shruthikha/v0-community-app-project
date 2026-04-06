---
title: API & Server Actions
sidebar_position: 2
---

# API & Server Actions

The Exchange system is powered by two main sets of Server Actions located in `app/actions/`.

## Listing Management (`exchange-listings.ts`)
Handles the CRUD operations for items and services.

### `createExchangeListing`
- Validates current user neighborhood associations for scoped listings.
- Enforces condition and pricing enums.

### `updateExchangeListing`
- **Constraint**: Cannot modify primary details (title, description) if there are active `picked_up` transactions.
- Allows updating `available_quantity` at any time.

### `toggleListingAvailability` (Pause)
- Manual override to hide a listing from the dashboard without deleting it.

---

## Transaction Lifecycle (`exchange-transactions.ts`)
Manages the state machine for borrowing/gifting.

### `createBorrowRequest`
- Checks if `requested_quantity <= available_quantity`.
- Determines if `expected_return_date` is required based on listing category.

### `confirmBorrowRequest`
- **Critical**: On confirmation, `available_quantity` is decremented in `exchange_listings`.
- If quantity hits `0`, `is_available` is auto-toggled to `false`.

### `markItemPickedUp`
- **Logic Branch**: If category is "Food" or "Produce", the transaction is auto-marked as `completed` immediately upon pickup.

### `markItemReturned`
- Finalizes the handshake.
- **Critical**: Restores `requested_quantity` to the `exchange_listings` table.
- Resets `is_available` to `true` if it was auto-paused.
