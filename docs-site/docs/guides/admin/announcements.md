# Managing Announcements

The Announcements module allows Tenant Admins to broadcast important information, alerts, and policies to their community. Unlike community board posts, announcements are official, one-way communications that appear at the top of the resident dashboard.

## Key Concepts

- **Types:** Categorize the announcement (e.g., General, Emergency, Maintenance, Event, Policy). Gives residents visual context.
- **Priority:** Determines visual weight.
  - *Normal:* Standard gray badge.
  - *Important:* Orange badge, highlighted in feeds.
  - *Urgent:* Red badge, prominently displayed.
- **Status:**
  - *Draft:* Saved but not visible to residents. No notifications sent.
  - *Published:* Visible on dashboards immediately. Sends push/email notifications.
  - *Archived:* Moved off the main dashboard into the historical "Archive" tab.
- **Targeting (Neighborhoods):** Announcements can be broadcast "Community-Wide" or restricted to specific neighborhoods so only residents whose lots belong to those neighborhoods see them.

![Admin Announcements Table](/screenshots/announcements_admin_table_step_1.png)
## Creating an Announcement

1. Navigate to your Admin Dashboard.
2. Under "Communications", select "Announcements".
3. Click **"Create Announcement"**.
4. **Basic Details:** Provide a clear, concise Title and optional Rich Text description.
5. **Categorization:** Select the Type and Priority.
6. **Optional Linkages:**
   - *Targeting:* Select specific neighborhoods if this doesn't apply to the whole community. Leave blank to target everyone.
   - *Event Link:* Attach an existing community event to the announcement.
   - *Location:* Attach a community facility or drop a custom GPS pin on the map.
7. **Auto-Archive:** Select an optional date and time. The system will automatically move the announcement to the Archive when this time passes, preventing clutter on resident dashboards.
8. **Save**: Choose "Save as Draft" (to edit later) or "Publish Now" (makes it immediately live and notifies residents).

### The Auto-Archive System
Announcements support an automated lifecycle to prevent dashboard clutter. When an `auto_archive_date` is set, a background cron job runs daily at Midnight UTC to:
1. Transition the status from `Published` to `Archived`.
2. Hide the announcement from the primary Resident dashboard widget.
3. Move the record to the historical "Archive" tab for long-term record keeping.

:::info
For permanent resources like bylaws or parking rules, use the [Official Documents](./documents.md) module instead. Documents do not auto-archive and remain as permanent community assets.
:::

![Admin Create Announcement Form](/screenshots/announcements_create_form_step_2.png)
## Editing & Managing

From the main Announcements data table, you can see all your communications.

:::tip
For permanent resources like bylaws or parking rules, use the [Official Documents](./documents.md) module instead. Announcements are best for temporary news and events.
:::

- **Edit:** Click the edit icon to change any details. *Note: If you edit an already published announcement, a secondary "Updated" notification will be sent to residents.*
- **Quick Publish:** Transition a draft directly to published using the 📢 icon.
- **Archive:** Hide an announcement from the main resident feed early using the archive 📦 icon.
- **Delete:** Use the trash 🗑️ icon to permanently remove an announcement if created in error.
- **View Insights:** The table displays how many residents have actively "read" your announcement (by expanding or clicking on it).
