---
title: Inventory & One-Way Items
description: Consumable items should not restore inventory on pickup
categories: [database, business-logic]
sources: [log_2026-02-16_service_food_inventory.md]
---

# Inventory & One-Way Items

## The Problem

Exchange logic restores inventory for ALL items on "Pickup":

```typescript
// Existing bug: All items restore inventory
const markPickedUp = async (listingId: string) => {
  await db.update(listing, { available: true }); // Always restores
};
```

## One-Way Logic

Food & Produce should NOT restore inventory:

```typescript
const ONE_WAY_CATEGORIES = ['food', 'produce', 'services'];

const markPickedUp = async (listingId: string) => {
  const listing = await get(listingId);
  
  if (ONE_WAY_CATEGORIES.includes(listing.category)) {
    // Consumable: don't restore
    return;
  }
  
  // Physical item: restore inventory
  await db.update(listing, { available: true });
};
```

## Category-Based Logic

Store category in listing, not derived from type:

```typescript
type Category = 'exchange' | 'food' | 'produce' | 'services' | 'event';

// Use category for logic, not type checking
```

---

## Related

- [supabase-concurrency](../patterns/supabase-concurrency.md)