---
framework: Antigravity (.agent)
source: .agent/ARCHITECTURE.md (this repo)
relevance_score: 5
extracted_patterns:
  - 21 specialist agents with defined roles
  - 36 skills across domains
  - 17 workflows (slash commands)
  - Skill loading protocol (match → load → read references → read scripts)
  - Master validation scripts (checklist.py, verify_all.py)
  - Enhanced skills with scripts/references/assets structure
skills_to_port:
  - Many skills directly portable
  - Skill loading protocol
  - Validation scripts
  - Code-review-checklist
workflows_to_adapt:
  - All 17 workflows map to 10 canonical
  - /00_discovery → /explore + /spec
  - /01_brainstorm → /spec (Socratic)
  - /02_review → /spec (enrichment)
  - /03_scope → /plan
  - /04_build → /implement
  - /05_run_qa → /ship
anti_patterns:
  - Some skills are Nido+Río-specific (game-dev, mobile-dev)
  - 17 workflows too many (consolidate to 10)
customizations_needed:
  - Convert to OpenCode YAML format
  - Map to our stack (Next.js, Supabase, Mastra)
  - Remove obsolete roles
---

# Antigravity Framework Deep Dive

## Overview

**Location:** `.agent/` in this repo  
**Components:**
- **21 Specialist Agents** - Role-based AI personas
- **36 Skills** - Domain-specific knowledge modules  
- **17 Workflows** - Slash command procedures
- **2 Master Scripts** - Validation orchestration

This is **your existing framework** — the foundation we're migrating from.

## The 21 Agents

| # | Agent | Purpose | Status for Nido+Río |
|---|-------|---------|---------------------|
| 1 | orchestrator | Multi-agent coordination | **Keep** — core to OpenCode |
| 2 | project-planner | Discovery, task planning | **Split** → product-manager + product-owner |
| 3 | frontend-specialist | Web UI/UX | **Keep** — adapt to Next.js/shadcn |
| 4 | backend-specialist | API, business logic | **Keep** — you have strong baseline |
| 5 | database-architect | Schema, SQL | **Keep** — add Supabase RLS |
| 6 | mobile-developer | iOS, Android, RN | **Drop** — not our scope |
| 7 | game-developer | Game logic | **Drop** — not our scope |
| 8 | devops-engineer | CI/CD, Docker | **Keep** — add migration safety |
| 9 | security-auditor | Security compliance | **Keep** — architecture-level |
| 10 | penetration-tester | Offensive security | **Drop** — overkill |
| 11 | test-engineer | Testing strategies | **Merge** → qa-engineer |
| 12 | debugger | Root cause analysis | **Keep** |
| 13 | performance-optimizer | Speed, Web Vitals | **Drop** — CodeRabbit handles |
| 14 | seo-specialist | Ranking, visibility | **Drop** — not our scope |
| 15 | documentation-writer | Manuals, docs | **Split** → technical-writer + content-writer |
| 16 | product-manager | Requirements, user stories | **Keep** |
| 17 | product-owner | Strategy, backlog, MVP | **Keep** |
| 18 | qa-automation-engineer | E2E testing | **Merge** → qa-engineer |
| 19 | code-archaeologist | Legacy code, refactoring | **Merge** → code-explorer |
| 20 | explorer-agent | Codebase analysis | **Keep** → code-explorer |
| 21 | content-writer | User guides, product copy | **Keep** — user-facing |

## The 36 Skills (Portable Subset)

### Keep (Adapt to Nido+Río)

| Skill | Domain | Notes |
|-------|--------|-------|
| `react-patterns` | Frontend | Keep — Next.js + React 19 |
| `nextjs-best-practices` | Frontend | Keep — App Router |
| `tailwind-patterns` | Frontend | Keep — v4 |
| `frontend-design` | UI/UX | Keep — shadcn/ui |
| `api-patterns` | Backend | Keep — Next.js API routes |
| `nodejs-best-practices` | Backend | Keep |
| `database-design` | Database | Keep — add Supabase |
| `testing-patterns` | QA | Keep |
| `tdd-workflow` | QA | Keep — from Superpowers too |
| `code-review-checklist` | Quality | Keep — enhance |
| `lint-and-validate` | Quality | Keep |
| `vulnerability-scanner` | Security | Keep — OWASP |
| `brainstorming` | Process | Keep — Socratic gate |
| `plan-writing` | Process | Keep — spec writing |
| `clean-code` | Quality | Keep |
| `systematic-debugging` | Debug | Keep — from Superpowers too |
| `deployment-procedures` | DevOps | Keep — adapt |
| `documentation-templates` | Docs | Keep |
| `user-guide-writing` | Content | Keep |
| `behavioral-modes` | Process | Adapt → agent personas |
| `parallel-agents` | Process | Adapt → Task tool |

### Drop (Not Our Scope)

- `nestjs-expert` — not using NestJS
- `prisma-expert` — using Supabase, not Prisma
- `python-patterns` — not using Python backend
- `docker-expert` — not containerizing
- `mobile-design` — no mobile app
- `game-development` — no games
- `seo-fundamentals` — not our scope
- `geo-fundamentals` — not our scope
- `i18n-localization` — defer
- `excalidraw-diagrams` — defer
- `content-localization` — defer
- `screenshot-annotation` — defer
- `bash-linux` — use Git MCP instead
- `powershell-windows` — not needed
- `mcp-builder` — we use opencode.json
- `performance-profiling` — CodeRabbit handles

## The 17 Workflows → 10 Canonical

| Current | Maps to | Notes |
|---------|---------|-------|
| `/00_discovery` | `/explore` + `/spec` | Discovery phases |
| `/01_brainstorm` | `/spec` | Socratic discovery |
| `/02_review` | `/spec` | Issue enrichment |
| `/03_scope` | `/plan` | Implementation strategy |
| `/04_build` | `/implement` | Build + verify |
| `/05_run_qa` | `/ship` | QA + release |
| `/create` | `/implement` | Feature creation |
| `/debug` | (new) | Debugger workflow |
| `/deploy` | `/ship` | Deploy phase |
| `/enhance` | `/implement` | Enhancement |
| `/orchestrate` | (internal) | Orchestrator agent |
| `/plan` | `/plan` | Task breakdown |
| `/preview` | (auto) | In tooling |
| `/status` | (auto) | In tooling |
| `/test` | `/ship` | Test phase |
| `/ui-ux-pro-max` | (deprecated) | Use existing skills |
| `/document` | `/document` | Keep for major projects |

## Skill Loading Protocol

```
User Request → Skill Description Match → Load SKILL.md
                                              ↓
                                      Read references/
                                              ↓
                                      Read scripts/
```

**OpenCode adaptation:** Skills auto-loaded based on task context — similar to how OpenCode reads from `.opencode/skills/`.

## Validation Scripts

### checklist.py
- Security (vulnerabilities, secrets)
- Code Quality (lint, types)
- Schema Validation
- Test Suite
- UX Audit
- SEO Check

### verify_all.py
- Everything in checklist.py PLUS:
- Lighthouse (Core Web Vitals)
- Playwright E2E
- Bundle Analysis
- Mobile Audit
- i18n Check

**OpenCode adaptation:** These map to our existing `npm run lint`, `npm run type-check`, `npm run test` — plus future GitHub Actions.

## Relevance to Nido+Río Migration

### What to Extract (High Priority)

1. **Agent definitions** — 13 of 21 are directly usable
2. **Skills** — ~20 of 36 port directly
3. **Workflow structure** — Map 17 → 10 canonical
4. **Validation patterns** — Enhance with GitHub Actions

### Antigravity → OpenCode Mapping

| Antigravity | OpenCode |
|------------|----------|
| `.agent/agents/` | `.opencode/agent/` |
| `.agent/skills/` | `.opencode/skills/` |
| `.agent/workflows/` | `.opencode/command/` |
| SKILL.md | SKILL.md (same format!) |
| Slash commands | YAML command files |

### Score

| Criterion | Score | Notes |
|-----------|-------|-------|
| Workflow discipline | 4/5 | 17 workflows, some overlap |
| Skill portability | 5/5 | **Already in our repo** |
| Multi-agent coordination | 4/5 | orchestrator exists |
| **Overall** | **4.3/5** | **Primary source** |

## Files to Reference

The actual agent definitions to review for Phase 2:
- `.agent/agents/backend-specialist.md` (strong baseline)
- `.agent/agents/frontend-specialist.md` (adapt to Next.js)
- `.agent/agents/database-architect.md` (add Supabase)
- `.agent/agents/security-auditor.md` (keep)
- `.agent/agents/debugger.md` (keep)
- `.agent/agents/devops-engineer.md` (add migration safety)
- `.agent/agents/product-manager.md` (keep)
- `.agent/agents/product-owner.md` (keep)
- `.agent/agents/orchestrator.md` (adapt for Task tool)

Skills to review:
- `.agent/skills/systematic-debugging/`
- `.agent/skills/tdd-workflow/`
- `.agent/skills/clean-code/`
- `.agent/skills/brainstorming/`
- `.agent/skills/database-design/`
