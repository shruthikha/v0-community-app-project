---
title: The Borrowing Handshake
sidebar_position: 3
---

# The Borrowing Handshake

The Exchange system uses a "Handshake" workflow to manage pickup, usage, and returns. The process adjusts automatically based on whether the item is returnable or consumable.

## 1. The Request
The transaction begins when a resident requests an item or service.

- **Non-Returnable (Food/Services)**: The request is simplified and does not require a return date.
  ![Non-Returnable Request](/screenshots/exchange_res_transaction_flow_1.png)
  ![Form Detail](/screenshots/exchange_res_transaction_flow_2.png)
- **Returnable (Tools/Equipment)**: Requires a "Proposed Return Date" to manage the lender's inventory schedule.
  ![Returnable Request Detail](/screenshots/exchange_res_transaction_flow_7.png)
- **Status Update**: Once sent, the request appears as "Pending" in your **Dashboard Priority Feed**.
  ![Pending Request Notification](/screenshots/exchange_res_transaction_flow_3.png)

## 2. Confirmation & Pick-up
The lender must review and confirm the handshake before pickup can occur.

- **Lender Review**: The lender sees the request in their feed and can view borrower details.
  ![Lender Review](/screenshots/exchange_res_transaction_flow_4.png)
- **Lender Confirmation**: Once confirmed, the available quantity is reserved.
  ![Lender Confirmation](/screenshots/exchange_res_transaction_flow_5.png)
- **Confirm Pickup**: After meeting up, the borrower must mark the item as "**Picked Up**."
  ![Pickup Notification](/screenshots/exchange_res_transaction_flow_6.png)
  ![Pickup Confirmation](/screenshots/exchange_res_transaction_flow_8.png)

## 3. Reminders & Return
For returnable items, the system manages the final steps of the lifecycle.

- **Automated Reminders**: Borrowers receive a notification 48 hours before the item is due back.
  ![Return Reminder](/screenshots/exchange_res_transaction_flow_10.png)
- **Lendor Completion**: When the item is handed back, the lendor marks it as "**Returned**" to restore the inventory.
  ![Return Completion](/screenshots/exchange_res_transaction_flow_9.png)
- **Documenting Condition**: Lenders can document the return condition and add notes or photos for their history.
  ![Return Condition Documentation](/screenshots/exchange_res_transaction_flow_11.png)
