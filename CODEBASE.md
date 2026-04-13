# Nido Codebase Map

> **The Source of Truth for System Navigation**
> *Generated Jan 26, 2026*

## 🌍 System Overview
**Product:** Ecovilla Community Platform (Nido)
**Architecture:** Monorepo (Next.js App Router)
**Core Stack:** Next.js 14, Supabase (Postgres + Auth), Mapbox, TipTap, Tailwind v4.

---

## 🗺️ Directory Structure

### `app/` (Next.js Router)
- `(admin)/` -> **Admin Interface** (Community Managers). Private layout.
- `(resident)/` -> **Resident Interface** (Mobile-first). Public/Auth layout.
- `api/` -> **Backend API**. Strictly typed endpoints.

### `components/` (UI Library)
- `ui/` -> **Primitives** (shadcn/ui). Dumb components.
- `features/` -> **Smart Components**. Connected to logic.
- `map/` -> **Mapbox Integration**.
- `editor/` -> **TipTap Rich Text**.

### `lib/` (Utilities)
- `supabase/` -> **Database Clients** (Server/Client).
- `utils.ts` -> **Helpers**.

### `docs/` (Knowledge Base)
- `01-manuals/` -> User Guides.
- `02-technical/` -> Developer Specs.
- `03-design/` -> Design System & Token maps.
- `04-context/` -> Project Vision.
- `05-decisions/` -> ADRs (Architecture Decision Records).

### `.agent/` (AI Configuration)
- `agents/` -> Agent personas.
- `skills/` -> Capability definitions.
- `rules/` -> Global laws (`GEMINI.md`).

---

## 🔑 Key Files
- `design/nido_design_system.md` MOVED TO `docs-legacy/03-design/design-system/nido_design_system.md` -> **Design Truth**.
- `app/globals.css` -> **Global Styles** (Tailwind).
- `tailwind.config.ts` -> **Theme Config**.

## 🔄 Data Flow
1.  **Client**: Next.js Server Components fetch data.
2.  **Auth**: Supabase Auth (Middleware protected).
3.  **Database**: Direct Postgres via Supabase Client (RLS enabled).
4.  **State**: React Server Actions for mutations.

## 🛑 Critical Constraints
- **Mobile First**: All resident screens must work on 375px width.
- **No Direct SQL**: Use the Supabase client or RPCs.
- **Strict TypeScript**: No `any`.
