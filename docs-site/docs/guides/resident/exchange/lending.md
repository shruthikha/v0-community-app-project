---
title: Managing Your Listings
sidebar_position: 2
---

# Managing Your Listings

As a Lender, you have full control over your active shares and their lifecycle.

## 🛠️ Creator Tools
When you view your own listing, you have access to a management suite.

![Creator Management View](/screenshots/exchange_res_listing_detail_creator_1.png)

### Edit, Pause, & Delete
- **Edit**: Update the description, quantity, or visibility scope.
- **Pause**: Temporarily hide the listing from the dashboard. This is useful for rotating tools or seasonal produce.
- **Delete**: Permanently remove the listing. This is only available if there are no active pickup or return transactions.

### View Transaction History
Lenders can track every neighborhood handshake associated with their listing. Clicking the history icon opens the **Transaction History Modal**.

![Transaction History](/screenshots/exchange_res_listing_detail_creator_2.png)

**The history modal tracks:**
- **Borrower Identity**: Who borrowed the item and when.
- **Duration**: How many total days the item has been in use.
- **Return Condition**: Any notes or photos regarding the condition upon return.
- **Inventory Status**: Automatic Restoration of quantity once a return is confirmed.

## 📈 Auto-Inventory Logic
The application handles the "Available Quantity" automatically:
1.  **Confirmation**: Subtracts the requested amount from your listing.
2.  **Auto-Pausing**: If quantity hits zero, the listing is hidden from the dashboard.
3.  **Restoration**: quantity is restored as soon as you click "**Confirm Return**."
