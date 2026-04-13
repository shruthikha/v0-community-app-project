# AGENTS.md — Ecovilla Community Platform

## Project Identifiers

- **GitHub repo**: `[your-github-org/your-repo-name](https://github.com/mjcr88/v0-community-app-project)` (use this as `owner` and `repo` parameters for ALL GitHub MCP tool calls — `github_get_issue`, `github_search_issues`, `github_list_issues`, etc.)
- **Default branch**: `main`
- **Issue tracker**: GitHub issues on the same repo
- **Supabase project (dev)**: `ehovmosz...`
- **Supabase project (prod)**: `csatxwf...`

When agents call GitHub MCP tools, they MUST pass the `owner` and `repo` from the GitHub repo identifier above. Never call these tools without those parameters.

## Phase Tracking

For any multi-phase workflow or task list, agents MUST use the TodoWrite tool to create a visible task list at the start and keep it updated as phases progress. This applies whether the work is invoked via a command, a direct request, or a subagent dispatch.

Mark phases as `in_progress` when starting, `completed` when outputs exist, and `cancelled` (with reason) when skipped. Reference the current phase at review gates and completion points — not in every message.

## Working Principles

- **Assume nothing about the codebase.** Before modifying any file, verify its actual current state. Plans and specs describe intent; the code describes reality. When they disagree, reality wins. Load the `assume-nothing` skill when in doubt. This applies whether you're invoked via a command, a direct request, or a subagent dispatch.

## Commands

```bash
npm run dev          # Dev server binds to 0.0.0.0 (mobile-accessible on local IP)
npm run build        # next build (ignores eslint + tsc errors per next.config.mjs)
npm run lint         # ESLINT_USE_FLAT_CONFIG=false eslint .
npm run type-check   # tsc --noEmit
npm run test         # vitest (3 projects: storybook, unit, components)
npm run storybook    # storybook dev -p 6006
npm run dev:agent    # packages/rio-agent on PORT=3001
npm run docs:dev     # docs-site on port 3001
```

**Verification order**: `lint -> type-check -> build`. The build config ignores both eslint and tsc errors, so run them explicitly before deploying.

## Architecture

- **Next.js 16.1.7** App Router, React 19.2.1, TypeScript 5.x, Tailwind CSS 4.1.9
- **Multi-tenant**: all resident routes under `/t/[slug]/`. Root page redirects to `/t/ecovilla-san-mateo/login`
- **Auth**: Supabase SSR via `@supabase/ssr`. Middleware at `middleware.ts` calls `updateSession()` on every request
- **Middleware timeout**: 2-hour inactivity logout (unless "Remember Me" is set). Skips `/auth/*` paths to avoid corrupting recovery sessions
- **Supabase instances**: dev = `ehovmosz...`, prod = `csatxwf...` (see `.agents/config.yaml`)
- **Path alias**: `@/*` → project root
- **shadcn/ui**: "new-york" style, Lucide icons. UI primitives live in `components/library/` (not `components/ui/`)

## Directory Boundaries

| Path | Purpose |
|------|---------|
| `app/t/[slug]/` | Tenant-scoped routes (dashboard, admin, onboarding, login) |
| `app/backoffice/` | Super admin interface |
| `app/api/v1/` | REST API endpoints |
| `app/actions/` | Server actions (mutations) |
| `components/library/` | shadcn/ui primitives |
| `components/ecovilla/` | Platform-specific components (MobileDock, nav, etc.) |
| `components/ui/` | Legacy/custom UI components (not shadcn) |
| `lib/supabase/` | Supabase clients: `client.ts`, `server.ts`, `admin.ts`, `middleware.ts` |
| `lib/data/` | Data access layer |
| `packages/rio-agent/` | Separate agent service (own dev server on port 3001) |

## Testing

- **Vitest** has 3 isolated projects:
  - `storybook` — browser tests via Playwright Chromium
  - `unit` — Node env, matches `lib/**/*.test.{ts,tsx}`, `app/**/*.test.{ts,tsx}`, `packages/**/*.test.{ts,tsx}`
  - `components` — jsdom env, matches `components/**/*.test.{ts,tsx}`
- **E2E**: Playwright, tests in `e2e/`, base URL `http://localhost:3000`
- Run single test: `npm run test -- -t "test name"` or `npm run test -- path/to/file.test.ts`

## Database & Migrations

- Supabase PostgreSQL with Row-Level Security (RLS) on all tables
- Migrations in `supabase/migrations/`
- **No direct SQL** in app code — use Supabase JS client or RPCs
- Soft deletes via status columns (not hard deletes)

## Deployment

- **Vercel** auto-deploys from `main`
- Preview deployments on PRs
- Vercel cron jobs: `/api/cron/check-return-dates` and `/api/cron/archive-announcements` (daily at midnight)

## Gotchas

- `next.config.mjs` sets `ignoreDuringBuilds: true` and `ignoreBuildErrors: true` — always run `lint` and `type-check` manually before pushing
- Middleware skips `/auth/*` paths to prevent session cookie corruption during password recovery
- `CODEBASE.md` is stale (says Next.js 14; actual is 16.1.7)
- `components/_deprecated/` is excluded from tsconfig — do not add new files there
- `docs-site` is excluded from tsconfig and has its own npm workflow

## Knowledge Trees

- **`docs/dev/`** — stable developer docs: architecture, ADRs, conventions, migration playbook, design system, tone of voice
- **`docs/user/`** — user-facing docs (rendered by Docusaurus)
- **`knowledge/wiki/`** — LLM-compiled knowledge (concepts, patterns, lessons, tools). Query before designing.
- **`knowledge/raw/`** — raw source material (build logs, audits, research). File here, don't edit wiki directly.
- **`OPERATING-MODEL.md`** — philosophy and rules of the system

## Agent Registry

| Agent | Domain | Triggers |
|-------|-------|----------|
| @orchestrator | Coordination | orchestrator, coordinate, multi-phase |
| @backend-specialist | Backend | api, server, supabase, database |
| @frontend-specialist | Frontend | ui, component, react, styles |
| @database-architect | Database | schema, migration, rls, indexes |
| @security-auditor | Security | security, audit, vulnerability |
| @qa-engineer | Testing | test, verify, qa, regression |
| @devops-engineer | DevOps | deploy, production, migration |
| @product | Product | requirements, story, backlog, scope |
| @investigator | Investigation | explore, debug, investigate, bug |
| @solution-architect | Architecture | design, cross-cutting, adr |

**Removed (consolidated):**
- PM + PO → @product
- technical-writer + content-writer → skill (all agents write)
- code-explorer + debugger → @investigator

## Agent Boundaries

| Agent | Can Do | Cannot Do |
|-------|--------|----------|
| @frontend-specialist | Components, UI, hooks | API routes, DB schema, tests |
| @backend-specialist | API, server logic, Supabase | UI components |
| @qa-engineer | Tests, verification | Production feature code |
| @database-architect | Schema, migrations | UI, API logic |
| @security-auditor | Audit, review | Feature code |
| @investigator | Explore, debug, fix | Decide product scope |
| @product | Requirements, scope | Write production code |

## Skills

Skills live in `.opencode/skills/`. Agents discover them automatically via the `skill` tool. Current skill categories:

- **Methodology**: workflow-methodology, socratic-gate, wiki-query, assume-nothing, verification-before-completion
- **Code quality**: quality-gate, systematic-debugging, tdd-patterns, refactoring-opportunity-capture
- **Domain**: nido-multi-tenancy, nido-design-system, migration-safety
- **Workflow**: brainstorm-before-code, writing-plans, subagent-dispatch, workflow-recommender
- **Communication**: tone-of-voice-compliance, release-notes-draft, auto-doc-update, agent-collaboration
- **Git/PR**: git-workflow, coderabbit-ingest
- **Ecosystem**: react-best-practices, web-design-guidelines, supabase, postgres-best-practices

Run `ls .opencode/skills/` for the canonical current list.

## OpenCode Workflows

- **`.opencode/command/`** — slash commands (`/explore`, `/spec`, `/plan`, `/implement`, `/ship`, `/audit`, `/retro`, `/document`, `/adr`, `/refactor-spot`)
- **`.opencode/agent/`** — agent definitions (10 roles)
- **`.opencode/skills/`** — reusable skills
- Use Task tool to dispatch subagents for specialized work

## Never Do

- Never write raw SQL — use Supabase JS client or RPCs
- Never commit secrets, API keys, or service role keys
- Never bypass RLS policies or add tables without tenant_id
- Never use `any` in TypeScript
- Never edit `knowledge/wiki/` directly — file source to `knowledge/raw/`
- Never use browser automation — use GitHub MCP, Git MCP, Supabase MCP
- Never skip Socratic gate on workflows without explicit `--yolo` flag (logged)
- Never add files to `components/_deprecated/` or `components/ui/` (use `components/library/` for shadcn)
