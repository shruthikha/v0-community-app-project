---
framework: gstack
source: github.com/garrytan/gstack
relevance_score: 5
extracted_patterns:
  - 28 slash commands simulating 15-person engineering org
  - /office-hours six-question framework for design clarification
  - /learn compounding knowledge (captures lessons after tasks)
  - /retro weekly retrospective
  - /canary post-deploy monitoring
  - Specialist roles (CEO, Designer, Eng Manager, Release Manager, Doc Engineer, QA)
  - Delivery loop with reframe → lock plan → review → ship
skills_to_port:
  - office-hours
  - learn
  - retro
  - canary
  - spec
  - review
  - ship
workflows_to_adapt:
  - /spec (office-hours integration)
  - /implement (learn integration for compounding)
  - /retro (weekly retrospective)
  - /ship (canary for monitoring)
anti_patterns:
  - Parallel browser daemon (Chromium-specific, not needed with MCP)
  - 23-role persona structure (too many for our needs)
customizations_needed:
  - Convert slash commands to OpenCode command format
  - Adapt specialist prompts to agent definitions
  - Replace browser automation with GitHub/Supabase MCP
---

# gstack Framework Deep Dive

## Overview

**Repository:** github.com/garrytan/gstack  
**Creator:** Garry Tan (YC President & CEO)  
**Stars:** 65,946 ⭐ (18 days to 55K)  
**Created:** March 2026 | **Primary Language:** TypeScript (71%)

gstack is a **skill pack that turns Claude Code into a structured virtual software development team** — simulating a 15-person engineering organization through specialized prompts.

## The 28 Slash Commands

gstack provides 28 slash commands organized by role:

### CEO/Leadership (6)
- `/office-hours` — Six-question design clarification (detailed below)
- `/inspire` — Generate creative alternatives
- `/decide` — Make binary choices
- `/pitch` — Articulate value proposition
- `/reject` — Kill ideas clearly
- `/delegate` — Assign to specialist

### Designer (5)
- `/design` — UI/UX design work
- `/critique` — Design review
- `/refine` — Iterate on designs
- `/audit` — Design system compliance
- `/explore` — Design research

### Engineering Manager (5)
- `/plan` — Sprint planning
- `/retro` — Retrospective
- `/blocker` — Identify blockers
- `/prioritize` — Ranking
- `/risk` — Risk assessment

### Engineer (6)
- `/spec` — Write specifications
- `/implement` — Build features
- `/review` — Code review
- `/test` — Testing
- `/debug` — Debugging
- `/refactor` — Refactoring

### Release Manager (3)
- `/release` — Release process
- `/rollback` — Rollback
- `/deploy` — Deployment

### Doc Engineer (2)
- `/document` — Documentation
- `/guide` — User guides

### QA (1)
- `/test` — QA testing (also under Engineer)

## Key Patterns

### /office-hours — Six-Question Framework

The standout skill. Before any implementation, answer these six questions:

1. **What are we building?** (2-3 sentence description)
2. **Who is it for?** (target user/segment)
3. **What problem does it solve?** (user pain point)
4. **How do we know it's worth building?** (success metrics)
5. **What's the simplest path?** (MVP scope)
6. **What could go wrong?** (risks and mitigations)

**Why it works:** Forces structured thinking BEFORE coding starts. Prevents the "vibe coding" trap where agents jump straight to implementation without understanding the problem.

### /learn — Compounding Knowledge

After completing any task, capture:
- What worked well
- What could be improved
- Patterns to reuse
- Knowledge to share

This creates a **compounding knowledge base** — every task contributes to institutional knowledge.

### /retro — Weekly Retrospective

Structured weekly review:
- What went well
- What didn't go well
- Action items for next week

### /canary — Post-Deploy Monitoring

Post-deployment health checks:
- Error rate monitoring
- Performance metrics
- User feedback collection

### Delivery Loop

gstack enforces a delivery loop:

```
reframe → lock plan → review → ship
     ↑                           │
     └──────── feedback ─────────┘
```

This creates a **closed feedback loop** where each cycle improves the next.

## Philosophy

From Garry Tan: "Turn your coding agent into a software team with standards."

- **Simulation over orchestration** — Pretends to be a team, not coordinating real agents
- **Opinionated structure** — 28 commands force discipline
- **Delivery focus** — Every command serves shipping software

## Platform Support

| Platform | Installation |
|----------|--------------|
| Claude Code | Native via /plugin system |
| Codex | Native |
| OpenCode | Fetch from raw GitHub URL |

## Relevance to Nido+Río Migration

### What to Extract (High Priority)

1. **/office-hours six-question framework** — Essential for `/spec` Socratic gate
2. **/learn compounding pattern** — Direct mapping to worklog → wiki compile
3. **/retro** — Becomes our `/retro` workflow
4. **/canary** — Post-deploy monitoring for `/ship`
5. **Delivery loop** — Core philosophy for workflow design

### What to Skip

- **Chromium browser daemon** — Parallel browser sessions (not needed with MCP)
- **23-role persona structure** — Too many; we need 13 agents
- **Specific slash command syntax** — Adapt to OpenCode YAML format

### Customization for OpenCode

- Convert slash commands → OpenCode command format
- Map specialist prompts → 13 agent definitions
- Replace parallel browser → GitHub/Supabase MCP operations
- Integrate office-hours → `/spec` Socratic gate

### Scoring

| Criterion | Score | Notes |
|-----------|-------|-------|
| Workflow discipline | 5/5 | 28 commands enforce structure |
| Skill portability | 4/5 | Some adaptation needed for OpenCode |
| Multi-agent coordination | 3/5 | Simulated team, not real coordination |
| **Overall** | **4/5** | **High-value framework** |

## Files to Create

- `.opencode/command/spec.md` (with office-hours integration)
- `.opencode/skills/office-hours/SKILL.md`
- `.opencode/skills/learn/SKILL.md`
- `.opencode/skills/canary/SKILL.md`
- Agent definitions for specialist roles (subset of 13)
