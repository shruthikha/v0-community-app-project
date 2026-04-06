# Map System: Security & isolation

Spatial data in the Community Map is protected by a multi-layered security model ensuring tenant isolation and role-based access.

## Access Control

### Role-Based Permissions
- **Residents**: Read-only access to all `locations` for their tenant.
- **Admins**: Full CRUD access to all map features.
- **Super Admins**: Full access across all tenants.

### Tenant Isolation
Isolation is enforced via **Row Level Security (RLS)** in Supabase. Every query must include a `tenant_id` check:

```sql
CREATE POLICY "Users can view locations in their tenant" 
ON public.locations
FOR SELECT 
USING (tenant_id = auth.uid_tenant_id());
```

## Data Sensitivity

### PII on Map
The map interacts with resident PII (Profile Pictures, Names) via the **Check-in** system. 
- **Visibility**: Check-in beacons only display if the resident has not set their privacy to "Private".
- **Real-time Sanitization**: Information shown in the `LocationInfoCard` (e.g., who lives in a lot) is filtered through the same privacy engine as the Resident Directory.

### Location Masking
By default, the exact GPS coordinates of residents are **not** stored; only their "Presence" at a predefined community location is recorded.
