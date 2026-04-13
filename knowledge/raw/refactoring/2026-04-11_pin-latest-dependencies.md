---
title: Pin all latest-tagged dependencies
status: open
created: 2026-04-11
updated: 2026-04-11
effort: small
category: security
module: package.json
---

# Pin all latest-tagged dependencies

## Finding
11 dependencies in `package.json` use `"latest"` instead of pinned semver versions. This creates non-reproducible builds, supply chain risk, and no rollback path. Critical packages affected include `@supabase/ssr`, `@supabase/supabase-js`, `@tiptap/core`, `@tiptap/pm`.

## Files
- `package.json` (lines 48, 53-55, 63, 72, 84-85, 93-94, 102, 109)

## Affected packages
- `@radix-ui/react-toast`
- `@supabase/ssr`
- `@supabase/supabase-js`
- `@tiptap/core`
- `@tiptap/pm`
- `@vercel/analytics`
- `geojson`
- `proj4`
- `prop-types`
- `react-toastify`
- `swr`

## Suggested fix
1. Run `npm ls <package>` to find current resolved versions
2. Pin each to `^current_minor` (e.g., `"@supabase/ssr": "^0.5.0"`)
3. Run `npm audit` and fix any known vulnerabilities
4. Add Dependabot config for controlled future updates

## Priority
🟠 HIGH — Identified as H1 in the CI/CD cross-cutting audit
