---
title: GeoJSON & Map Customization
description: Schema constraints, text vs numeric, cache invalidation
categories: [geojson, database, mapbox]
sources: [log_2026-02-05_geojson_upload.md]
---

# GeoJSON & Map Customization

## DB Constraints > UI Options

Postgres CHECK constraints must match dropdown values:

```sql
ALTER TABLE locations 
ADD CONSTRAINT valid_surface CHECK (
  surface IN ('paved', 'gravel', 'dirt', 'natural')
);
```

UI mapping required because DB has "natural", dropdown "Mixed":

```typescript
const surfaceMap: Record<string, string> = {
  'Mixed': 'natural',
  'Hard': 'difficult'
};

const save = (value: string) => {
  db.insert(surfaceMap[value] || value);
};
```

## Text vs Numeric Type Mismatch

Legacy schema uses text, app sends numbers:

```typescript
// Server Action accepts loose types
const updateLocation = async (data: { 
  path_length?: string | number;
  elevation_gain?: string | number;
}) => {
  // Cast to string for legacy text columns
  await db.update({
    path_length: String(data.path_length),
    elevation_gain: String(data.elevation_gain),
  });
};
```

## Cache Invalidation for Live Data

Always invalidate for admin-driven content:

```typescript
// API route
export const dynamic = 'force-dynamic';

export async function GET() {
  const locations = await db.select();
  return Response.json(locations);
}
```

---

## Related

- [database-column-strictness](./database-column-strictness.md)