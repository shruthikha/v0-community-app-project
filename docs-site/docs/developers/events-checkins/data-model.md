# Data Model & Schema

The Events and Check-ins features utilize several interconnected tables in Supabase to manage state, visibility, and participation.

---

## 📊 Database Tables

### `events`
| Field | Type | Description |
| :--- | :--- | :--- |
| `parent_event_id` | UUID | Self-reference to link series instances. |
| `recurrence_rule` | JSONB | RRULE structure (e.g., `{"freq": "weekly", "byday": ["MO"]}`). |
| `custom_location_coordinates` | JSONB | Stores Mapbox Point or Polygon GeoJSON. |
| `visibility_scope` | TEXT | `community`, `neighborhood`, `private`. |

### `check_ins`
| Field | Type | Description |
| :--- | :--- | :--- |
| `duration_minutes` | INTEGER | Defines the beacon lifecycle length (30-480). |
| `end_time` | N/A | **Computed Field**: Derived in queries via `start_time + duration`. |
| `location_type` | TEXT | `community_location` or `custom_temporary`. |

---

## 🔗 Key Relationships

- **RSVPs**: `event_rsvps` links `user_ids` to `event_ids` with a status (`going`, `maybe`).
- **Invites**: For private events/check-ins, the `event_invites` table stores many-to-many relationships with residents, families, or **Neighbor Lists**.
- **Categories**: `event_categories` defines the taxonomy (icons, labels) used for filtering.

---

## 🛠️ JSONB Structures

### Custom Locations
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "properties": {
    "label": "Custom Meeting Spot"
  }
}
```
This flexible field allows for both simple markers and complex polygon shapes without schema migrations.
