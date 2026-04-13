source: idea
imported_date: 2026-04-08
---
# Río AI Environment Configuration Guide

This document outlines the required environment variables for the Río AI Agent and the BFF to ensure proper communication and functionality across all environments.

## 1. BFF (Next.js Application)
These variables must be set in the frontend environment (e.g., Vercel Production Settings).

| Variable | Description | Example Value |
|---|---|---|
| `RIO_RAILWAY_URL` | The base URL of the Río Agent service on Railway. | `https://rio-agent.up.railway.app` |
| `RIO_AGENT_KEY` | Shared secret to authenticate BFF -> Agent requests. | `your-secure-secret-key` |

> [!IMPORTANT]
> If `RIO_RAILWAY_URL` includes a trailing `/api`, do not add `/api` in the code fetch calls. Current project standards assume the URL is the base domain.

## 2. Río Agent (Mastra Service on Railway)
These variables must be set in the Railway service settings.

| Variable | Description | Example Value |
|---|---|---|
| `RIO_DATABASE_URL` | Postgres connection string for the Supabase project. | `postgresql://postgres...` |
| `RIO_AGENT_KEY` | Shared secret (must match BFF). | `your-secure-secret-key` |
| `SUPABASE_URL` | Public API URL for Supabase. | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin-level database access. | `eyJhbG...` |
| `OPENROUTER_API_KEY` | API key for the LLM provider (OpenRouter). | `sk-or-v1-...` |
| `POSTHOG_API_KEY` | Project API key for PostHog observability. | `phc_...` |
| `POSTHOG_HOST` | PostHog ingest host. | `https://us.i.posthog.com` |

## 3. Configuration Sync Checklist
- [ ] `RIO_AGENT_KEY` is identical in both Vercel and Railway.
- [ ] `SUPABASE_URL` in the Agent matches the target Supabase project.
- [ ] `RIO_DATABASE_URL` uses the direct connection or transaction pooler from the same Supabase project.
- [ ] `RIO_RAILWAY_URL` in Vercel is reachable and correct (check for extra slashes).
