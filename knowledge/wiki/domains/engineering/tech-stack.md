---
title: Tech Stack — Ecovilla
description: Technology stack choices: Next.js 16, Supabase, Mastra, Vercel
categories: [architecture, tech-stack]
sources: [prd_2026-02-02_sprint_1_security_polish.md, prd_2026-03-19_sprint_8_rio_foundation.md]
---

# Technology Stack — Ecovilla

## Core Platform

### Next.js 16 (App Router)
- **Build System**: `npm run build`
- **Linting**: Native ESLint (`npm run lint`)
- **Deployment**: Vercel (Auto-deploy on merge to `main`)
- **Middleware**: Session validation and timeout enforcement

### Supabase
- **Auth**: Supabase Auth with JWT-based sessions
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Storage**: Private buckets + public CDN buckets
- **Vectors**: pgvector for semantic search

### Architecture Layers

```
┌─────────────────────────────────────┐
│  Next.js App Router (Vercel)         │
│  - Pages/Layouts                    │
│  - Server Actions                   │
│  - API Routes (BFF)                │
├─────────────────────────────────────┤
│  Supabase                           │
│  - Auth (JWT)                       │
│  - Database (RLS)                  │
│  - Storage                         │
│  - pgvector                        │
├─────────────────────────────────────┤
│  Mastra Agent (Railway)             │
│  - Workflows                       │
│  - AI Agents                       │
└─────────────────────────────────────┘
```

## Environment Strategy

### Development
- `.env.local` → Dev Supabase project (isolated)
- Localhost connects to dev DB
- Safe for schema changes

### Production
- `.env.production` → Prod Supabase project
- Vercel auto-deploys
- Feature flags via PostHog

## Key Patterns

### Server-First Data Access
```typescript
// Server Component fetches data
const data = await db.select().from('residents');

// Server Action for mutations
'use server';
async function updateResident(data) {
  const admin = createAdminClient();
  await admin.from('residents').update(data);
}
```

### Multi-Tenant Isolation
- All RLS policies: `tenant_id = auth.jwt()->>'tenant_id'`
- Storage folder isolation: `tenants/{tenant_id}/...`

---

## Related

- [backend-first-auth](../patterns/backend-first-auth.md)
- [supabase-multi-tenancy](../patterns/supabase-multi-tenancy.md)