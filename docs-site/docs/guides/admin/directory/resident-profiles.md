# Managing Resident & Pet Profiles

As a Community Admin, you have full oversight of the community's occupants. While individual profile data is maintained here, the structural organization of households is managed via [Family Units](../profile-management/family-unit-management.md).

---

## The Directory Control Center
Navigate to **Admin > Residents** to access the centralized directory table. This view consolidates multiple data streams into a single management interface.

![Resident Table Admin](/screenshots/resident_table_admin_step_1.png)

### Unified Directory Table
- **Residents vs. Pets**: Toggle between these listings to manage all community members and their animals.
- **Status Indicators**:
  - `Active`: Resident has signed in within the last 30 days or completed onboarding.
  - `Invited`: Invitation sent but signup not completed.
  - `Passive`: A profile created for a resident (e.g., a child) without an email address.
  - `Created`: Profile created but invitation not yet sent.
  - `Inactive`: No sign-in for 30+ days.
- **Complaints**: The **Complaints** column shows `Active / Total` requests. Clicking this redirects you to the **Requests** module, pre-filtered for immediate follow-up.

---

## Onboarding & Modifications
Admins maintain the "Source of Truth" for the community.

### Creating & Approving Residents
- **Manual Creation**: Use the **Add Resident** button. You must assign a **Lot Number** and can optionally link the resident to an existing **Family Unit** during creation.
- **Access Requests**: When individuals request entry via the login page, they appear in the **Access Requests** tab.
- **Approve**: Clicking "Approve" redirects you to the **Create Resident** form, pre-filled with the requester's data. This is where you finalize their **Lot assignment** before official entry.

![Create Resident Admin](/screenshots/resident_create_admin_step_1.png)

### Modifying Existing Profiles
1. **Edit**: Click the **Pencil icon** to update sensitive details.
2. **Lot & Family Assignment**: Use the **Resident Edit** form to change a resident's **Lot** or **Family Unit**. 
   - *Note: Moving a household's physical residence requires updating the Lot for each individual member.*
3. **Role Management**: Assign specific permissions (Resident, Concierge, or Admin).
4. **Invitation**: For `Created` profiles, use the **Invite** action to trigger the onboarding email.

![Edit Resident Admin](/screenshots/resident_edit_admin_step_1.png)

---

## Best Practices
- **Lot Integrity**: Ensure every resident is linked to a **Lot** to ensure they receive area-specific announcements.
- **Passive Account Audits**: Regularly review passive accounts to see if they require conversion to active accounts (by adding an email and sending an invite).
