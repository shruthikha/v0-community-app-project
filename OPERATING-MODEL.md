# Operating Model v1

**Status:** v1 — initial version for migration scaffold. Evolves with each retro.
**Owner:** MJ
**Target repo:** Nido + Río monorepo (single repo)
**Primary harness:** OpenCode (desktop + CLI)
**Subscriptions:** Claude Pro ($20), Google AI Pro ($20), OpenRouter (overflow)

---

## Why we're doing this

The current Antigravity setup got Nido+Río to working software with early users. Its patterns are strong: artifact-first, sequential locking, Socratic gates, worklog-as-truth, gap logging. What's breaking: browser automation is unreliable, agent definitions are inconsistent, workflows call 17 roles that aren't all properly defined, skills and patterns accumulate but never compile into improved knowledge, and the repo has grown messier with every AI-assisted change.

The migration is the forcing function. Each phase uses the new setup on real work, so we discover what actually needs to exist rather than designing in the abstract.

---

## Core architectural bets

1. **Portable knowledge, swappable harness, model-agnostic underneath.** Knowledge lives as plain markdown in git. Harness is OpenCode today, possibly different in 6 months. Models are per-agent via OpenCode's native config.
2. **One repo, three trees.** Everything in the Nido+Río monorepo. Three knowledge trees coexist: `docs/` for stable human-curated content, `knowledge/` for the LLM Wiki, `.opencode/` for executable methodology. Code stays in `app/` and `packages/`.
3. **LLM Wiki as living knowledge (Karpathy).** Raw material filed to `knowledge/raw/`, LLMs compile to `knowledge/wiki/`, queries file outputs back in, linting loops improve it. Human rarely edits wiki directly.
4. **Continuous refactoring, never big bangs.** Refactoring opportunities captured during every workflow, worked off opportunistically or by future refactor loops.
5. **Multi-agent only where earned.** Single agent with good tools beats poorly-coordinated multi-agent. OpenCode subagents via Task tool handle coordination when genuinely needed.
6. **Workflows named for canonical AI-native SDLC.** Collaborator recognition. Your discipline (Socratic gates, worklog-as-truth, continuous refactoring, auto-doc) lives inside workflows, not in names.
7. **Every change keeps knowledge current automatically.** Documentation updates wired into workflow closeouts and the post-merge compile action.
8. **CodeRabbit is the PR reviewer, stays that way.** Your agents handle what CodeRabbit doesn't: architecture, domain logic, pattern compliance against your wiki.
9. **Dev→prod migration safety is first-class.** Migrations are gated, verified, applied with rollback, documented in a playbook. Never an afterthought.
10. **Auto-research loops are introduced after core pipeline proves itself.** Only two loops in Phase 6 (post-merge compile, doc drift check). Everything else deferred to Phase 9+ when core is stable and you have capacity.

---

## Key tradeoffs

| Decision | Accepting | Giving up | Mitigation |
|---|---|---|---|
| OpenCode over Claude Code primary | Model portability, AGENTS.md native | Claude Code's subagent system, Max economics | Revisit in 6 months |
| Canonical workflow names | Cleaner onboarding, ecosystem alignment | Existing muscle memory | Discipline lives inside workflows, not names |
| Knowledge tree separate from docs tree | Full Karpathy pattern | Complexity of two markdown trees | Wiki is LLM-maintained |
| Deferred auto-research loops | Simpler Phase 6, ship core faster | Early background improvements | Introduce after 2-3 real features shipped |
| Cabinet deferred | Test OpenCode-primary thesis cleanly | — | Reevaluate month 2 |

---

## Three knowledge trees — rules

**`docs/` is stable and human-curated.** Architecture, ADRs, conventions, runbooks, EA artifacts, user-facing docs, design system, tone of voice. Intentional, reviewed, versioned as part of features. Docusaurus renders `docs/user/` only.

**`knowledge/raw/` is wiki source material.** Build logs, past PRDs, audit reports about code (not code), research clippings, CodeRabbit findings, UserJot drafts. LLM reads constantly, human files rarely edits.

**`knowledge/wiki/` is LLM-compiled, LLM-maintained.** Concepts, patterns, lessons, domain knowledge, tool pages. LLM writes from `raw/`, human reviews occasionally.

**Do not mix these trees.**

---

## CodeRabbit division of labor

**CodeRabbit handles:** line-level review, linting/style, common bug patterns, line-level security (injection, XSS), line-level test coverage gaps

**Our agents handle:** architecture security (auth, RLS strategy, secrets), pattern compliance against wiki, business logic against requirements, SDLC phase integration, wiki compilation, continuous refactoring strategy, doc updates

---

## Continuous refactoring

At every workflow phase, agents watch for refactor opportunities.

- **Execute in current PR if:** ≤10 lines AND clearly related AND files already being changed AND existing test coverage
- **Log otherwise** to `knowledge/raw/refactoring/YYYY-MM-DD_description.md` (standalone MD files with frontmatter)

Weekly `/retro` reviews the backlog. Items >30 days are escalated or explicitly deferred.

---

## Dev→prod migration safety

Migrations are one of the highest-risk operations. The full stack:

1. `migration-safety` skill — pre-flight checks, rollback plan, gates
2. `devops-engineer` agent — owns migration lifecycle
3. `docs/dev/migration-playbook.md` — canonical reference (created Phase 4)
4. `migration-apply.yml` GitHub Action — automated staging→prod application (Phase 6)
5. `/implement` migration safety gate — conditional on touching `supabase/migrations/`
6. `/ship` migration verification — always invoked

**Prevents:** merging untested migrations, deploying code that depends on unapplied migrations, losing prod data on failed migrations, undocumented schema changes.

---

## UserJot integration

Drafts filed to `knowledge/raw/userjot-drafts/`, published manually. Revisit for automation after migration complete if UserJot has a usable API.

---

## Open questions

1. Claude Pro subscription OAuth via OpenCode — works or blocked? (Day 1)
2. GitHub MCP Projects v2 field support — complete or gaps? (Day 2)
3. Final agent count — 13 or different? (Day 6)
4. Model decision per agent — which tier for which role? (Day 7-8)
5. Obsidian as wiki frontend? (Day 20)
6. Migration playbook complexity — does it reveal need for dedicated `release-engineer` agent split? (Day 18)
