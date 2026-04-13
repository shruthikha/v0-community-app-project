# Refactoring Opportunity: Migrate Lot Image Server Actions to Supabase RPCs

**Issue**: #66
**Date**: 2026-04-12
**Status**: Pending

## Context
The current implementation for residential lot image management uses Next.js Server Actions. While this provides a great UI experience, it couples the business logic to the Next.js App Router, making it difficult for the Río agent to perform these actions directly.

## Proposed Refactoring
Migrate the core business logic from `app/actions/lot-images.ts` into Supabase PostgreSQL Functions (RPCs).

### Benefits
1.  **Agent Accessibility**: The Río agent can call Supabase RPCs directly using the Supabase client, bypassing the App Router.
2.  **Centralized Logic**: Business logic (validation, storage path generation, database updates) resides in the database, ensuring consistency across all consumers (UI, Agent, API).
3.  **Performance**: Reduces network hops by executing logic directly within the database.

### Implementation Plan
1.  Create SQL functions for `upload_lot_image`, `delete_lot_image`, and `set_hero_image`.
2.  Update `app/actions/lot-images.ts` to act as a thin wrapper that calls these RPCs.
3.  Update the Río agent configuration to allow it to invoke these RPCs.
