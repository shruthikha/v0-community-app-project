# Map Editor & Manual Creation

The Map Editor provides administrators with precise control over the community's spatial data through manual drawing tools and metadata management.

![Map Editor Overview](/screenshots/map_admin_editor_01.png)

## Drawing Toolbar
The drawing toolbar at the top of the map allows you to create new features directly on the background imagery.

![Drawing Tools](/screenshots/map_admin_editor_02.png)

1. **📍 Point**: Use for pinpointing facilities, monuments, or specific markers.
2. **📏 LineString**: Use for streets, walking paths, or utility lines.
3. **⬢ Polygon**: Use for drawing boundaries, residential lots, or multi-area facilities.

## Metadata Management
Once a shape is drawn or selected, the **Edit Sidebar** opens to allow metadata configuration.

### Core Fields
Specify the name, category (Facility, Lot, Path, etc.), and a brief description for residents.
![Core Metadata](/screenshots/map_admin_edit_sidebar_03(1).png)

### Specialized Location Fields
- **Facilities**: Set status (Open/Maintenance), capacity, and toggle available amenities.
- **Lots**: Link the physical shape to a lot ID in the community registry.
- **Paths**: Configure difficulty (Easy to Difficult) and surface type.
- **Rules & Accessibility**: Add specific rules, guidelines, and accessibility notes for residents.

![Specialized Fields](/screenshots/map_admin_edit_sidebar_03(2).png)
![Rules & Accessibility](/screenshots/map_admin_edit_sidebar_03(3).png)

### Saving Changes
Click **Save Changes** at the bottom of the sidebar to commit the geometry and metadata to the database. Updates are reflected instantly on the resident map.
