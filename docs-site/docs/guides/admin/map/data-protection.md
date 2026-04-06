# Deletion & Data Protection

Deleting map locations is a permanent action, but the system includes safeguards to protect active community data and historical records.

## Safe Deletion Logic
When a location is deleted, the system performs a multi-step cleanup process:

### Check-in Snapshots
If residents are currently "Checked In" to a location at the time of deletion, their check-in record is not deleted. Instead:
1. The location reference is removed.
2. The check-in is converted to a "Custom Location" snapshot containing the coordinates.
3. The resident remains visible on the map and dashboard until their check-in expires naturally.

### Reference Cleanup
The system automatically removes associations from related tables:
- **Lots**: Relinks resident profiles if a lot geometry is removed.
- **Neighborhoods**: Clears spatial parent-child relationships.

## Important Warnings
- **Boundary Deletion**: Deleting the "Boundary" location type will remove the community's outer perimeter. This may affect spatial calculations like "Inside Community" filters.
- **Permanent Change**: Once a location is deleted and the cleanup is performed, it cannot be recovered without a database backup.
