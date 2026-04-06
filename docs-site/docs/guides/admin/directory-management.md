# Admin Guide: Directory Management

As a Community Admin, you are responsible for maintaining an accurate and safe resident directory. While individual profile data is maintained in the [Resident Profiles Guide](./directory/resident-profiles.md), the structural organization of households is managed via [Family Units](./profile-management/family-unit-management.md).

## Managing Residents & Pets

Navigate to **Admin > Residents** to access the centralized directory control center.

### Unified Directory Table
The main table is your primary tool for community oversight.

- **Residents vs. Pets**: Toggle between resident and pet listings to manage all community occupants.
- **Complaints Integration**: View count of active "Resident Requests" or complaints linked to a profile.
- **Status Indicators**:
  - `Active`: Resident has signed in within the last 30 days or has completed onboarding.
  - `Invited`: Onboarding invitation has been sent but not yet accepted.
  - `Inactive`: Resident has not signed in for more than 30 days.
  - `Created`: Profile exists but an invitation has not been sent yet.
  - `Passive`: Resident profile without an email (managed manually by admin).

### Search and Actions
- **Quick Search**: Filter the entire directory by name, email, lot number, or neighborhood.
  ![Resident Table Admin](/screenshots/resident_table_admin_step_1.png)
- **Admin Actions**: Directly perform maintenance tasks using the icons at the end of each row:
  - **Pencil (Edit)**: Open the modification modal to update a resident's details (Email, Lot, Roles).
    ![Edit Resident Admin](/screenshots/resident_edit_admin_step_1.png)
  - **Trash (Delete)**: Permanently remove a resident profile from the directory.

---

## Adding New Residents

Admins can manually add residents or pets to the community without waiting for a request.

1. Click **"Add New"** at the top of the Resident table.
2. **Step 1: Basic Information**: Provide the name and select whether they are a Resident or a Pet.
    ![Create Resident Step 1](/screenshots/resident_create_admin_step_1.png)
3. **Step 2: Profile Details**: Assign them to a Lot and Family Unit. Provide contact information if available.
    ![Create Resident Step 2](/screenshots/resident_create_admin_step_2.png)

---

## Modifying Resident Profiles

Admins have the authority to update resident information to ensure data accuracy.

1. Locate the resident in the table and select **Edit Profile**.
2. **Update Attributes**: Change lot assignments, update email addresses, or add internal notes.
3. **Role Management**: Assign specific permissions (e.g., granting "Concierge" or "Admin" roles).

---

## Processing Access Requests

When new people join the community via the public form, they appear in the **Access Requests** tab.

### Review Workflow
1. Switch to the **Access Requests** tab.
    ![Resident Access Request Review](/screenshots/resident_access_request_admin_step_1.png)
2. Review the requester's self-provided details and their intended Lot.
3. **Approve**: This redirects you to the **Create Resident** form, pre-filled with the requester's data. You must finalize their lot assignment and unit grouping here before the account is officially created.
4. **Reject**: Declines the request and removes it from the queue.

---

## Best Practices

- **Lot Consistency**: Every resident and pet should be linked to a **Lot**. This ensures they appear in mapped views and correctly receive notifications for their area.
- **Pet Management**: Regularly review the Pets list to ensure all registered animals are linked to the correct Family Units and Lots for safety and identification.
