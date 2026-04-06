# Technical Reference: Security & Privacy

## Tenant Isolation
The most critical security layer is the **Tenant ID Enforcement**. 
- **Server-Side**: All dashboard queries (API and Server Actions) include a mandatory `.eq("tenant_id", tenantId)` filter.
- **Row Level Security (RLS)**: Database policies ensure that even if a `tenant_id` filter is omitted in code, a user can only access rows belonging to their assigned tenant.

## Privacy Controls

### Check-in Visibility
- **Global Setting**: `tenants.checkins_enabled` toggles the entire feature.
- **User Setting**: Residents can opt-out of sharing their check-in location with neighbors while still being able to see global counts.

### Profile Sensitivity
- **Skills/Interests**: Private by default; only shared with neighbors if the user completes the "Skills" step of onboarding and selects "Visible to Neighbors".
- **Family Data**: Only visible to neighbors within the same family unit unless explicitly shared in a public request.

## Authentication & Authorization
- **Session Verification**: All dashboard APIs call `supabase.auth.getUser()` immediately to verify the session.
- **Role-Based Access**: The dashboard UI adapts based on the `user.role` (e.g., hiding admin-only "Quick Actions" from residents).
- **JWT Protection**: All requests to Supabase are signed with the user's JWT, which is verified against RLS policies.

## Dismissal Privacy
Priority feed dismissals are stored in **`localStorage`**. 
- **Security**: Dismissal data is device-specific and never sent to the server.
- **Trade-off**: This avoids database overhead but means a dismissed item will reappear if the resident switches devices (e.g., from Mobile to Desktop).
