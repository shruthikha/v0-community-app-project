# Agent Domain Map & Audit Guide

**Version**: 1.1  
**Date**: January 19, 2026  
**Purpose**: To guide AI Agents in conducting domain-specific audits by mapping their roles to specific directories, files, and patterns within the codebase.

---

## 🗺️ High-Level Map

| Agent | Core Domain (Primary) | Secondary / collaborative Areas |
|-------|-----------------------|---------------------------------|
| **Frontend Specialist** | `components/`, `design/`, `styles/`, `app/**/*.tsx` | `stories/`, `tailwind.config.ts`, `lib/design-system/` |
| **Backend Specialist** | `app/api/`, `actions/`, `lib/supabase/`, `lib/utils/` | `middleware.ts`, `lib/data/`, `supabase/` (RPC/Edge) |
| **Database Architect** | `lib/supabase/`, `lib/data/`, `supabase/migrations/` | `actions/` (Query usage), `types/` (Schema definitions) |
| **Mobile Developer** | `app/` (Responsive Logic), `components/ui/mobile-zoom-fix.tsx` | `tailwind.config.ts` (Screens), `viewport` meta tags |
| **Security Auditor** | `middleware.ts`, `lib/upload-security.ts`, `lib/sanitize-html.ts` | `app/api/` (Auth check), `actions/` (Input validation), `.env` |
| **Security Auditor (Access)**| `lib/supabase/`, `supabase/policies/` | `app/` (Protected Routes) |
| **Penetration Tester** | *Simulated Attacks* on `app/api/`, `actions/` | `scripts/security_scan.py`, `middleware.ts` (Bypass tests) |
| **Performance Optimizer**| `next.config.mjs`, `lib/analytics.ts` | `components/` (Bundle size), `app/` (LCP/CLS) |
| **DevOps Engineer** | `scripts/`, `.github/`, `package.json` | `vercel.json`, `Dockerfile`, `next.config.mjs` |
| **SEO Specialist** | `app/layout.tsx`, `app/sitemap.ts` | `app/**/page.tsx` (Metadata exports) |
| **Documentation Writer**| `docs/`, `documentation/`, `README.md` | `CODEBASE.md`, `*.md` in subfolders |
| **Test Engineer** | `stories/`, `__tests__/`, `scripts/*_test.py` | `components/**/*.test.tsx`, `playwright/` |
| **Debugger** | `lib/posthog.ts`, `sentry.config.js` (if any) | `app/error.tsx`, `components/ui/toaster.tsx` (Error UI) |
| **Orchestrator** | `.agent/workflows/`, `task.md` | `docs/plans/`, All Agent Rules |
| **Project Planner** | `docs/plans/`, `task.md` | `CURRENT_STATE_GAP_ANALYSIS.md`, `README.md` |
| **Explorer Agent** | `CODEBASE.md`, `ARCHITECTURE.md` | All directories (Read-only) |
| **Game Developer** | *N/A (Not relevant for this project)* | - |

---

## 🕵️ Detailed Agent Focus Areas

### 🎨 Frontend Specialist
**Mission**: "Pixel Perfection & User Experience"
-   **Critical Paths**:
    -   `components/ui/` -> Check for consistency with `design/nido_design_system.md`.
    -   `components/dashboard/` -> Review client-side logic and state management.
    -   `app/` -> Verify Server Components vs Client Components usage.
-   **Specific Checks**:
    -   Are we using `tailwind.config.ts` tokens or magic values?
    -   Are `use client` directives minimized?
    -   Are images using `next/image`?

### ⚙️ Backend Specialist
**Mission**: "Robust Logic & API Integrity"
-   **Critical Paths**:
    -   `app/api/v1/` -> REST API structure, error handling, status codes.
    -   `actions/` -> Server Actions for mutations (Revalidation, Try/Catch).
    -   `lib/supabase/` -> Client creation strategies (Server vs Client).
-   **Specific Checks**:
    -   Is Authentication enforced on ALL routes/actions?
    -   Are types shared correctly with the frontend?

### 🗄️ Database Architect
**Mission**: "Data Integrity & Performance"
-   **Critical Paths**:
    -   `lib/data/` -> centralized data fetching (DTOs).
    -   `actions/` -> Mutation transactions.
-   **Specific Checks**:
    -   Are we over-fetching data? (Select `*` vs specific fields).
    -   Are RLS policies preventing unauthorized access? (Check logic implication).

### 📱 Mobile Developer
**Mission**: "Mobile-First Responsiveness"
-   **Critical Paths**:
    -   `components/` -> Touch targets (min 44px).
    -   `styles/globals.css` -> Mobile-specific overrides.
-   **Specific Checks**:
    -   Does the `MobileDock` cover content? (Check `pb-20` padding).
    -   Do inputs zoom in on focus on iOS? (Check `mobile-zoom-fix.tsx`).

### 🛡️ Security Auditor
**Mission**: "Zero Vulnerabilities"
-   **Critical Paths**:
    -   `lib/sanitize-html.ts` -> Is it used in Rich Text rendering?
    -   `lib/upload-security.ts` -> File type/size verification.
    -   `middleware.ts` -> Route protection logic.
-   **Specific Checks**:
    -   Search for `dangerouslySetInnerHTML`.
    -   Verify `DOMPurify` usage.
    -   Check for exposed secrets in codebase.

### ⚔️ Penetration Tester
**Mission**: "Offensive Security Validation"
-   **Critical Paths**:
    -   `app/api/` -> Check for IDOR, Injection points.
    -   `actions/` -> Check for missing authorization checks.
-   **Specific Checks**:
    -   Can I mutate data without being owner?
    -   Are inputs strictly validated (Zod)?

### 🚀 Performance Optimizer
**Mission**: "Speed & Vitals"
-   **Critical Paths**:
    -   `components/map/` -> Mapbox bundle splitting/loading.
    -   `app/layout.tsx` -> Font loading strategies.
    -   `lib/analytics.ts` -> Metric collection overhead.
-   **Specific Checks**:
    -   Are we importing heavy libs (e.g., `mapbox-gl`) dynamically?
    -   Are we using `next/font`?

### 🐞 Debugger
**Mission**: "Root Cause Analysis"
-   **Critical Paths**:
    -   `lib/posthog.ts` -> Event tracking correctness.
    -   `app/**/error.tsx` -> Error boundary implementation.
-   **Specific Checks**:
    -   Are errors strictly logged or just swallowed?
    -   Does the UI crash gracefully?

### 🤖 Orchestrator / Project Planner
**Mission**: "Strategic Alignment"
-   **Critical Paths**:
    -   `docs/plans/` -> Roadmap consistency.
    -   `.agent/workflows/` -> Process efficiency.
-   **Specific Checks**:
    -   Does code match the Plan?
    -   Are tasks tracked in `task.md`?

---

## 🚦 Audit Instructions

When running `domain-audit` for a specific agent:

1.  **Consult this Map**: Find your agent's row.
2.  **Target these Directories**: Use `find` or `ls` on your Critical Paths.
3.  **Cross-Reference**: Check against `CURRENT_STATE_GAP_ANALYSIS.md` to see recent changes in your domain.
4.  **Execute Protocol**: Follow the 5-step loop in `[.agent/skills/domain-audit]`.
