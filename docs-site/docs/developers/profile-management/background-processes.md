# Background Processes & Lifecycle

This document describes the asynchronous and lifecycle-driven processes affecting resident profiles.

## Silent Auto-save Synchronization

The profile editor implements a "Silent Auto-save" mechanism to prevent data loss and simplify the UI.

- **Trigger**: `onBlur` (focus loss) from any input field or `onValueChange` for selects/radios.
- **Debouncing**: Changes are debounced at the component level to prevent rapid-fire API calls during typing.
- **Visual Feedback**: A subtle "Saving..." indicator is shown in the footer of the profile form during the operation.

## Onboarding Lifecycle

When a resident first logs in via an invitation link:

1. **Token Validation**: The `invite_token` is verified against the `users` table.
2. **Set Password**: The resident establishes their credentials.
3. **Configuration Wizard**: A multi-step flow prompts for missing profile information (Interests, Skills, Family relationships).
4. **Completion Tag**: Setting `onboarding_completed: true` enables the main Dashboard and Resident Directory access.

## Cache Invalidation

Profile updates trigger invalidation of the following tags:
- `resident-directory`: Ensures the community directory reflects most recent name/photo changes.
- `user-profile`: Updates the global state for the individual resident.
- `household-data`: Updates the shared view for other household members.

## Río Memory Indexing
Updates to "Open to Help" skills or interests trigger a background re-indexing of the user's vector embedding for Río. This ensures the assistant's knowledge of the resident's capabilities is always current.
