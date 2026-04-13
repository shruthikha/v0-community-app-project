---
phase: 1
day: 6
status: skill-research-complete
skill_categories: 18
output_location: knowledge/raw/audits/skill-categories/
---

# Skill Category Research Summary

## Completed

Date: April 8, 2026  
Skill Categories Analyzed: 18  
Sources: Antigravity (.agent/skills/), Superpowers, gstack

## Skill Categories & Sources

| # | Category | Source | Status | Customization Needed |
|---|----------|--------|--------|---------------------|
| 1 | security-review | Antigravity (vulnerability-scanner) | Keep | Add Supabase RLS |
| 2 | vibe-code-check | Antigravity | Keep | Backend-first enforcement |
| 3 | clean-code | Antigravity | Keep | Update verification scripts |
| 4 | refactor-detection | Antigravity (code-archaeologist) | Merge → code-explorer | - |
| 5 | nodejs-best-practices | Antigravity | Keep | Update for Next.js |
| 6 | typescript-patterns | Antigravity | Keep | - |
| 7 | api-patterns | Antigravity | Keep | Next.js API routes |
| 8 | database-design | Antigravity | Keep | Add Supabase |
| 9 | rls-patterns | Antigravity | **ADD** | Supabase-specific |
| 10 | **migration-safety** | NEW (Phase 2) | Create | Critical for devops |
| 11 | test-strategy | Antigravity (testing-patterns) | Keep | Vitest/Playwright |
| 12 | tdd-workflow | Antigravity + Superpowers | Keep | - |
| 13 | doc-writing | Antigravity | Keep | docs/dev structure |
| 14 | lint-and-validate | Antigravity | Keep | Our npm scripts |
| 15 | **socratic-gate** | Antigravity (brainstorming) | Keep | Enforce before workflows |
| 16 | **wiki-query** | NEW | Create | Query wiki patterns |
| 17 | **refactoring-opportunity-capture** | NEW | Create | Log to `knowledge/raw/refactoring/` (standalone MD files) |
| 18 | **auto-doc-update** | NEW | Create | Detect changed files, update docs |
| 19 | **coderabbit-ingest** | NEW | Create | Read PR comments from GitHub MCP |
| 20 | **workflow-recommender** | NEW | Create | Recommend next workflow |
| 21 | tone-of-voice-compliance | Antigravity (content-writer) | Keep | docs/dev/tone-of-voice.md |
| 22 | release-notes-draft | Antigravity (content-writer) | Keep | Technical + user + UserJot |
| 23 | mcp-usage | Context7 + OpenCode docs | Keep | - |

## NEW Skills to Create (Phase 2)

### Critical (Must Have)
1. **socratic-gate** — From antigravity brainstorming, enforce before workflows
2. **wiki-query** — Query wiki for patterns, cite in work
3. **refactoring-opportunity-capture** — Log to `knowledge/raw/refactoring/` (standalone MD files)
4. **migration-safety** — Pre-flight checks, rollback plans, gates
5. **auto-doc-update** — Detect changed files, draft doc updates
6. **git-worktree-management** — From Superpowers using-git-worktrees skill

### High Priority
7. **git-safety-guard** — From gstack /careful, /freeze (warns before destructive commands)
8. **canary-monitoring** — Post-deploy health checks (from gstack /canary)
9. **learn-compounding** — Capture learnings after tasks (from gstack /learn)
10. **workflow-recommender** — Next-workflow recommendations at closeout
11. **coderabbit-ingest** — Read PR comments from GitHub MCP
12. **release-notes-draft** — Technical + user + UserJot variants

### Medium
13. **rls-patterns** — Supabase RLS policies

## Skills to Adapt from Antigravity

| Skill | Source File | Adaptation |
|-------|-------------|------------|
| security-review | vulnerability-scanner/ | Add Supabase context |
| vibe-code-check | vibe-code-check/ | Keep as-is |
| clean-code | clean-code/ | Update scripts for our tools |
| nodejs-best-practices | nodejs-best-practices/ | Update for Next.js |
| api-patterns | api-patterns/ | Next.js API routes |
| database-design | database-design/ | Supabase |
| test-strategy | testing-patterns/ | Vitest/Playwright |
| tdd-workflow | tdd-workflow/ | Keep |
| doc-writing | documentation-templates/ | docs/dev/ |
| lint-and-validate | lint-and-validate/ | npm run lint |
| socratic-gate | brainstorming/ | Enforce in all workflows |
| tone-of-voice-compliance | content-writer/ | docs/dev/tone-of-voice.md |
| release-notes-draft | content-writer/ | UserJot integration |

## Skills to Drop (Not Our Scope)

- mobile-design
- game-development
- seo-fundamentals
- geo-fundamentals
- bash-linux (use Git MCP)
- powershell-windows
- nestjs-expert (not using NestJS)
- prisma-expert (using Supabase)
- python-patterns
- docker-expert

## Phase 2: Skill Building Priority

### Week 2, Day 9 (Skills)

**Create first (from scratch):**
1. socratic-gate
2. wiki-query
3. refactoring-opportunity-capture
4. migration-safety (CRITICAL)
5. auto-doc-update
6. git-worktree-management

**Adapt from Antigravity:**
7. clean-code
8. lint-and-validate
9. tdd-workflow
10. test-strategy
11. security-review
12. vibe-code-check

**Create second wave:**
13. git-safety-guard
14. canary-monitoring
15. learn-compounding
16. workflow-recommender
17. coderabbit-ingest
18. release-notes-draft
19. rls-patterns

---

## Next: Day 6 Tradeoff Review

With MJ:
1. Agent count final (13)
2. Meta-skill adoption (brainstorm-before-code?)
3. Persona imports from agency-agents (0 initially)
4. Continuous refactoring heuristic
5. CodeRabbit integration depth (Light in Phase 6)
6. Release engineer role (fold into devops)

Then → Output `extraction-decisions.md` → Phase 2 starts
