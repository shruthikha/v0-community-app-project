---
title: Standardize secret naming conventions
status: open
created: 2026-04-11
updated: 2026-04-11
effort: medium
category: tech-debt
module: lib/supabase/admin.ts
---

# Standardize secret naming conventions

## Finding
Multiple naming conventions exist for the same secrets:
- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY_DEV`, `SUPABASE_SERVICE_ROLE_KEY_PROD`, `DEV_SUPABASE_SERVICE_ROLE_KEY` — 4 variants for the same concept
- `RIO_RAILWAY_URL` vs `RIO_AGENT_URL`
- `RIO_DATABASE_CA` vs `RIO_DATABASE_CA_CERT`
- `NEXT_PUBLIC_MAPBOX_TOKEN` vs `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

The fallback chain in `lib/supabase/admin.ts` tries 4 different key names, which means dev could accidentally use prod keys.

## Files
- `lib/supabase/admin.ts`
- `lib/ai/config.ts`
- `app/api/v1/ai/*/route.ts`
- `components/map/*.tsx`
- `lib/mapbox-geocoding.ts`
- `packages/rio-agent/src/lib/db.ts`
- `packages/rio-agent/src/tests/*.ts`

## Suggested fix
Pick one naming convention per secret. Recommended: `SUPABASE_SERVICE_ROLE_KEY` for the current environment's key (set differently in dev vs prod Vercel settings). Remove all `_DEV`, `_PROD`, `DEV_` variants. Update all references.
