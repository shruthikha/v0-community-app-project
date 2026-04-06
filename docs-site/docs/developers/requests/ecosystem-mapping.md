# Ecosystem Mapping: Requests

The Requests feature is a central hub for community management, interacting with several other core systems.

## Key Integrations

### 1. Location System
Requests can be pinned to specific areas of the community.
*   **Technical Link**: `resident_requests.location_id` refs `locations.id`.
*   **Custom Location**: Supports `lat/lng` for issues in non-defined areas (e.g., "pothole near the north gate").
*   **Visuals**: Detail pages use `RequestLocationMap` component to display the pinned coordinates.

### 2. Community Exchange
While both involve "requests," they serve different purposes:
*   **Requests**: Community infrastructure, maintenance, safety, and admin queries.
*   **Exchange**: Peer-to-peer sharing, borrowing, and services.
*   **Data Isolation**: They use separate tables (`resident_requests` vs `exchange_transactions`) to prevent schema bloat.

### 3. Media Storage
Photos of maintenance issues or safety hazards are stored in the Supabase `requests` bucket.
*   **Access**: Publicly visible requests also expose their image URLs to all residents in the tenant via RLS.

### 4. Río AI Integration
*   **Ingestion**: Documentation about the request process is ingested by Río.
*   **Capabilities**: Río can explain how to submit a maintenance request or what the different priority levels mean using the information provided in these guides.
