---
phase: 1
day: 4
status: framework-research-complete
frameworks_reviewed: 10
extraction_decisions_made: true
---

# Framework Research Summary

## Research Completed

Date: April 8, 2026  
Frameworks Reviewed: 10  
Output Location: `knowledge/raw/audits/framework-reviews/`

## Framework Scores

| Framework | Score (5 max) | Priority | Key Extraction |
|-----------|---------------|----------|-----------------|
| Karpathy LLM Wiki | 5.0 | **Core** | Three-layer architecture, operations |
| Antigravity (.agent) | 4.3 | **Primary source** | 21 agents, 36 skills (in our repo!) |
| Superpowers | 4.7 | **Must-have** | 14 skills, subagent pattern, TDD, workflow |
| gstack | 4.0 | High | office-hours, learn, delivery loop |
| Claude Code | 4.0 | Reference | Skills system, MCP, hooks |
| agency-agents | 3.5 | Medium | Persona templates (13 agents) |
| BMAD | 3.5 | Medium | Quick-dev, vibe coding balance |
| Aider | 3.5 | Medium | CLI pair programming, git workflow |
| Vercel AI SDK | 3.5 | Reference | Streaming, tool calling patterns |
| Karpathy Auto-research | 3.0 | Deferred | Research loops (Phase 9+) |

## Top Extraction Targets

### From Superpowers (Priority: Critical)

1. **Brainstorm → Plan → Implement → Review → Finish** → Maps to `/spec`, `/implement`, `/ship`
2. **Subagent-per-task dispatch** → Model for orchestrator agent
3. **Two-stage review (spec + quality)** → Separate concerns in review
4. **TDD enforcement** → Tests-first in every implement
5. **14 skills** → Port to OpenCode SKILL.md format

### From gstack (Priority: High)

1. **/office-hours six-question framework** → Socratic gate in `/spec`
2. **/learn compounding** → Worklog → wiki compile
3. **/retro** → Our weekly retro workflow
4. **/canary** → Post-deploy monitoring
5. **Delivery loop** → Core workflow philosophy

### From Karpathy LLM Wiki (Priority: Core)

1. **Ingest → Query → Lint operations** → Phase 5-6 implementation
2. **index.md + log.md** → Wiki navigation
3. **Confidence scoring** → Wiki quality
4. **Bold-field metadata** → Alternative to YAML
5. **Training period** → Wiki learns our patterns

### From agency-agents (Priority: Medium)

1. **Security auditor persona** → security-auditor agent
2. **QA engineer persona** → qa-engineer agent
3. **Product manager persona** → product-manager agent
4. **Personality-over-instructions** → All 13 agents

## Skills to Port (Phase 2)

### Critical (Must Have)

- [ ] brainstorming — Socratic design refinement
- [ ] writing-plans — Detailed implementation plans
- [ ] subagent-driven-development — Fresh subagent per task
- [ ] test-driven-development — RED-GREEN-REFACTOR
- [ ] systematic-debugging — 4-phase root cause
- [ ] verification-before-completion — Prove it works
- [ ] code-review — Two-stage (spec + quality)
- [ ] office-hours — Six-question framework
- [ ] learn — Compounding knowledge capture
- [ ] wiki-query — Query wiki for patterns
- [ ] wiki-ingest — Process new sources
- [ ] wiki-lint — Health-check wiki
- [ ] wiki-compile — Build wiki from raw

### High Priority

- [ ] retro — Weekly retrospective
- [ ] canary — Post-deploy monitoring
- [ ] quick-dev — Fast iteration cycles
- [ ] vibe-coding-balance — When to use each approach

### Medium (Phase 9+)

- [ ] auto-research-loop — Self-improving research
- [ ] scalar-metrics — Track wiki health

## Agent Template Sources (Phase 2)

### Primary Sources

1. **Antigravity (.agent)** — 21 agents, 36 skills already in our repo!
2. **agency-agents** — Persona templates (security, QA, product)
3. **gstack** — Specialist roles (CEO, Designer, Eng Manager)
4. **Your existing backend-specialist.md** — Baseline

### 13 Agents to Define

| # | Agent | Primary Template | Notes |
|---|-------|-----------------|-------|
| 1 | orchestrator | gstack CEO | Dispatches subagents |
| 2 | product-manager | agency-agents | Research, definition |
| 3 | product-owner | gstack Eng Manager | Prioritization |
| 4 | backend-specialist | existing | Strong baseline |
| 5 | frontend-specialist | agency-agents | React/Next.js |
| 6 | database-architect | agency-agents | Schema, RLS |
| 7 | security-auditor | agency-agents | Architecture-level |
| 8 | qa-engineer | agency-agents | Test strategy |
| 9 | technical-writer | agency-agents | Architecture docs |
| 10 | content-writer | gstack Doc Engineer | User-facing |
| 11 | devops-engineer | gstack Release Manager | CI/CD, migrations |
| 12 | code-explorer | (new) | Codebase mapping |
| 13 | debugger | Superpowers | Root cause |

## Workflows to Adapt (Phase 2)

| Canonical Workflow | Primary Framework | Key Pattern |
|--------------------|-------------------|--------------|
| `/explore` | (existing) | Phase 0 complete |
| `/spec` | Superpowers + gstack | brainstorm → plan, office-hours |
| `/plan` | gstack | Delivery loop |
| `/implement` | Superpowers + Aider | TDD, subagent dispatch |
| `/ship` | Superpowers + gstack | Two-stage review, canary |
| `/audit` | (new) | Codebase exploration |
| `/retro` | gstack | Weekly review |
| `/document` | gstack Doc Engineer | Technical + user |
| `/adr` | (new) | Decision records |
| `/refactor-spot` | Superpowers | Refactor capture |

## What's Deferred (Phase 9+)

- Karpathy auto-research loops
- Overnight iteration experiments
- Complex metric tracking
- Full Obsidian integration (decision in Phase 5)

## Next: Day 5-6

- **Day 5:** Research 13 agent templates in depth
- **Day 6:** Research ~18 skill categories + tradeoff review
- **Output:** `knowledge/raw/audits/extraction-decisions.md` (Phase 1 final)

---

## Files Created

```
knowledge/raw/audits/framework-reviews/
├── antigravity.md         (4.3/5 - Primary source, in our repo!)
├── superpowers.md          (4.7/5 - Critical)
├── gstack.md               (4.0/5 - High)
├── bmad.md                 (3.5/5 - Medium)
├── agency-agents.md        (3.5/5 - Medium)
├── aider.md                (3.5/5 - Medium)
├── claude-code.md          (4.0/5 - Reference)
├── vercel-ai-sdk.md        (3.5/5 - Reference)
├── karpathy-llm-wiki.md    (5.0/5 - Core)
├── karpathy-autoresearch.md (3.0/5 - Deferred)
└── summary.md              (this file)
```
