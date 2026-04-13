# Migration Plan v8: Antigravity → OpenCode + LLM Wiki

**Status:** v8 — Phase 5 complete. 10 agents, 25 skills, 10 commands built. Full codebase audit done. Wiki compiled.
**Phase 2 Complete:** 10 agents built, 25 skills, 10 commands.
**Phase 3 Complete:** 156 legacy docs ingested to `knowledge/raw/`.
**Phase 4 Complete:** Full hierarchical codebase audit (top-level, per-module, cross-cutting, synthesis).
**Phase 5 Complete:** Wiki compiled and linted with concepts, patterns, lessons, tools, domains.
**Agent Consolidation:** PM+PO → product (1 agent), writers → skill (all agents write), explorer+debugger → investigator (1 agent).
**Owner:** MJ
**Target repo:** Nido + Río monorepo (single repo)
**Primary harness:** OpenCode (desktop + CLI)
**Subscriptions:** Claude Pro ($20), Google AI Pro ($20), OpenRouter (overflow)
**Duration:** ~6 weeks to fully operational with core loops. Additional auto-research loops added in Phase 9+ as earned.
**Branch:** `chore/migration-scaffold` (merge at Phase 6, Day 23 — after scripts + GitHub Actions created and tested)

**Changes from v4:**

* **Phase 0 complete:** scaffold, docs, MCPs, /explore ported
* **Phase 1 complete:** framework research, agent templates scored, skill categories identified, tradeoff decisions confirmed

**Changes from v5 (April 2026):**

* **Phase 2 in progress:** 14/17 agents built with build log methodology
* **Build log methodology added to ALL agents:** Wiki Check + Build Log Check + Never Do + Integration Points
* **Analyst removed from scope:** User decision - not building this agent
* **Solution-architect built:** System design, cross-cutting concerns, ADR documentation
* **3 agents deferred:** strategist, enterprise-architect (deferred to Phase 4+)
* **Tradeoffs confirmed:**
  * 17 agents (no Enterprise Architect in Phase 2 — deferred to Phase 4)
  * Git management as skills (not dedicated agent)
  * Adopt brainstorm-before-code meta-skill
  * Superpowers subagent pattern (fresh + two-stage review)
  * CodeRabbit Medium (security + deps)
  * Release engineer folded into DevOps
* **Framework research complete:** Deep-dived into Superpowers, gstack, agency-agents, BMAD, Antigravity

**Phase 0 progress (as of April 6, 2026):**

| Step | Status |
|---|---|
| OpenCode installed + providers configured | ✅ Done |
| Branch `chore/migration-scaffold` created | ✅ Done |
| `docs/` → `docs-legacy/` renamed | ✅ Done |
| `.gitignore` updated | ✅ Done |
| Directory structure scaffolded | ✅ Done |
| Brand docs copied to `docs/dev/` + `knowledge/raw/research/brand-docs/` | ✅ Done |
| `.agents/config.yaml` + example written | ✅ Done |
| `OPERATING-MODEL.md` v1 written | ✅ Done |
| `AGENTS.md` v1 generated via `/init` and augmented | ✅ Done |
| MCPs configured in `opencode.json` (GitHub, Filesystem, Git, Supabase, Context7) | ✅ Done |
| GitHub MCP Projects v2 test | ✅ Blocked (fine-grained PAT limitation) — new approach adopted |
| `/explore` command ported | ✅ Done |
| OpenCode docs ingested to wiki | ✅ Done |

**Phase 1 progress (as of April 11, 2026):**

| Step | Status |
|---|---|
| Framework research (10 frameworks) | ✅ Done |
| Agent template research (17 agents scored) | ✅ Done |
| Skill category research (19 skills identified) | ✅ Done |
| Deep-dive into framework files | ✅ Done |
| Tradeoff review with MJ | ✅ Done |
| Extraction list locked | ✅ Done |
| Patterns + lessons compiled early to wiki | ✅ Done |
| Design system compiled to wiki | ✅ Done |

**Phase 2 progress (as of April 11, 2026):**

| Agent | Status | Notes |
|---------------------|-----------|------------|
| orchestrator | ✅ Built | mode: all, checkpoint review |
| backend-specialist | ✅ Built | Agency-Agents patterns, multi-tenancy, RLS |
| frontend-specialist | ✅ Built | Deep Design, WCAG AA, design system wiki ref |
| database-architect | ✅ Built | Supabase-only, RLS mandatory |
| security-auditor | ✅ Built | Read-only, architecture-level |
| qa-engineer | ✅ Built | Test strategy, coverage |
| devops-engineer | ✅ Built | CI/CD, migration safety |
| solution-architect | ✅ Built | System design, ADRs |
| product | ✅ Built | PM+PO consolidated |
| investigator | ✅ Built | explorer+debugger consolidated |
| **Total: 10/10** | ✅ Complete | |

*Note: Agent consolidation in Batch 3. Writers converted to documentation-writing skill (all agents write).*

**Consolidated (4 merged):**
- product-manager + product-owner → @product
- technical-writer + content-writer → @skill (all agents write)
- code-explorer + debugger → @investigator

**Deferred (2):**
- strategist
- enterprise-architect

**Removed:** analyst (user decision)

**Skills (as of April 10, 2026):**

| Skill | Type | Source |
|---------------------|---------|------------|
| documentation-writing | Custom | Tier 1 |
| agent-collaboration | Custom | Tier 1 |
| auto-doc-update | Custom | Tier 2 |
| brainstorm-before-code | Hybrid | Tier 2 |
| coderabbit-ingest | Custom | Tier 4 |
| git-workflow | Hybrid | Tier 5 |
| migration-safety | Custom | Tier 2 |
| nido-design-system | Custom | Tier 1 |
| nido-multi-tenancy | Custom | Tier 1 |
| quality-gate | Custom | Tier 1 |
| refactoring-opportunity-capture | Custom | Tier 2 |
| release-notes-draft | Custom | Tier 2 |
| socratic-gate | Custom | Tier 1 |
| subagent-dispatch | Custom | Tier 2 |
| systematic-debugging | Hybrid | Tier 5 |
| tdd-patterns | Custom | Tier 5 |
| tone-of-voice-compliance | Custom | Tier 4 |
| verification-before-completion | Hybrid | Tier 5 |
| wiki-query | Custom | Tier 1 |
| workflow-recommender | Custom | Tier 2 |
| writing-plans | Custom | Tier 2 |
| vercel-react-best-practices | Ecosystem | Vercel |
| web-design-guidelines | Ecosystem | Vercel |
| supabase | Ecosystem | Supabase |
| supabase-postgres-best-practices | Ecosystem | Supabase |

**Total: 25 skills (21 custom + 4 ecosystem)**

**Commands (as of April 10, 2026):**


| Command | Purpose | Key Features |
|---------|---------|-------------|
| /explore | Codebase/topic/idea exploration | Socratic gate, wiki query, Context7 |
| /spec | Feature specification | 7-question GATE, requirements, design, GitHub issue |
| /plan | Sprint planning | Sizing, risk assessment, rollback strategies |
| /implement | Build from spec | Worklog, migration safety, draft PR |
| /ship | QA + release | Tests, migration audit, vibe check, release notes |
| /audit | Codebase review | Security/performance/quality, severity classification |
| /retro | Weekly retrospective | Wiki compile, pattern analysis |
| /document | Documentation project | Technical + user modes |
| /adr | Architecture decision record | Full ADR format with alternatives |
| /refactor-spot | Refactor capture | Quick backlog capture |

**Total: 10 commands**

---

## What's Next (Phase 6)

**Phase 6 — Core Loops and GitHub Actions:**
- [ ] Coherence test: dry-run each of the 10 workflows on trivial tasks in a throwaway branch
- [ ] `wiki-compile.ts` script — reads new build logs, appends to wiki
- [ ] `docs-drift-check.ts` script — diffs PR changes against docs/wiki
- [ ] `pr-quality-gate.yml` — lint → type-check → test → build on PRs
- [ ] `post-merge-compile.yml` — wiki compile on merge to main
- [ ] `doc-drift-check.yml` — drift check on PRs
- [ ] `migration-apply.yml` — Supabase migration apply with staging→prod flow
- [ ] `stale-branch-cleanup.yml` — auto-close abandoned branches after 30 days
- [ ] `.github/dependabot.yml` — dependency scanning for npm + GitHub Actions
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` — structured PR descriptions
- [ ] Test all 5 actions on test PRs

**⚠️ MERGE GATE:** The `chore/migration-scaffold` branch should be merged to `main` at **Phase 6, Day 23** — after all 5 GitHub Actions are created and tested on test PRs. This is the first merge to main from this branch. Do NOT merge before Phase 6 is complete, because:
1. The scaffold includes structural changes (docs/ → docs-legacy/, new directory trees)
2. GitHub Actions need to be tested before they run on main
3. The post-merge-compile action should fire on the merge commit itself as a real test

**CodeRabbit CLI decision:** Not added to CI/CD. CodeRabbit GitHub App already reviews every PR automatically. CLI is for local pre-commit use only. Consider adding as local pre-commit hook or optional `/implement` step in Phase 7+.

**Deferred:**
- Enterprise architect agent
- Strategist agent
- Phase 9+ auto-research loops
- CodeRabbit CLI in CI (redundant with GitHub App)
- CodeRabbit CLI in CI (redundant with GitHub App)

---

## Part 1: Foundation principles (read before executing)

These belong in `OPERATING-MODEL.md` once created. Executing without understanding them produces a mechanical result that misses the point.

### Why we're doing this

The current Antigravity setup got Nido+Río to working software with early users. Its patterns are strong: artifact-first, sequential locking, Socratic gates, worklog-as-truth, gap logging. What's breaking: browser automation is unreliable, agent definitions are inconsistent, workflows call 17 roles that aren't all properly defined, skills and patterns accumulate but never compile into improved knowledge, and the repo has grown messier with every AI-assisted change.

The migration is the forcing function. Each phase uses the new setup on real work, so we discover what actually needs to exist rather than designing in the abstract.

### Core architectural bets

1. **Portable knowledge, swappable harness, model-agnostic underneath.** Knowledge lives as plain markdown in git. Harness is OpenCode today, possibly different in 6 months. Models are per-agent via OpenCode's native config.
2. **One repo, three trees.** Everything in the Nido+Río monorepo. Three knowledge trees coexist: `docs/` for stable human-curated content, `knowledge/` for the LLM Wiki, `.opencode/` for executable methodology. Code stays in `apps/` and `packages/`.
3. **LLM Wiki as living knowledge (Karpathy).** Raw material filed to `knowledge/raw/`, LLMs compile to `knowledge/wiki/`, queries file outputs back in, linting loops improve it. Human rarely edits wiki directly.
4. **Continuous refactoring, never big bangs.** Refactoring opportunities captured during every workflow, worked off opportunistically or by future refactor loops.
5. **Multi-agent only where earned.** Single agent with good tools beats poorly-coordinated multi-agent. OpenCode subagents via Task tool handle coordination when genuinely needed.
6. **Workflows named for canonical AI-native SDLC.** Collaborator recognition. Your discipline (Socratic gates, worklog-as-truth, continuous refactoring, auto-doc) lives inside workflows, not in names.
7. **Every change keeps knowledge current automatically.** Documentation updates wired into workflow closeouts and the post-merge compile action.
8. **CodeRabbit is the PR reviewer, stays that way.** Your agents handle what CodeRabbit doesn't: architecture, domain logic, pattern compliance against your wiki.
9. **Dev→prod migration safety is first-class.** Migrations are gated, verified, applied with rollback, documented in a playbook. Never an afterthought.
10. **Auto-research loops are introduced after core pipeline proves itself.** Only two loops in Phase 6 (post-merge compile, doc drift check). Everything else deferred to Phase 9+ when core is stable and you have capacity.

### Key tradeoffs you are accepting

**OpenCode over Claude Code primary:** Model portability, AGENTS.md native. Give up Claude Code's stronger subagent system and Max economics. Revisit 6 months.

**Canonical workflow names over existing ones:** Cleaner onboarding, ecosystem alignment. Give up existing muscle memory. Acceptable because discipline is inside, not in names.

**Knowledge tree separate from docs tree:** Full Karpathy pattern. Complexity of two markdown trees with different rules. Mitigation: wiki is LLM-maintained.

**Deferred auto-research loops:** Simpler Phase 6. Lose early background improvements. Worth it to ship core faster and avoid tuning loop noise during migration.

**Cabinet deferred:** Test OpenCode-primary thesis cleanly. Reevaluate month 2.

---

## Part 2: Target architecture

### Directory structure

```
repo/
├── AGENTS.md                         # Universal entry point, ≤80 lines
├── OPERATING-MODEL.md                # Meta philosophy (this Part 1)
├── README.md
├── .gitignore
│
├── .opencode/                        # OpenCode configuration (COMMITTED)
│   ├── agent/                        # Agent definitions (OpenCode uses 'agent/' singular)
│   ├── command/                      # Slash commands (OpenCode uses 'command/' singular)
│   ├── skills/                       # Skills (SKILL.md portable format)
│   └── opencode.json                 # OpenCode-specific project config
│
├── .agents/                          # Harness-agnostic shared config (COMMITTED)
│   ├── config.yaml                   # URLs, project IDs, paths (no secrets)
│   ├── config.local.yaml             # GITIGNORED, real values
│   └── mcp.json                      # MCP server definitions (reference)
│
├── .github/
│   └── workflows/
│       ├── post-merge-compile.yml    # Worklog → wiki on merge (Phase 6)
│       ├── doc-drift-check.yml       # Doc freshness on PR (Phase 6)
│       ├── pr-quality-gate.yml       # Lint/typecheck/test (Phase 6)
│       ├── migration-apply.yml       # Supabase migration apply with rollback (Phase 6)
│       └── nightly-loops.yml         # DEFERRED to Phase 9+
│
├── docs/                             # Stable, human-curated knowledge
│   ├── user/                         # → Docusaurus renders this as public site
│   │   ├── getting-started.md
│   │   ├── guides/
│   │   ├── api-reference.md
│   │   └── releases/                 # User-facing release notes (NEW)
│   ├── dev/                          # Developer-facing stable docs
│   │   ├── architecture/             # Solution architecture (backfilled Phase 4)
│   │   ├── decisions/                # ADRs
│   │   ├── conventions.md            # Coding conventions
│   │   ├── design-principles.md      # Your design specs (imported Phase 0)
│   │   ├── tone-of-voice.md          # Your tone-of-voice doc (imported Phase 0)
│   │   ├── migration-playbook.md     # Dev→prod migration playbook (Phase 4)
│   │   ├── collaborator-onboarding.md # How to plug in any harness (Phase 8)
│   │   └── ea/                       # Lightweight EA artifacts
│   │       ├── applications.md
│   │       ├── capabilities.md
│   │       ├── databases.md
│   │       └── infrastructure.md
│   ├── specs/                        # Active feature specs (replaces 02_requirements, 03_prds)
│   └── ops/                          # Runbooks, deployment, ops processes
│
├── knowledge/                        # The LLM Wiki layer
│   ├── raw/                          # Raw material
│   │   ├── build-logs/               # Build worklogs (replaces 04_logs)
│   │   ├── prds-archive/             # Past PRDs
│   │   ├── requirements-archive/     # Past requirements
│   │   ├── audits/                   # Audit reports ABOUT code (code stays in apps/)
│   │   ├── research/                 # Web clippings, external docs
│   │   ├── meetings/                 # Future: transcripts, notes
│   │   ├── coderabbit/               # Compiled CodeRabbit findings from PR history
│   │   ├── userjot-drafts/           # Drafted UserJot posts awaiting manual publish
│   │   └── experiments/              # Phase 9+ auto-research outputs
│   ├── wiki/                         # LLM-compiled, LLM-maintained
│   │   ├── _index.md                 # Auto-maintained TOC
│   │   ├── concepts/
│   │   ├── patterns/                 # Replaces nido_patterns.md
│   │   ├── lessons/                  # Replaces lessons_learned.md
│   │   ├── tools/                    # Tool knowledge (opencode.md, supabase-nido.md, etc.)
│   │   ├── requirements/             # Active feature requirements backlog (from /plan)
│   │   │   ├── refactoring/              # Refactoring backlog (from /refactor-spot, /audit)
│   │   ├── documentation-gaps.md
│   │   └── domains/
│   │       ├── engineering/
│   │       ├── product/
│   │       └── (future: ops, sales, marketing)
│   └── outputs/                      # Query outputs, filed back into wiki periodically
│
├── scripts/
│   └── compile/                      # Only compile scripts in Phase 6
│       ├── wiki-compile.ts           # Called by post-merge-compile.yml
│       └── docs-drift-check.ts       # Called by doc-drift-check.yml
│
├── apps/                             # Your actual Nido + Río product code (UNTOUCHED)
│   ├── nido/                         # Nido app
│   └── rio-assistant/                # Río (uses Mastra internally, product-only)
│
└── packages/                         # Shared packages (UNTOUCHED)
```

### .gitignore additions

```gitignore
# OpenCode local state
.opencode/sessions/
.opencode/cache/

# Local secrets
.agents/config.local.yaml
.agents/*.secret.*

# Future: loop experiment outputs older than 30 days
# (managed by nightly cleanup when loops are introduced in Phase 9+)
knowledge/raw/experiments/archive/

# Obsidian local state (if installed in Phase 5)
.obsidian/workspace*.json
.obsidian/cache
```

### Three knowledge trees, three rules

* **`docs/` is stable and human-curated.** Architecture, ADRs, conventions, runbooks, EA artifacts, user-facing docs, design principles, tone of voice. Intentional, reviewed, versioned as part of features. Docusaurus renders `docs/user/` only.
* **`knowledge/raw/` is wiki source material.** Build logs, past PRDs, audit reports ABOUT code (not code), research clippings, CodeRabbit findings, UserJot drafts. LLM reads constantly, human files and rarely edits.
* **`knowledge/wiki/` is LLM-compiled, LLM-maintained.** Concepts, patterns, lessons, domain knowledge, tool pages. LLM writes from `raw/`, human reviews occasionally.

**Do not mix these trees.**

### Tool knowledge — where it lives (formalized)

```
Decision rule:
1. Does it change every few weeks (fast-moving framework)? → Context7 MCP only
2. Is it runtime API access? → MCP (GitHub, Supabase, Git, Filesystem, Context7)
3. Is it OUR pattern on top of the tool? → knowledge/wiki/tools/<tool>-<context>.md
4. Is it an executable "how we use this" pattern? → .opencode/skills/<tool>-<action>/SKILL.md
5. Is it operational playbook? → knowledge/wiki/tools/<tool>.md
6. Is it an active development tool (OpenCode)? → BOTH wiki concept page AND skills
```

**For Nido+Río:**

| Tool                             | Pattern                  | Where                                                                                                 |
| -------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| OpenCode                         | Active dev tool          | `knowledge/wiki/tools/opencode.md`+`.opencode/skills/`patterns                                    |
| Next.js, React, Tailwind, shadcn | Fast-moving framework    | Context7 MCP only                                                                                     |
| Mastra                           | Framework + our patterns | Context7 MCP for API +`knowledge/wiki/tools/mastra-nido-patterns.md`for Río usage                  |
| Supabase                         | Framework + operational  | Supabase MCP runtime + Context7 API +`knowledge/wiki/tools/supabase-nido.md`for RLS and conventions |
| GitHub                           | Operational              | GitHub MCP runtime +`knowledge/wiki/tools/github-workflow.md`for branching/release playbooks        |
| Railway                          | Operational              | `knowledge/wiki/tools/railway-nido.md`playbook                                                      |
| Vercel                           | Operational              | `knowledge/wiki/tools/vercel-nido.md`playbook (if used)                                             |
| CodeRabbit                       | Integration concept      | `knowledge/wiki/tools/coderabbit.md`explaining integration                                          |
| Docusaurus                       | Active dev tool          | `knowledge/wiki/tools/docusaurus.md`+ any skills                                                    |
| UserJot                          | Integration concept      | `knowledge/wiki/tools/userjot.md`+ draft workflow                                                   |

**Phase 0 ingests OpenCode. Phase 4 synthesis creates Supabase, Mastra, GitHub pages. Others added as you touch them.**

---

## Part 3: Workflow redesign (canonical AI-native SDLC)

### Target workflows

Your 7 workflows get replaced by 10 canonical ones. Discipline lives inside.

**Core pipeline:**

1. **`/explore`** — codebase, topic, or idea exploration. Replaces discovery Phase 1 and brainstorm Phase 1. Outputs to `knowledge/raw/research/` or `knowledge/raw/audits/`.
2. **`/spec`** — spec-driven definition. Replaces brainstorm Phases 2-5 and review Phases 0-4. Socratic gate mandatory. Outputs requirements, design, tasks to `docs/specs/<feature>/`. Continuous refactoring capture. Creates GitHub issue via `gh` CLI or GitHub MCP on completion. Spec-doc-as-truth — no GitHub Projects dependency.
3. **`/plan`** — sprint planning. Replaces scope. Socratic gate. Outputs sprint PRD to `docs/specs/<sprint>/plan.md`. Spec-doc-as-truth approach — no GitHub Projects dependency. Sizing, risk flagging, rollback strategies for HIGH RISK items. GitHub issues created manually or via `gh` CLI when needed.
4. **`/implement`** — build. Replaces build. Worklog-as-truth to `knowledge/raw/build-logs/log_YYYY-MM-DD_<feature>.md`. Wiki query for pattern reference. Socratic gate before coding. Continuous refactoring capture. Auto-doc update trigger in closeout. Draft PR early, ready at closeout. **Migration safety: if Phase 2 touches `supabase/migrations/`, mandatory migration-safety skill invocation with pre-flight checks.**
5. **`/ship`** — QA and release. Replaces run_qa. CodeRabbit findings via GitHub MCP. Migration audit (mandatory if migrations changed). Vibe code check against wiki. Release notes drafted (technical + user-facing + UserJot draft). Auto-doc finalization. Merge. **Migration safety: pre-merge migration verification, post-merge migration application via GitHub Action.**

**Supporting workflows:**

6. **`/audit`** — codebase ingestion and systematic review. Used Phase 4. Modes: `--top-level`, `--module <path>`, `--cross-cutting <concern>`, `--synthesis`. Agents read code in place, produce reports to `knowledge/raw/audits/`.
7. **`/retro`** — weekly retrospective. Reads recent worklogs, surfaces patterns, triggers wiki compile via the Phase 6 action, updates lessons/patterns, proposes AGENTS.md updates. Reviews refactoring backlog. Produces weekly report.
8. **`/document`** — on-demand documentation project. Two modes: `/document --technical` (dispatches `technical-writer`) and `/document --user` (dispatches `content-writer`). For major doc efforts. Routine updates are automatic via workflow closeouts.
9. **`/adr`** — create architecture decision record. Produces `docs/dev/decisions/NNNN-title.md`. Referenced by future workflows.
10. **`/refactor-spot`** — quick refactor opportunity capture. Creates standalone MD in `knowledge/raw/refactoring/`.

### Migration mapping from current workflows

| Current         | Maps to                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| `/discovery`  | `/explore`(Phase 1) +`/spec`(Phases 2-4) +`/plan`(issue creation) |
| `/brainstorm` | `/spec`                                                               |
| `/review`     | `/spec`(enrichment phases)                                            |
| `/scope`      | `/plan`                                                               |
| `/build`      | `/implement`                                                          |
| `/run_qa`     | `/ship`                                                               |
| `/document`   | `/document`(kept for major projects only)                             |

### Quality mechanisms inside every workflow

Every workflow includes:

* **Mandatory Socratic gate at entry.** Structurally enforced via `socratic-gate` skill. Skipping requires explicit `--yolo` flag, logged.
* **Artifact-first discipline.** Every phase produces a file.
* **Wiki query in context phase.** Before generating options or designs, workflow invokes `wiki-query` skill for relevant patterns, lessons, past decisions.
* **Continuous refactoring capture.** Agents note refactor opportunities while reading code, log via `refactoring-opportunity-capture` skill.
* **Two-stage review where applicable.** Fresh reviewer with no shared context.
* **Subagent dispatch for specialized work.** Via OpenCode's Task tool.
* **Auto-doc trigger in closeout.** `auto-doc-update` skill checks changed files, updates relevant docs, drafts UserJot post if user-facing.
* **Gap logging.** Missing docs to `knowledge/wiki/documentation-gaps.md`.
* **Workflow recommender in closeout.** `workflow-recommender` skill analyzes recent activity (worklogs, last retro date, aging refactor opportunities, undocumented decisions) and recommends 1-3 next workflows with reasoning. Prevents `/retro`, `/adr`, and `/refactor-spot` from being forgotten.

### Workflow recommender — how it works

The `workflow-recommender` skill, invoked at every workflow's closeout, reads:

* Last `/retro` date from `knowledge/raw/audits/retros/` — if >7 days, recommend `/retro`
* `knowledge/raw/refactoring/*.md` — if any opportunities aged >30 days, recommend review
* Recent 5 `knowledge/raw/build-logs/` — scan for undocumented decisions matching ADR patterns, recommend `/adr` on them
* `knowledge/wiki/documentation-gaps.md` — if gaps are growing, recommend `/document`
* Current workflow context — if just finished `/spec` on feature X, recommend `/plan` on feature X
* Feature branch status via Git MCP — if there's an abandoned branch, suggest finishing or explicitly closing

Outputs a section at the end of workflow artifacts:

```markdown
## What to run next

1. **`/retro`** (high priority): No retrospective in 9 days. Recent builds touched auth and billing — worth reflecting.
2. **`/adr` on "session timeout strategy"** (medium): The build log for feat/auth-session-timeout documents a decision that should be an ADR.
3. **`/spec` on "pilot onboarding flow"** (medium): Related to recent pilot discussions in Nido admin.

Respond: `yes <number>`, `no`, or `later <number>` to queue a followup.
```

"Later" entries queue to `knowledge/raw/followups.md` which `/retro` reviews.

---

## Part 4: The phased plan

### Phase 0 — Foundation and tooling (Days 1–3)

**Goal:** OpenCode installed, configured, all MCPs connected, OpenCode docs ingested, initial scaffold in place.

**Day 1: OpenCode setup and subscription routing**

1. Install OpenCode desktop app and CLI. Verify `opencode` command works. On macOS: `brew install sst/tap/opencode` or install script. On Windows: WSL recommended.
2. Run `opencode` in your Nido+Río repo root. Let it do initial scan.
3. Configure providers via `opencode auth login`:
   * **Anthropic** — verify if Claude Pro subscription OAuth currently works. If blocked, use Claude API key. (Anthropic tightened third-party OAuth in January 2026, so expect to use API key; track monthly cost.)
   * **Google** — API key for Gemini. Verify Google AI Pro benefits work via API key or whether you need separate billing.
   * **OpenRouter** — API key for overflow, fallback, experimentation.
4. Test each provider: `opencode run "say hello"` with different models. Document which works via which path in `knowledge/raw/audits/phase-0-setup.md`.
5. **Decision:** If Claude Pro OAuth is blocked and API cost will be >$60/month, note for month-2 Claude Max reconsideration.

**Day 2: Repo scaffolding, MCP wiring, OpenCode docs ingestion**

1. On branch `chore/migration-scaffold`, create the directory structure from Part 2. **Use OpenCode's singular directory names:** `.opencode/agent/`, `.opencode/command/`, `.opencode/skills/`. Start with empty directories and placeholder READMEs.
2. Run `opencode` and use the `/init` command to generate initial AGENTS.md. OpenCode will scan the repo and produce a starting file. Review, edit to ~60 lines covering: project name, stack, build/test/lint commands, directory conventions, "never do" list, pointer to `docs/dev/architecture/` and `knowledge/wiki/_index.md`. Commit this.
3. Write `OPERATING-MODEL.md` v1 — copy Part 1 of this plan as the starting philosophy.
4. Write `.agents/config.yaml` with current constants: GitHub repo slug, project number, Projects view IDs, Supabase project refs, default branch names. Create `.agents/config.local.yaml.example` as template.
5. Update `.gitignore` per Part 2.
6. Install MCP servers via `opencode mcp add`:
   * **GitHub MCP** (official) — critical, replaces all browser automation
   * **Filesystem MCP** — safe repo file access
   * **Git MCP** — commit history, blame, diff
   * **Supabase MCP** — query dev/staging/prod instances
   * **Context7** (already connected) — up-to-date library docs
7. Verify MCP connectivity: `opencode mcp list` shows all connected.
8. Smoke test each MCP via `opencode run`:
   * "List open GitHub issues in this repo"
   * "Show last 5 commits to `apps/nido/`"
   * "Describe the `users` table in Supabase"
   * "Fetch current OpenCode agents docs from Context7"
9. **Critical smoke test for GitHub MCP Projects v2:** SKIPPED — GitHub does not support user-level Projects (v2) for fine-grained tokens. Requires classic token with `read:project` scope which is not available for fine-grained PATs. **New approach:** spec-doc-as-truth. Planning and roadmap management lives in `docs/specs/`. GitHub issues created via `gh` CLI or GitHub MCP (issues work fine). Consider Linear/Jira for product/roadmap management in future (not blocking migration).
10. **Ingest OpenCode docs into wiki:**
    * Use Context7 to fetch current OpenCode documentation (`opencode run "fetch OpenCode documentation from Context7 including agents, commands, skills, permissions, config"`)
    * Save fetched content to `knowledge/raw/research/opencode-docs/`
    * Manually create initial `knowledge/wiki/tools/opencode.md` with essentials: agent frontmatter fields, primary vs subagent distinction, Task tool for dispatch, permission system, `/init` command, MCP management, command format, skill format with wildcards
    * This becomes your canonical reference so you don't re-discover basics during workflow porting

**Day 3: First workflow port as validation**

1. Port `/explore` to `.opencode/command/explore.md` as validation exercise.
2. OpenCode command format uses YAML frontmatter + markdown template. Reference the docs you just ingested for exact syntax.
3. Translate Antigravity tools:
   * `task_boundary` → simple structured log line (e.g., `echo "=== PHASE X START ===" >> .opencode/session.log`)
   * `list_issues`, `search_issues` → GitHub MCP
   * `write_to_file` → OpenCode's native file write
   * `notify_user` → natural conversation pause with explicit confirmation prompt
4. Reference the `explore` agent (to be built Phase 2) via `agent:` field in command frontmatter
5. Test on throwaway topic. Verify: phases execute, Socratic gate fires, artifacts land in `knowledge/raw/research/`. Fix anything broken before Phase 1.

**Phase 0 output:**

* OpenCode installed, providers configured, MCPs connected
* Repo scaffolded with correct OpenCode directory names
* AGENTS.md v1 (via `/init`), OPERATING-MODEL.md v1, .agents/config.yaml v1
* OpenCode docs ingested to wiki as first concrete use of wiki infrastructure
* `/explore` ported and tested end-to-end
* Phase 0 setup notes in `knowledge/raw/audits/phase-0-setup.md`
* **Move tone-of-voice and design-principles docs:** copy existing files to `docs/dev/tone-of-voice.md` and `docs/dev/design-principles.md` AND copy to `knowledge/raw/research/brand-docs/` so they get ingested into wiki in Phase 5

**Gates before Phase 1:** OpenCode talks to all models. MCPs connected and smoke-tested (GitHub, Filesystem, Git, Supabase, Context7). `/explore` runs end-to-end. OpenCode docs exist in wiki. Planning uses spec-doc-as-truth approach (no GitHub Projects dependency).

---

### Phase 1 — Framework and skill research (Days 4–6)

**Goal:** For each framework (Superpowers, gstack, agency-agents, Karpathy gists), each agent role, each skill category, produce short scoring notes and lock the extraction list. Fast mode.

**Day 4: Framework scoring**

Produce short (≤1 page) scoring notes in `knowledge/raw/audits/framework-reviews/`:

1. **`superpowers-review.md`** — Extract: brainstorm→plan→implement→review→finish methodology as meta-discipline, subagent-per-task dispatch pattern, two-stage review. Skip: full marketplace adoption, specific command names.
2. **`gstack-review.md`** — Extract: `/office-hours` six-question framework (wire into `/spec`), `/learn` compounding-knowledge (wire into `/implement` closeout), `/retro` weekly retrospective (becomes your `/retro`), `/canary` post-deploy monitoring (wire into `/ship`). Skip: Chromium browser daemon, 23-role structure, business personas.
3. **`agency-agents-review.md`** — Extract: 2–4 persona templates filling gaps. Evaluate their security-auditor, product-manager, QA reality-checker. Skip: 144+ personas, "complete AI agency" framing.
4. **`karpathy-llm-wiki-review.md`** — Not optional, it's the `knowledge/` architecture. Confirm five layers, compilation cadence, Obsidian consideration.
5. **`karpathy-autoresearch-review.md`** — Extract three primitives (editable asset, scalar metric, time-boxed cycle). Defer the "overnight iterations" idea to Phase 9.

**Day 5: Agent template research**

For each agent role we'll need, research 2-4 templates from the ecosystem. Sources: Superpowers agents, gstack agents, agency-agents personas, `wshobson/agents`, `awesome-claude-agents`, Claude Code awesome-lists, your existing `backend-specialist.md`.

**Target agent list (14 agents built as of April 2026):**

✅ BUILT (14/17):
1. **`orchestrator`** — dispatches subagents inside multi-phase workflows via Task tool. Lives inside workflows, not a workflow itself. ✅
2. **`product-manager`** — research, definition, clarification, dependency checks ✅ + Build Log
3. **`product-owner`** — prioritization, scoping, Ready-for-Dev gate ✅ + Build Log
4. **`backend-specialist`** — your existing is strong, use as baseline ✅ (existing)
5. **`frontend-specialist`** — React/Next.js/UI specialist ✅ + Build Log
6. **`database-architect`** — schema design, migrations, RLS, query optimization ✅ + Build Log
7. **`security-auditor`** — architecture-level security (auth, secrets, RLS strategy). Does NOT duplicate CodeRabbit. ✅ + Build Log
8. **`qa-engineer`** — test strategy, test writing, QA execution (merges your test-engineer + qa-automation-engineer) ✅ + Build Log
9. **`technical-writer`** — architecture docs, API docs, ADRs, dev docs, EA artifacts. Reads `docs/dev/design-principles.md`. ✅ + Build Log
10. **`content-writer`** — user guides, tutorials, release notes for users, UserJot post drafts. Reads `docs/dev/tone-of-voice.md`. ✅ + Build Log
11. **`devops-engineer`** — CI/CD, GitHub Actions, infra, deploy. **Owns migration safety initially.** ✅ + Build Log
12. **`code-explorer`** — codebase mapping, dependency analysis, impact graphs (merges code-archaeologist + explorer-agent) ✅ + Build Log
13. **`debugger`** — root cause analysis, error investigation. Separate because distinct skill set. ✅ + Build Log
14. **`solution-architect`** — system design, cross-cutting concerns, ADR documentation ✅ + Build Log

⏸ DEFERRED (3):
15. **`strategist`** — Product strategy, roadmap alignment, benefits analysis. Evaluates: "Should we build this?" — Aligns ideas with long-term vision. Deferred to Phase 4+

16. **`enterprise-architect`** — Enterprise architecture, capability mapping, strategic decisions. **PEER** with @strategist, @product-manager, @product-owner. Works closely with strategist for roadmap alignment. Deferred to Phase 4+

❌ REMOVED:
17. **`analyst`** — Scope clarity, competitor research, market/feature analysis. Evaluates: "What exactly are we building?" — REMOVED from scope (April 2026 decision)

**Architecture Governance (Automated)**

The orchestrator invokes architecture review at specific SDLC points:

| Phase | Invoke | Purpose |
|-------|--------|---------|
| Pre-Build | @strategist + @enterprise-architect | Strategic alignment, roadmap fit (DEFERRED) |
| Design | @solution-architect ✅ | Technical design review |
| Pre-Merge | @solution-architect ✅ | Architecture gate check |
| Pre-Release | @enterprise-architect | Final sign-off (DEFERRED) |

- NOT time-bound Architecture Review Board — automated invocation at workflow points
- Peer relationships maintained: database-architect ↔ solution-architect (coordinate)
- Auto-invoke at workflow phases through orchestrator, no manual scheduling needed

**Additional candidates (Phase 4 decision):**
- **`release-engineer`** — Split from devops-engineer if Phase 4 audit reveals migration complexity requiring dedicated role. Otherwise, migration safety stays in devops-engineer with clear section defining responsibilities.

**Day 6 tradeoff decision:** Confirm 13 core agents + evaluate enterprise-architect based on Phase 4 findings.

For each role, scoring note contains: role purpose in pipeline, 2-4 candidate templates with links, strengths and weaknesses, recommended starting template, customizations needed.

**Day 6: Skill research and tradeoff decisions**

Skill categories to research:

* `security-review` — architecture-level security audit heuristics
* `vibe-code-check` — your concept, check for similar patterns in Superpowers or gstack
* `clean-code` / `refactor-detection` — refactor opportunity identification
* `nodejs-best-practices` / `typescript-patterns` — language skills
* `api-patterns` — REST/tRPC/GraphQL design
* `database-design` / `rls-patterns` — Supabase-specific RLS
* `migration-safety` — **NEW, explicit migration gates and checks** (Day 6 critical addition)
* `test-strategy` — QA planning
* `doc-writing` — documentation writing skills, localization
* `lint-and-validate` — quality gates (you already have this)
* `socratic-gate` — enforced clarification pattern
* `wiki-query` — querying wiki for relevant patterns/lessons
* `refactoring-opportunity-capture` — continuous refactoring
* `auto-doc-update` — auto documentation on changes
* `coderabbit-ingest` — reading PR comments from GitHub MCP
* `workflow-recommender` — next-workflow recommendations at closeout
* `tone-of-voice-compliance` — content-writer invokes this for user-facing copy
* `release-notes-draft` — drafts technical + user + UserJot versions
* `mcp-usage` — general patterns for invoking MCP tools effectively
* **Framework/Library skills (Nido+Río stack):**
  * `typescript-patterns` — TypeScript best practices
  * `nextjs-patterns` — Next.js App Router patterns
  * `react-patterns` — React hooks, composition, patterns
  * `tailwind-patterns` — Tailwind CSS 4.x patterns
  * `supabase-patterns` — Supabase SSR, RLS, migrations
  * `mastra-patterns` — Mastra agent, RAG, memory, pg
  * `shadcn-patterns` — shadcn/ui "new-york" style primitives
  * `railway-operational` — Railway deploy, logs, rollback
  * `vercel-operational` — Vercel analytics, deploy
  * `github-operational` — GitHub Actions, branching
  * `docusaurus-patterns` — Docusaurus docs
  * `vitest-playwright-patterns` — Test setup, coverage
  * `zod-validation` — Zod schema patterns
  * `zustand-patterns` — State management
  * `mapbox-turf-patterns` — Mapbox/Turf map integrations
  * `tiptap-patterns` — Rich text editor

Output per category: what the skill does, 2-4 source templates with links, recommendation, customization needs.

**Day 6 afternoon: Tradeoff review with you**

I present framework reviews + agent template selections + skill selections. You decide on:

1. **Agent count final.** My lean: 13 (adds `technical-writer` + `content-writer` split + keeps `orchestrator` as agent).
2. **Meta-skill adoption.** Superpowers brainstorm-before-code across all workflows? My lean: yes.
3. **Persona imports from agency-agents beyond 13 core.** My lean: 0 initially.
4. **Continuous refactoring heuristic.** Capture always; execute in-PR only if ≤10 lines and clearly related. Confirm or adjust.
5. **CodeRabbit integration depth in Phase 6.** Light (just `/ship` reads it) vs Medium (adds compile loop later). My lean: Light in Phase 6, Medium in Phase 9 with other loops.
6. **Release engineer role.** Fold migration safety into `devops-engineer`, or split as dedicated `release-engineer`? My lean: fold into devops-engineer with a clear "migration safety" section in its definition. Split only if Phase 4 audit reveals migration complexity demanding it.

**Output:** `knowledge/raw/audits/extraction-decisions.md` — single source for framework extractions, agent template selections, skill selections, tradeoff decisions. Phase 2 executes against this.

**Phase 1 output:**

* 5 framework review notes
* ~13 agent template review notes
* ~18 skill review notes
* Tradeoff decisions documented
* Locked extraction list

**Gates before Phase 2:** Extraction list signed off. No unresolved tradeoffs.

---

### Phase 2 — Build agents, skills, workflows (Week 2)

**Goal:** 17 agents, ~18 skills, 10 workflows all in `.opencode/`, built from researched templates, customized for Nido+Río.

**NOTE:** Phase 3 (legacy ingestion) moved forward to support full wiki reference during agent builds.

**Source-Finding Methodology (ALL artifacts):**

For each agent, skill, or workflow:
1. **Find original source files:**
   - Search repo (e.g., `.agent/agents/`, `docs-legacy/`)
   - If not found, do web search for framework examples (BMAD, gstack, agency-agents)
2. **Ask MJ for additional links:** Request specific framework sources to include in comparison
3. **Do side-by-side comparison:**
   - Get original source from repo, web search, or MJ
   - Extract best patterns from each source
   - Document what's improved vs lost in comparison
4. **Check wiki for relevant lessons/patterns:**
   - Search `knowledge/wiki/patterns/` for domain-matching files
   - Search `knowledge/wiki/lessons/` for domain-matching files
   - Add references to "Wiki Reference" section in agent
5. **Build hybrid** that improves on old versions

**Day 7–8: Agent building**

For each of 13 roles:

1. **Find original source files:**
   - Search repo for existing agent files (e.g., `.agent/agents/`, `docs-legacy/`)
   - If not found, do web search for framework examples (BMAD, gstack, agency-agents)
   - If web search fails to find, ask MJ for original source
2. **Do side-by-side comparison:**
   - Get original source from repo, web search, or MJ
   - Extract best patterns from each source
   - Document what's improved vs lost in comparison
3. **Build hybrid** that improves on old versions
4. Start with winning template from Day 5
2. Apply  **OpenCode native agent frontmatter** :

```yaml
---
description: Clear description with trigger keywords for when to use
mode: subagent       # or 'primary' for main conversation agents
model: anthropic/claude-sonnet-4-5  # or haiku, gemini, etc — decided per agent
temperature: 0.3
tools:
  read: true
  write: false       # if analysis-only
  edit: false
  bash: true
permission:
  bash:
    "git status": allow
    "git log *": allow
    "rm -rf *": deny
    "*": ask
  edit:
    "apps/**": ask
    "docs/**": allow
  webfetch: deny
---

# Agent name and role

[Rich system prompt body matching your backend-specialist.md density]
```

3. **Model decision per agent** (decided as we build):
   * `orchestrator` — MiniMax Free (coordination, reasoning)
   * `backend-specialist` — MiniMax Free (complex domain)
   * `frontend-specialist` — MiniMax Free (complex domain)
   * `database-architect` — MiniMax Free (domain specific)
   * `product-manager` — ?
   * `product-owner` — ?
   * `security-auditor` — ?
   * `qa-engineer` — ?
   * `technical-writer` — ?
   * `content-writer` — ?
   * `devops-engineer` — ?
   * `code-explorer` — ?
   * `debugger` — ?

I'll bring template recommendations and you pick.

4. **Mode decision per agent:**
   * `orchestrator` — `mode: all` (can be invoked directly or as subagent)
   * Most specialists — `mode: subagent` (invoked by orchestrator or user via @mention)
   * `code-explorer` — `mode: subagent, hidden: true` (internal use mostly)
5. **Tool restrictions per agent:** security-auditor is read-only. content-writer can edit `docs/user/` but not `apps/`. devops-engineer can run bash for deploys but needs explicit permission for destructive commands. Each restriction prevents an entire category of mistake.
6. **Customize for Nido+Río:** stack references, conventions (placeholder until Phase 4 creates them), specific anti-patterns from lessons learned, explicit `knowledge/wiki/` reference for pattern lookup, **CodeRabbit awareness** (security/backend/frontend agents defer line-level to CodeRabbit, handle architecture).
7. **Wiki check (ALL agents):** Query wiki before implementation. Reference `knowledge/wiki/` in work output. Add wiki reference section to each agent definition.
8. Fill required fields, add at least one invocation example.

### Build Log Methodology (ALL agents)

Each agent checks for existing build log before starting work:
- Check `knowledge/raw/build-logs/{issue-number}_*.md`
- If no log exists and unsure — Ask user "Should I create a build log?"
- Update log with progress + artifacts
- Comment on GitHub issue with progress

This will be coordinated by the **orchestrator** agent.

### Agent Reference Pattern (NEW)

When agents reference other agents (e.g., "invoke @security-auditor"), use **deferred invocation**, not immediate execution:

```
Agent reference in agent definition:
  "## Security Considerations → invoke @security-auditor"
  
This means:
  - "This work requires security review" 
  - NOT "Invoke security-auditor NOW"
  - Defer to orchestrator for timing
```

**Why Deferred:**
- Orchestrator controls workflow phases: build → verify → audit → ship
- QA should run AFTER implementation is complete
- Single responsibility: each agent does one thing well

**How to Reference:**
- Advisory sections ("Security Considerations", "QA Verification") → notes what verification is needed
- Build log → captures action items for orchestrator
- Orchestrator → schedules verification at correct phase

Example:
```
@backend-specialist builds feature
  → Creates build log: "QA verification needed, Security review needed"
  → Passes to @orchestrator for next phase
@orchestrator schedules:
  → Phase 2: @qa-engineer verifies
  → Phase 3: @security-auditor audits
```

---

### Cross-Agent Impact Check (NEW — Agent Research)

When researching or building any agent, skill, or command, **always check existing agents for relevance:**

1. **For security-auditor**: Does this affect backend-specialist, database-architect, frontend-specialist?
2. **For backend changes**: Does this require security-auditor review? Database schema changes?
3. **For frontend changes**: Does this introduce XSS vectors, authentication changes?
4. **For new patterns**: Do existing agents need to reference this?

**Update existing agents** when new agents are built:
- Add cross-references to related agents
- Document when to invoke each other
- Note security implications for dependent agents

Example: When security-auditor is built, update:
- `@backend-specialist` → security concerns → invoke security-auditor
- `@database-architect` → RLS audits → invoke security-auditor
- `@frontend-specialist` → XSS prevention → invoke security-auditor

**Day 9: Skill building**

For each of ~18 skills, use OpenCode SKILL.md format. Research showed OpenCode reads skills from `.opencode/skills/<name>/SKILL.md` with YAML frontmatter and markdown body. Wildcards supported in skill names.

```yaml
---
name: socratic-gate
description: Enforces structural clarification before an agent proceeds with substantial work. Use this when starting any workflow phase that will write artifacts or make changes.
---

# Socratic Gate skill body here
```

**Skill source-finding (same methodology as agents):**
- Search repo for existing skill files
- If not found, do web search for framework skill examples
- If web search fails, ask MJ for original source
- Build hybrid that improves on old versions

Start each skill from winning template from Day 6. Customize for Nido+Río.

**New skills to build from scratch (no good template):**

* `socratic-gate` — structural clarification enforcement
* `wiki-query` — how to query wiki, what to look for, how to cite in worklog
* `refactoring-opportunity-capture` — heuristics + file format for `knowledge/raw/refactoring/YYYY-MM-DD_*.md`
* `auto-doc-update` — detects changed files, drafts doc updates, also drafts UserJot post if user-facing
* `coderabbit-ingest` — reads PR comments from GitHub MCP, extracts patterns
* `workflow-recommender` — next-workflow recommendation at closeout
* `migration-safety` — pre-flight migration checks, rollback plan, gates for dev→prod
* `release-notes-draft` — produces technical + user + UserJot variants from one release

**Day 10–11: Workflow building**

**Workflow source-finding (same methodology as agents):**
- Search repo for existing workflow definitions
- If not found, do web search for framework command examples
- If web search fails, ask MJ for original source
- Build hybrid that improves on old versions

Build 10 workflows in `.opencode/command/` (OpenCode uses singular `command/`). Start with `/explore` already done in Phase 0, then:

1. `/spec` (largest, most of Day 10)
2. `/plan`
3. `/implement` (second largest, wire continuous refactoring + auto-doc + migration safety)
4. `/ship` (wire CodeRabbit ingestion, release notes, migration verification)
5. `/audit` (needed Phase 4)
6. `/retro`
7. `/document`
8. `/adr`
9. `/refactor-spot`

OpenCode command format (researched):

```markdown
---
description: Spec-driven definition for a new feature
agent: product-manager
# subtask: true  # force subagent invocation for isolation
# model: override  # optional model override per command
---

$ARGUMENTS

## Phase 0: Socratic Gate
[instructions referencing socratic-gate skill]

## Phase 1: Context gathering
[instructions invoking wiki-query, code-explorer subagent]

...
```

For each workflow:

1. Design phase structure: Socratic gate → context (wiki query) → core work → review → closeout → workflow recommender
2. Reference agents by name (`@agent-name` or `agent:` field)
3. Reference skills by name
4. GitHub MCP calls for all GitHub Projects operations — **no browser automation anywhere**
5. Wire continuous refactoring capture where relevant
6. Wire auto-doc trigger in closeout (for `/implement` and `/ship`)
7. Wire wiki query in context phases
8. Wire migration safety in `/implement` (if touches `supabase/migrations/`) and `/ship` (always)
9. Wire workflow recommender in every workflow's closeout
10. Define artifact paths explicitly

**Day 12: Coherence test**

Dry-run each workflow on trivial task in throwaway branch:

* Phases execute in order
* Socratic gates fire
* Agent references resolve (no orphans)
* Skill references resolve
* GitHub MCP operations succeed
* Artifacts land correctly
* Workflow recommender fires at closeout
* Migration safety gates fire when relevant

Fix breaks. Document unresolvable issues in `knowledge/raw/audits/phase-2-issues.md`.

**Phase 2 output:**

* 17 agents in `.opencode/agent/` with model decisions per agent
* ~18 skills in `.opencode/skills/`
* 10 workflows in `.opencode/command/`
* All coherence-tested

**Gates before Phase 3:** Every workflow runs end-to-end without error. No orphan references.

**Phase 3 gates - COMPLETED:** ✅ (April 10, 2026)

---

### Phase 3 — Historical artifact ingestion (Week 3, Days 1–2)

**Goal:** Historical docs and knowledge artifacts live in `knowledge/raw/`. **Code is NOT moved.**

**Day 14: File copies**

Copy (not move — preserve originals until Phase 5 confirms wiki) to `knowledge/raw/`:

1. `docs-legacy/07-product/04_logs/*` → `knowledge/raw/build-logs/`
2. `docs-legacy/07-product/03_prds/*` → `knowledge/raw/prds-archive/`
3. `docs-legacy/07-product/02_requirements/*` → `knowledge/raw/requirements-archive/`
4. `docs-legacy/07-product/01_idea/*` → `knowledge/raw/ideas-archive/`
5. `docs-legacy/07-product/06_patterns/nido_patterns.md` and `lessons_learned.md` → `knowledge/raw/patterns-archive/`
6. `Architecture.md` → `knowledge/raw/architecture-archive/original.md`
7. Scattered md files (tech debt, observations, review standards) → `knowledge/raw/observations-archive/`
8. Brand/design docs already copied in Phase 0 to `knowledge/raw/research/brand-docs/`

**Day 15: Metadata and inventory**

1. Add frontmatter to imported files:

```yaml
---
source: build-log | prd | requirement | pattern | lesson | observation | brand
imported_date: 2026-04-06
original_path: docs-legacy/07-product/04_logs/log_2025-11-15_example.md
---
```

2. Create `knowledge/raw/_manifest.md` — inventory of what was imported.
3. **Do NOT compile wiki yet.** Raw first.

**Wiki folder principles (for Phase 5 reference):**

When compiling in Phase 5, evaluate each piece of content by **information type**, not source folder:

| Wiki Folder | Content Type |
|-------------|-------------|
| `lessons/` | Technical learnings, debugging discoveries, post-incident analysis |
| `patterns/` | Reusable code patterns, database conventions, framework usage |
| `concepts/` | Domain entities, feature requirements, architecture decisions |
| `domains/engineering/` | Technology stack choices, build configuration rationale |
| `domains/product/` | Feature categories, sprint mapping, roadmap |
| `design/` | Brand system (colors, typography, tone) |
| `tools/` | Tool configurations, MCP patterns |

Key: A build log may contain lessons (→ `lessons/`) AND concepts (→ `concepts/`). Evaluate content, not source folder.

**Phase 3 output:**

* Historical knowledge filed in `knowledge/raw/`
* `_manifest.md` inventory
* Code untouched

**Gates before Phase 4:** Raw ingestion complete.

---

### Phase 4 — Codebase audit via hierarchical reading (Week 3, Days 3–5)

**Goal:** Systematic audit producing reports about the code. Code never copied. Architecture docs, EA artifacts, refactoring opportunities, documentation gaps, **migration playbook** all captured.

**Important mechanics:**

* Agents use Filesystem MCP and Git MCP to **read code in place** from `apps/` and `packages/`
* Agents produce **markdown reports about code** to `knowledge/raw/audits/`
* Code never copied, duplicated, or moved
* Reports reference code by file path

**Day 16 morning: Pass 1 — Top-level orientation**

Run `/audit --top-level`. One agent reads:

* Root `README.md`, `package.json`, `turbo.json` or `pnpm-workspace.yaml`
* Top-level directory tree (2 levels)
* Root config files (tsconfig, biome/eslint, env examples)
* Existing docs inventory

Output: `knowledge/raw/audits/01-top-level.md`.

**Day 16 afternoon: Pass 2 — Per-module audits**

From Pass 1, identify significant modules. Expected 8-15 for Nido+Río. If 30+, group by domain.

Dispatch per-module agents via OpenCode Task tool (scoped context each). Output per module: `knowledge/raw/audits/02-module-<n>.md` — purpose, key files, dependencies, patterns in use, obvious issues, refactor candidates, architecture security concerns, system fit.

**Day 17: Pass 3 — Cross-cutting concerns**

Six scoped dispatches, each producing `knowledge/raw/audits/03-cross-<concern>.md`:

1. **Auth and authorization** — users and Río auth, RLS patterns, JWT, sessions
2. **Data flow and state** — Nido↔Río↔Supabase, client state, server state, Mastra memory, RAG
3. **Secrets and environment** — env vars per environment, exposure, rotation
4. **Observability** — logging, error tracking, metrics, blind spots
5. **Testing** — setup, coverage philosophy, reliable vs flaky
6. **Build and deploy and migrations** — **THIS IS WHERE DEV→PROD MIGRATION SAFETY IS AUDITED.** Current pipeline, deploy targets, branch strategy, prod vs dev, **how migrations currently get from dev to prod, what's missing, what could go wrong, what rollback looks like today**

**Day 18: Pass 4 — Synthesis and EA artifacts**

One final agent reads all Pass 1-3 reports and produces:

1. **`knowledge/raw/audits/04-synthesis.md`** — top findings, themes, 10 most important fixes, proposed repo restructure, prioritized refactor list, tech debt register, gap analysis current vs needed setup
2. **`docs/dev/architecture/overview.md`** — solution architecture document
3. **`docs/dev/ea/applications.md`** — application/tech list: Nido, Río, Mastra, Supabase, Railway, GitHub, Vercel, Docusaurus, OpenCode, SaaS services, significant libraries. Table: name, category, purpose, lifecycle, owner, notes.
4. **`docs/dev/ea/capabilities.md`** — technical capability model mapping apps/services to capabilities
5. **`docs/dev/ea/databases.md`** — database inventory: Supabase instances, other DBs, purposes, backup
6. **`docs/dev/ea/infrastructure.md`** — infrastructure inventory: Railway services, Vercel, GitHub Actions, domains, CDN, email
7. **`docs/dev/migration-playbook.md`** — **dev→prod migration playbook.** Full documented flow: how migrations are created in dev, tested in staging, applied to prod, verified, rolled back if needed. This becomes the canonical reference for `migration-safety` skill and `devops-engineer` agent.
8. **`knowledge/raw/refactoring/`** — backlog items from audit findings (standalone MD files with frontmatter)
9. **`knowledge/wiki/documentation-gaps.md`** — initial from audit findings

**Phase 4 output:**

* Full repo audit in `knowledge/raw/audits/` (reports only, no code copies)
* Solution architecture document
* EA artifacts (applications, capabilities, databases, infrastructure)
* **Migration playbook**
* **Agent count decision:**
  * If migration complexity warrants → add `release-engineer` as dedicated role
  * If architecture audit reveals need → add `enterprise-architect` agent (distinct from system/solution architect)
  * Otherwise: keep at 17 agents, migration safety in devops-engineer
* Refactoring opportunities and documentation gaps populated
* **Wiki execution verification:** All wiki entries from Phase 3/5 verified against actual code. Each entry receives:
  * `status: implemented | planned | deprecated | superseded`
  * `verified_in_codebase: true`
  * `code_references:` (list of file paths)
  * `execution_date:` (from build log or PR merged)

**Gates before Phase 5:** Synthesis exists. Top findings reviewed. EA artifacts drafted. Migration playbook exists. Wiki execution verification complete.

---

### Phase 5 — Wiki compilation and first lint (Week 4, Days 1–2)

**Goal:** LLM Wiki exists as compiled, navigable knowledge layer.

**Day 19: First compile**

Run wiki compile interactively against `knowledge/raw/`. Process:

1. Read every file in `raw/` with frontmatter
2. **For each piece of content, determine its type:**
   - Technical learning / debugging insight → `lessons/`
   - Code pattern / schema convention → `patterns/`
   - Domain entity / feature requirement → `concepts/`
   - Technology choice → `domains/engineering/`
   - Feature category → `domains/product/`
   - Brand element → `design/`
   - Tool pattern → `tools/`
3. Write compiled content to appropriate folders based on content type
4. One source file may produce outputs in multiple folders
5. Write `knowledge/wiki/_index.md` as TOC with backlinks

**Key principle:** Evaluate content, not source folder mapping. A build log may contain both lessons (debugging patterns) AND concepts (feature requirements).

**Wiki entry metadata:** Each compiled wiki entry MUST include execution verification:

```yaml
---
title: [Title]
status: implemented | planned | deprecated | superseded
verified_in_codebase: true | false
code_references:  # Paths to actual code (Phase 4 verification)
  - app/api/v1/ai/chat/route.ts
execution_date: YYYY-MM-DD  # From build log or PR merged
---
```

- **From build logs** → Mark `implemented`, add `execution_date` from log date
- **From PRDs** → Mark `implemented` if issue is closed, code exists
- **From requirements** → Mark `planned` or `implemented` based on Phase 4 verification
- **From ideas** → Mark `planned` initially, update after Phase 4 verifies execution

Expect several hours wall-clock and a few dollars of tokens.

**Day 20: First lint and review**

1. Run wiki lint: find inconsistencies, missing concepts, propose merges, stale references
2. Manual review. Navigate `_index.md`, concepts, verify
3. Test queries: "What patterns do we use for Supabase RLS?" "What have we learned about Mastra debugging?" "What's our tone of voice for user error messages?" Verify grounded answers with references
4. Fix obvious compilation errors manually
5. **Obsidian decision:** install if wiki navigation is painful. Otherwise defer

**Phase 5 output:**

* Compiled wiki in `knowledge/wiki/`
* First lint done
* Brand docs compiled into wiki (so agents can reference them)
* Three test queries answered correctly
* Obsidian decision

**Gates before Phase 6:** Wiki answers test queries with references.

---

### Phase 6 — Core loops and GitHub Actions (Week 4, Days 3–5)

**Goal:** Documentation stays current automatically on merges and PRs. Migrations apply safely to prod. CI gates every PR. **No auto-research loops yet** — those are Phase 9+.

**Day 21: Compile scripts**

Two scripts in `scripts/compile/`:

1. **`wiki-compile.ts`** — reads new entries in `knowledge/raw/build-logs/` since last run, appends to `knowledge/wiki/lessons/`, updates patterns if new ones emerged. Plain TypeScript, invokes `opencode run` as subprocess with a prompt file. **No Mastra.**
2. **`docs-drift-check.ts`** — diffs PR's changed files against `docs/dev/` and wiki, identifies stale sections, comments on PR with suggested updates.

Both scripts ~100-200 lines of TypeScript. Simple, observable, killable.

**Day 22: GitHub Actions + config files**

Create five workflows in `.github/workflows/` and two config files:

1. **`pr-quality-gate.yml`** — trigger: pull_request. Runs lint → type-check → test → build. Standard CI gate. Addresses audit finding **C3** (zero CI/CD pipeline).
2. **`post-merge-compile.yml`** — trigger: push to `main`. Runs `wiki-compile.ts` to fold just-merged worklogs into wiki. Commits wiki updates via bot account to main, or opens PR if you prefer review.
3. **`doc-drift-check.yml`** — trigger: pull_request. Runs `docs-drift-check.ts` scoped to PR's changed files. Comments on PR if drift detected.
4. **`migration-apply.yml`** — trigger: push to `main` AND has changes in `supabase/migrations/`. Runs the migration playbook from `docs/dev/migration-playbook.md`:
   * Detect new migrations
   * Run against staging first
   * Smoke test staging
   * Apply to prod
   * Verify prod
   * Rollback capability via reverse migration if verification fails
   * Post success/failure summary as commit comment
   * Integrates with Supabase MCP for execution
5. **`stale-branch-cleanup.yml`** — trigger: schedule (weekly). Identifies branches older than 30 days with no activity, opens issues flagging them for cleanup. Keeps repo tidy during Phase 8 organic restructure.

Plus two non-workflow files:

6. **`.github/dependabot.yml`** — automated dependency scanning for npm + GitHub Actions ecosystems. Addresses audit finding **H3** (11 packages on `latest`, no scanning).
7. **`.github/PULL_REQUEST_TEMPLATE.md`** — structured PR descriptions with sections: description, testing instructions, migration notes, security considerations. Addresses audit finding **M6**.

**CodeRabbit CLI note:** Not included in CI/CD. CodeRabbit GitHub App already reviews every PR automatically. CLI is for local pre-commit use only. Consider adding as local pre-commit hook or optional `/implement` step in Phase 7+.

**Day 23: First real test**

1. Merge migration scaffolding branch to main
2. Verify `post-merge-compile.yml` fires (even though there are no worklogs yet, just confirms workflow runs)
3. Create test PR with a doc change, verify `doc-drift-check.yml` comments appropriately
4. Create test PR with a trivial migration (add index), verify `migration-apply.yml` runs correctly through staging→prod flow
5. Verify `pr-quality-gate.yml` runs on the test PR
6. Verify `stale-branch-cleanup.yml` runs on schedule (or trigger manually)
7. Verify Dependabot picks up at least one outdated dependency
5. Verify `pr-quality-gate.yml` runs on the test PR
6. Verify `stale-branch-cleanup.yml` runs on schedule (or trigger manually)
7. Verify Dependabot picks up at least one outdated dependency

**Phase 6 output:**

* 2 compile scripts in `scripts/compile/` (plain TS, no Mastra)
* 5 GitHub Actions workflows
* 2 config files (dependabot.yml, PR template)
* Post-merge compile runs on every merge
* Doc drift check runs on every PR
* Migration apply runs on every migration merge
* Quality gate runs on every PR
* Dependabot scans for outdated dependencies
* Stale branch cleanup runs weekly

**Gates before Phase 7:** All 5 actions run successfully on test PRs. Dependabot configured. PR template in place.

---

### Phase 7 — Real feature integration test (Week 5)

**Goal:** Ship one real feature through the full pipeline. Find sharp edges. Tune.

**Day 24–28:**

1. Pick one real backlog feature, scoped to one week. Ideally touches Nido and Río both.
2. Run `/explore` on it. Verify context gathering and Socratic gate.
3. Run `/spec` on it. Verify phases, wiki query, continuous refactoring capture, artifact growth.
4. Run `/plan` on it. Verify GitHub MCP for all Projects operations. Zero browser automation.
5. Run `/implement` on it. Verify worklog captures decisions, refactoring opportunities logged, Socratic gate fires, Draft PR created, migration safety gate (if migrations involved).
6. Run `/ship` on it. Verify CodeRabbit ingestion, migration verification, release notes drafted (technical + user + UserJot draft to `knowledge/raw/userjot-drafts/`), auto-doc finalization.
7. After merge: verify `post-merge-compile.yml` folds worklog into wiki. Verify `migration-apply.yml` applies migrations if any. Verify `doc-drift-check.yml` caught any drift.
8. Workflow recommender at each closeout: verify it recommends sensible next steps.
9. Document every sharp edge in `knowledge/raw/audits/phase-7-issues.md`. Fix as you go.
10. **Manually publish the UserJot draft** to verify the integration flow works even if not automated.

**Phase 7 output:**

* One real feature shipped through new pipeline
* Issues log with fixes applied
* UserJot post live
* Confidence pipeline works for real work

**Gates before Phase 8:** End-to-end complete. No showstoppers.

---

### Phase 8 — Collaborator onboarding, repo restructure, Cabinet decision (Week 6+)

**Goal:** Setup ready for collaborators. Repo restructure begins organically. Cabinet reevaluated.

**Day 29:**

1. Write `docs/dev/collaborator-onboarding.md` — how to plug any harness (OpenCode, Claude Code, Cursor, Aider, Cline) into AGENTS.md + `.agents/config.yaml`. Per-harness setup, how to read workflows, how the wiki works, what not to touch manually.
2. Write `docs/dev/how-we-work.md` — narrative version of OPERATING-MODEL.md for new collaborators. Why this setup, what's weird, how to contribute without breaking auto-compilation.

**Day 30 onward:**

1. **Repo restructure begins organically.** Phase 4 synthesis proposed target. No big-bang. Every PR touching a file in wrong place moves it as part of PR.
2. **Cabinet checkpoint at ~4 weeks after migration complete.** OpenCode compat landed? `docs/ops/` + skills sufficient? Pilot if yes, stay if no.
3. **Weekly `/retro` running.** Reviews backlog, refactor opportunities, knowledge health.

**Phase 8 output:**

* Collaborator onboarding documented
* Repo restructure underway
* Cabinet decision with real data

**Ongoing:** Weekly `/retro`. Monthly review of "what's working, what isn't."

---

### Phase 9+ — Auto-research loops (post-migration, weeks 8+)

**DEFERRED FROM PHASE 6.** Only introduce after core pipeline has shipped 2-3 real features and you have capacity.

**Introduction order (one at a time, each with success criteria before adding the next):**

1. **`wiki-lint-loop.ts`** — lowest blast radius, only proposes changes. Nightly. Success: produces useful merge and consistency suggestions without noise.
2. **`coderabbit-compile-loop.ts`** — reads merged PR CodeRabbit comments, folds into wiki patterns. Nightly. Success: wiki patterns grow meaningfully from CodeRabbit findings.
3. **`docs-drift-loop.ts`** (full scan, not just PR-scoped) — nightly sweep of stale docs. Success: identifies real drift, doesn't create spurious work.
4. **`morning-report.ts`** — summarizes overnight activity across loops. Useful once ≥2 loops exist.
5. **`refactor-loop.ts`** — LAST because highest complexity and risk. Nightly, isolated branches, CodeRabbit-reviewed draft PRs, skips files you worked on that day. Success: produces at least one good refactor per week without bad PRs.

**Each loop needs success criteria documented before introduction.** If a loop doesn't earn its runtime after 2 weeks, kill it.

**Domain expansion (Phase 10+):** once dev loops work, extend pattern to ops/sales/marketing as those domains become active:

* Cold outreach variant generator (sales)
* Content idea generator (marketing)
* Investor update draft generator
* Pilot community health monitor (ops)

Same infrastructure: script in `scripts/loops/`, GitHub Action cron, outputs to `knowledge/raw/experiments/`, morning report.

---

## Part 5: Continuous refactoring, baked in

Principle, not a phase. At every workflow phase, agents watch for refactor opportunities.

**Capture locations:**

* `/explore` — while reading code for context, note opportunities
* `/spec` enrichment — security findings out of scope become labeled refactor opportunities
* `/implement` Phase 0 pattern reference — compare patterns to code about to be touched
* `/implement` Phase 2 build — assess in-scope refactor viability
* `/ship` audit — findings that don't block release get logged

**Execute-vs-log rules:**

* **Execute in current PR if:** ≤10 lines AND clearly related AND files already being changed AND existing test coverage
* **Log otherwise**

**Weekly `/retro` review:**

* Capture count this week
* Execution count this week
* Themes (5 opportunities all saying "extract X" = a real task)
* Items >30 days: escalate or explicitly defer

Once Phase 9's `refactor-loop.ts` exists, it picks up small logged opportunities nightly on isolated branches.

---

## Part 6: CodeRabbit integration

You already use CodeRabbit for PR review. Don't duplicate its job.

**CodeRabbit handles:** line-level review, linting/style, common bug patterns, line-level security (injection, XSS), line-level test coverage gaps

**Your agents handle:** architecture security (auth, RLS strategy, secrets), pattern compliance against your wiki, business logic against requirements, SDLC phase integration, wiki compilation, continuous refactoring strategy, doc updates

**Integration points:**

1. **`/ship` Phase 0** — reads CodeRabbit PR comments via GitHub MCP (your current behavior preserved)
2. **Phase 9+ `coderabbit-compile-loop.ts`** — deferred with other loops. Reads merged PR comments, extracts patterns, files to `knowledge/raw/coderabbit/`, compile loop folds to wiki.
3. **Agent awareness** — security-auditor, backend-specialist, frontend-specialist, database-architect all have explicit "defer line-level review to CodeRabbit; focus on architecture-level" instructions.

**No CodeRabbit MCP** — GitHub MCP reads PR comments.

---

## Part 7: Dev→prod migration safety

**First-class concern throughout the plan.** Migrations are one of the highest-risk operations in any SaaS; the current setup doesn't have strong enforcement, and we fix that in this migration.

**The full stack:**

1. **`migration-safety` skill** (Phase 2, Day 9) — pre-flight checks, rollback plan generation, gates for dev→prod. Invoked by `/implement` when touching `supabase/migrations/`, always invoked in `/ship`.
2. **`devops-engineer` agent** (Phase 2, Day 7-8) — owns migration safety. Explicit section in agent definition about migration lifecycle, staging verification, prod application, rollback.
3. **`docs/dev/migration-playbook.md`** (Phase 4, Day 18) — canonical reference. Full flow: create in dev, test in staging, apply to prod, verify, rollback.
4. **`migration-apply.yml` GitHub Action** (Phase 6, Day 22) — automated application with staging-first, prod-second, verification, rollback capability. Integrates with Supabase MCP for execution. Posts summary as commit comment.
5. **`/implement` migration safety gate** — if PR touches migrations, pre-merge check: staging applied cleanly, staging smoke tests pass, rollback script exists.
6. **`/ship` migration verification** — post-merge but pre-deploy, verify migrations applied successfully before considering ship complete.
7. **`knowledge/wiki/tools/supabase-nido.md`** — RLS patterns, migration conventions, common gotchas, all compiled from build logs and audit findings.

**What this prevents:**

* Merging a migration that hasn't been tested in staging
* Deploying code that depends on unapplied migrations
* Losing prod data on failed migrations (rollback exists)
* Undocumented schema changes (audit + wiki catch them)

**What this doesn't solve:**

* Schema migrations that require data transformations beyond reversible operations — these still need manual oversight, the playbook flags them for human review

---

## Part 8: Release notes and UserJot integration

**`/ship` closeout produces three outputs from one release:**

1. **Technical release note** → `knowledge/raw/build-logs/` as part of the build log (compiled to wiki)
2. **User-facing release note** → `docs/user/releases/YYYY-MM-DD-<feature>.md` (rendered by Docusaurus)
3. **UserJot post draft** → `knowledge/raw/userjot-drafts/YYYY-MM-DD-<feature>.md` (you publish manually)

**`content-writer` agent generates user-facing versions** using `docs/dev/tone-of-voice.md` and wiki brand concepts. **`technical-writer` agent generates the technical log.**

**`release-notes-draft` skill** produces all three variants from one release context.

**UserJot integration is Option B (manual):** drafts filed to `knowledge/raw/userjot-drafts/`, you review and post manually. Revisit for automation after migration complete, if UserJot has a usable API. Risk of automated user-facing posts is too high to do during migration.

**`/document --user`** workflow generates non-release announcements through the same content-writer + tone-of-voice path.

**Localization:** `content-writer` agent reads tone-of-voice doc which includes Spanish/English bilingual requirements. Any user-facing content gets drafted in both languages.

---

## Part 9: Karpathy alignment

### LLM Wiki mapping

| Karpathy's layer         | Your implementation                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Raw sources              | `knowledge/raw/`— build logs, PRDs, audits (reports about code), research, CodeRabbit findings, UserJot drafts |
| Compiled wiki            | `knowledge/wiki/concepts/`,`patterns/`,`lessons/`,`tools/`,`domains/`                                   |
| Index and summaries      | `knowledge/wiki/_index.md`, auto-maintained                                                                     |
| Query outputs filed back | `knowledge/outputs/`staging, periodic filing                                                                    |
| Health / linting         | Phase 9+`wiki-lint-loop.ts`                                                                                     |
| Obsidian frontend        | Optional, Phase 5 decision                                                                                        |

**Key discipline:** resist manually editing wiki. To add a concept, file source to `raw/`. To correct, fix underlying source. Wiki is output.

### Auto-research mapping

Tens of iterations per loop per night (not hundreds), because software improvements are discrete and verifiable. Primitives transfer from Karpathy's research context:

| Karpathy         | You                                                        |
| ---------------- | ---------------------------------------------------------- |
| Editable asset   | Code, wiki, docs, refactoring backlog                      |
| Scalar metric    | Test pass rate + complexity + doc drift + wiki consistency |
| Time-boxed cycle | Read → attempt → measure → commit or rollback           |

**Not until Phase 9+.** Core pipeline first.

**Scaling to other domains later:** sales (cold outreach variants), marketing (content ideas), ops (pilot community monitoring), investor updates (weekly drafts). Same infrastructure. Build once for code, extend per domain.

---

## Part 10: MCP tools

**Phase 0 essentials:**

* **GitHub MCP** (official) — issues, PRs, Actions, commits. Projects v2 unavailable (fine-grained PAT limitation). Use `gh` CLI for project operations if needed.
* **Filesystem MCP** — safe repo file access
* **Git MCP** — commit history, blame, diff
* **Supabase MCP** — query instances, execute migrations (used by `migration-apply.yml`)
* **Context7** (already connected) — up-to-date framework docs for fast-moving tools

**Phase 2-3 consideration:**

* **Postgres MCP** — fallback if Supabase MCP is too narrow

**Phase 8+ ops expansion:**

* **Notion MCP** — migration only, port Notion content to `docs/ops/`, turn off after
* **Gmail MCP** — already connected, for ops agents drafting investor updates, scheduling
* **Calendar MCP** — already connected, same use
* **Slack MCP** — only if you actually use Slack for Nido

**Skip:**

* Browser automation MCPs — whole point is not to need them
* CrewAI/LangGraph MCPs — overkill, OpenCode handles dev agents
* CodeRabbit MCP — GitHub MCP reads PR comments including CodeRabbit
* Heavy observability MCPs — premature

---

## Part 11: Risks and mitigations

**Risk: OpenCode bugs blocking daily use.** Keep Antigravity as fallback through Phase 7. Don't uninstall until Phase 7 completes.

**Risk: Claude Pro via OpenCode blocked (OAuth tightening still active).** Use OpenRouter fallback with ~5.5% markup. Track monthly cost. If >$60/month sustained, add Claude Max for heavy coding as secondary harness.

**Risk: Phase 4 produces shallow analysis.** Hierarchical passes with scoped context each. If synthesis is bad, rerun with better prompts; don't redo module passes.

**Risk: Wiki compilation incoherent on first pass.** Expected. Manual review Phase 5 catches structural issues. Quality improves via lint over weeks.

**Risk: Migration consumes all time, no feature work ships.** Phase 7 is a real feature. Timeline assumes 2-3 hours/day. If less, double durations. Don't compress; gates exist for a reason.

**Risk: Collaborators join before Phase 7.** Onboarding doc explicit about Phase 7 "ready" mark. Earlier joiners get scoped sandbox.

**Risk: Refactoring opportunities accumulate without execution.** Weekly `/retro` reviews. Items >30 days escalated or deferred.

**Risk: `migration-apply.yml` fails or corrupts prod data.** Staging-first flow catches most issues. Rollback capability from playbook. Manual fallback documented. Worst-case: restore from Supabase backup (acceptable given RPO).

**Risk: Deferred auto-research loops never get introduced because "too busy with features."** That's actually fine. They're a nice-to-have. Core pipeline shipping features is the goal. Introduce loops when genuinely useful, not on a schedule.

**Risk: `knowledge/` grows huge and repo size becomes issue.** `.gitignore` archives experiments. If wiki passes ~100MB, split to submodule. Designed-in reversibility.

**Risk: Workflow recommender produces spammy recommendations.** Tune heuristics, lower priority scoring, add mute-by-category. Weekly `/retro` reviews recommender effectiveness.

---

## Part 12: Execution checklist

**Phase 0 — Foundation (Days 1-3)**

* [x] OpenCode installed (desktop + CLI)
* [x] Providers configured (Google AI, OpenRouter; Claude via OpenRouter fallback)
* [x] Branch `chore/migration-scaffold` created
* [x] `docs/` → `docs-legacy/` renamed (clean start, legacy preserved locally)
* [x] `.gitignore` updated
* [x] Directory structure scaffolded (`.opencode/`, `docs/`, `knowledge/`, `.agents/`, `scripts/`)
* [x] AGENTS.md v1 via `/init` + augmented
* [x] OPERATING-MODEL.md v1
* [x] `.agents/config.yaml` v1 + example
* [x] MCPs installed and smoke-tested (GitHub, Filesystem, Git, Supabase, Context7)
* [x] Brand docs copied to `docs/dev/` + `knowledge/raw/research/brand-docs/`
* [x] GitHub MCP Projects v2 capabilities verified — **BLOCKED** (fine-grained PAT limitation). Pivoted to spec-doc-as-truth approach.
* [x] OpenCode docs ingested to `knowledge/raw/research/opencode-docs/` and `knowledge/wiki/tools/opencode.md`
* [x] `/explore` ported and tested

**Phase 1 — Framework and skill research (Days 4-6)**

* [x] 5 framework review notes (10 frameworks researched)
* [x] 13 agent template review notes
* [x] ~19 skill category review notes + 16 framework skills
* [x] Tradeoff discussion complete (MJ confirmed 6 decisions)
* [x] Final agent count confirmed (13)
* [x] Extraction list locked (`knowledge/raw/audits/extraction-decisions.md`)
* [x] Patterns + lessons compiled early to wiki (`knowledge/wiki/patterns/`, `knowledge/wiki/lessons/`)
* [x] Design system compiled to wiki (`knowledge/wiki/design/`)
* [x] Phase 3 legacy ingestion complete — 156 files to `knowledge/raw/`

**Phase 2: Build agents, skills, workflows — COMPLETE ✅**

* [x] 10 agents built: orchestrator, backend-specialist, frontend-specialist, database-architect, security-auditor, qa-engineer, devops-engineer, solution-architect, product, investigator
* [x] Build log methodology added to agents
* [x] Wiki references in all agents (updated with raw documentation)
* [x] Checkpoint review in orchestrator
* [x] 25 skills in `.opencode/skills/` (21 custom + 4 ecosystem)
* [x] 10 workflows in `.opencode/command/` (explore, spec, plan, implement, ship, audit, retro, document, adr, refactor-spot)
* [x] All agents use wiki references (patterns, lessons, design)
* [x] All workflows use GitHub MCP (no browser automation)
* [x] Continuous refactoring wired into explore/spec/implement/ship
* [x] Wiki query wired into context phases
* [x] Auto-doc trigger wired into implement/ship closeouts
* [x] Workflow recommender wired into every workflow closeout
* [x] Migration safety wired into `/implement` (conditional) and `/ship` (always)
* [ ] Coherence test (dry-run each workflow on trivial task) — **NEXT STEP**

**Phase 3 — Historical artifact ingestion — COMPLETE ✅**

* [x] Historical docs copied to `knowledge/raw/` with metadata (156 files)
* [x] `_manifest.md` written
* [x] Code untouched
* [x] Legacy docs deleted from working tree (preserved in `docs-legacy/`)

**Phase 4 — Codebase audit — COMPLETE ✅**

* [x] Pass 1 top-level complete (`audit_2026-04-11_full_codebase.md`)
* [x] Pass 2 per-module complete (app, lib, components, packages, supabase, backoffice, dashboard, cron, i18n, env-config, map-and-large-files)
* [x] Pass 3 cross-cutting complete (auth, data-flow, cicd, error-handling, testing-gaps)
* [x] Pass 4 synthesis complete
* [x] Architecture doc written
* [x] EA artifacts drafted
* [x] **Migration playbook written** (`docs/dev/migration-playbook.md`)
* [x] Refactoring opportunities and gaps registers populated
* [x] Wiki execution verification (patterns + lessons verified against codebase)

**Phase 5 — Wiki compilation — COMPLETE ✅**

* [x] First compile complete (concepts, patterns, lessons, tools, domains)
* [x] First lint complete
* [x] Brand docs compiled into wiki
* [x] Manual review confirms wiki reflects reality
* [x] Three test queries answered correctly
* [x] Obsidian decision — deferred (wiki navigation acceptable via file system + wiki-query skill)

**Phase 6 — Core loops and actions (Week 4, Days 3-5)**

* [ ] `wiki-compile.ts` script written (plain TS, no Mastra)
* [ ] `docs-drift-check.ts` script written
* [ ] `pr-quality-gate.yml` created and tested (lint → type-check → test → build)
* [ ] `post-merge-compile.yml` created and tested
* [ ] `doc-drift-check.yml` created and tested
* [ ] `migration-apply.yml` created and tested on trivial migration through staging→prod flow
* [ ] `stale-branch-cleanup.yml` created and tested
* [ ] `.github/dependabot.yml` created (addresses audit H3)
* [ ] `.github/PULL_REQUEST_TEMPLATE.md` created (addresses audit M6)
* [ ] **No auto-research loops** (deferred to Phase 9)
* [ ] **No CodeRabbit CLI in CI** (redundant with GitHub App; consider local pre-commit hook in Phase 7+)
* [ ] **No CodeRabbit CLI in CI** (redundant with GitHub App; consider local pre-commit hook in Phase 7+)

**Phase 7 — Integration test (Week 5)**

* [ ] Real feature selected
* [ ] Full pipeline run (explore → spec → plan → implement → ship)
* [ ] Workflow recommender producing sensible output at each closeout
* [ ] Migration safety gates firing appropriately
* [ ] UserJot draft filed, manually published
* [ ] Issues documented and fixed
* [ ] Feature shipped

**Phase 8 — Collaborators and ongoing (Week 6+)**

* [ ] Collaborator onboarding doc written
* [ ] How-we-work narrative written
* [ ] Repo restructure begins organically
* [ ] Cabinet reevaluation scheduled (week 10)
* [ ] Weekly `/retro` running

**Phase 9+ — Auto-research loops (weeks 8+, as capacity allows)**

* [ ] `wiki-lint-loop.ts` introduced, success criteria met
* [ ] `coderabbit-compile-loop.ts` introduced, success criteria met
* [ ] `docs-drift-loop.ts` (full) introduced, success criteria met
* [ ] `morning-report.ts` introduced
* [ ] `refactor-loop.ts` introduced LAST, success criteria met

---

## Part 13: Open questions to resolve during execution

1. ~~Claude Pro subscription OAuth via OpenCode — works or blocked?~~ Resolved: using OpenRouter as Claude fallback
2. ~~GitHub MCP Projects v2 field support — complete or gaps?~~ Resolved: not available with fine-grained PATs. Spec-doc-as-truth approach adopted. Consider Linear/Jira for roadmap management.
3. ~~Does Anthropic still block third-party OAuth?~~ Resolved: yes, blocked. OpenRouter fallback in use.
4. Final agent count — 13 or different? (Day 6)
5. Model decision per agent — which tier for which role? (Day 7-8, you decide each)
6. Historical content size being ingested? (Day 14)
7. Significant module count in repo? (Day 16)
8. Obsidian as wiki frontend? (Day 20)
9. Migration playbook complexity — does it reveal need for dedicated `release-engineer` agent split? (Day 18)
10. Workflow recommender heuristic tuning — over-recommending or under? (Phase 7 real feature)
11. Whether `migration-apply.yml` handles your actual migrations safely or needs iteration. (Day 23 test)
12. GitHub PAT security — token exposed in conversation history, should be rotated

---

**End of migration plan v3.** First action: Phase 0, Day 1, install OpenCode.
