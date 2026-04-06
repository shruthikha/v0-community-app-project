---
title: Background Processes
sidebar_position: 3
---

# Background Processes

The Exchange system relies on automated scripts to handle return logic, inventory integrity, and resident reminders.

## ⏰ Borrower Reminders & Overdue Logic
A daily Vercel Cron job (`/api/cron/check-return-dates`) performs two primary checks:

### 1. The 48-Hour Reminder
- **Goal**: Help borrowers prepare for the hand-back.
- **Criterion**: `now + 2 days >= expected_return_date`.
- **Action**: Sends a standard notification to the borrower via the Community App notification system.

### 2. Overdue Alerts
- **Goal**: Flag transactions that require immediate attention.
- **Criterion**: `now > expected_return_date` AND status is still `picked_up`.
- **Action**: Sends a high-priority "Overdue" notification to **both** the lender and borrower.

---

## 🏗️ Quantity Engine (Auto-Pausing)
To prevent overselling items shared by a resident, the system synchronizes `available_quantity` and the `is_available` toggle.

- **Auto-Pause (Subtraction)**: When a transaction is `confirmed`, the system subtracts the borrowed quantity. If the new total is `0`, it automatically flips the listing's visibility to `false`.
- **Auto-Restore (Addition)**: When a transaction is `returned`, the system adds back the quantity. If the listing was previously hidden, it restores visibility to `true`.
