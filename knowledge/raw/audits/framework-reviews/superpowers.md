---
framework: Superpowers
source: github.com/obra/superpowers
relevance_score: 5
extracted_patterns:
  - Brainstorm → Plan → Implement → Review → Finish workflow
  - Subagent-per-task dispatch with fresh context isolation
  - Two-stage code review (spec compliance + quality)
  - TDD enforcement (RED-GREEN-REFACTOR)
  - Mandatory skill triggering before any task
  - Persuasion principles (Cialdini) for pressure scenarios
  - Verification-before-completion
skills_to_port:
  - brainstorming
  - writing-plans
  - subagent-driven-development
  - test-driven-development
  - systematic-debugging
  - verification-before-completion
  - requesting-code-review
  - receiving-code-review
workflows_to_adapt:
  - /implement (TDD + subagent dispatch)
  - /ship (two-stage review)
  - /spec (brainstorm phase)
anti_patterns:
  - Skipping brainstorming before coding
  - Writing code before tests
  - Merging without review
customizations_needed:
  - OpenCode SKILL.md format adaptation
  - Task tool integration for subagent dispatch
  - Git MCP for git-worktrees support
---

# Superpowers Framework Deep Dive

## Overview

**Repository:** github.com/obra/superpowers  
**Author:** Jesse Vincent (@obra) — founder of Keyboardio, Perl project lead  
**Stars:** 121,000+ ⭐ (growing ~2,000/day)  
**Created:** October 2025 | **Latest:** v4.3.1 (Feb 21, 2026)

Superpowers is a **methodology-as-code** framework that enforces structured development workflows for AI coding agents. The core insight: AI agents need discipline, not just more tools.

## The 14 Skills

### Core Workflow Skills

1. **brainstorming** — Socratic design refinement before any code
2. **writing-plans** — Detailed implementation plans with verification steps
3. **subagent-driven-development** — Fresh subagent per task + two-stage review
4. **executing-plans** — Batch execution with human checkpoints
5. **finishing-a-development-branch** — Merge/PR decision workflow

### Development Practice Skills

6. **test-driven-development** — Strict RED-GREEN-REFACTOR cycle
7. **systematic-debugging** — 4-phase root cause process
8. **verification-before-completion** — Prove it's actually fixed
9. **using-git-worktrees** — Parallel development branches for isolation

### Collaboration Skills

10. **dispatching-parallel-agents** — Concurrent subagent workflows
11. **requesting-code-review** — Pre-review checklist
12. **receiving-code-review** — Responding to feedback

### Meta Skills

13. **using-superpowers** — Introduction to the skills system
14. **writing-skills** — Create new skills (with TDD for skills!)

## Key Innovations

### Subagent-Per-Task Pattern

The most distinctive feature. For each task:

```
1. Dispatch implementer subagent (fresh context, no pollution)
2. Implementer asks questions if needed
3. Implementer implements, tests, commits, self-reviews
4. Dispatch spec reviewer subagent → confirms code matches spec
5. Dispatch code quality reviewer subagent → approves or requests fixes
6. Mark task complete, repeat for next task
7. Final code review of entire implementation
```

**Why it works:**
- Fresh subagent per task = no context pollution
- Two-stage review catches both spec drift and quality issues
- No human-in-loop between tasks = faster iteration
- Each subagent follows TDD naturally

### Persuasion Principles

The framework embeds Cialdini's persuasion principles to ensure agents follow workflows even under pressure:

- **Time pressure** ("production is down!")
- **Sunk cost** ("but I already wrote it!")
- **Confidence** ("I know how to do this")

Jesse's research involves pressure-testing skills with adversarial subagent scenarios.

## Philosophy

> "Write tests first, always. Systematic over ad-hoc. Process over guessing. Simplicity as primary goal. Verify before declaring success."

The framework enforces:
- Can't skip brainstorming
- Can't write code before tests
- Can't merge without review

## Platform Support

| Platform | Installation |
|----------|--------------|
| Claude Code | `/plugin marketplace add obra/superpowers-marketplace` then `/plugin install superpowers@superpowers-marketplace` |
| Cursor | `/plugin-add superpowers` |
| Codex | Fetch from raw GitHub URL |
| OpenCode | Fetch from raw GitHub URL |

## Technical Details

- **Language:** Shell (hooks and scripts)
- **Architecture:** Markdown SKILL.md files + prompt templates + hook scripts
- **Bootstrap:** Session start hook injects "You have Superpowers" prompt
- **Discovery:** Agent runs script to find available skills
- **Enforcement:** Skills are mandatory, not suggestions

## Community & Activity

- **Contributors:** 10 (obra: 245 commits)
- **Open Issues:** 144
- **Recent Activity:** Very active (v4.3.1 Feb 2026)
- **Marketplace:** obra/superpowers-marketplace

## Relevance to Nido+Río Migration

### What to Extract (High Priority)

1. **Brainstorm → Plan → Implement → Review workflow** — Direct mapping to `/spec`, `/implement`, `/ship`
2. **Subagent-per-task pattern** — Model for orchestrator agent in Phase 2
3. **Two-stage review** — Spec compliance + quality separates concerns
4. **TDD enforcement** — Every implement workflow should enforce tests-first
5. **Persuasion principles** — Handle pressure scenarios gracefully
6. **Writing-skills pattern** — Template for creating our own skills

### What to Skip

- Marketplace adoption (specific to Claude Code ecosystem)
- Specific command syntax (adapt to OpenCode's YAML frontmatter)
- Chromium/browser integration (we use MCP, not browser automation)

### Customization for OpenCode

- Convert Shell hooks → OpenCode SKILL.md format
- Map subagent dispatch → Task tool
- Git worktrees → Git MCP operations

### Scoring

| Criterion | Score | Notes |
|-----------|-------|-------|
| Workflow discipline | 5/5 | Gold standard for enforced methodology |
| Skill portability | 5/5 | SKILL.md pattern maps directly to OpenCode |
| Multi-agent coordination | 4/5 | Subagent pattern excellent; parallel dispatch needs adaptation |
| **Overall** | **4.7/5** | **Must-have framework** |

## Files to Create

- `.opencode/skills/brainstorming/SKILL.md`
- `.opencode/skills/writing-plans/SKILL.md`
- `.opencode/skills/subagent-driven-development/SKILL.md`
- `.opencode/skills/test-driven-development/SKILL.md`
- `.opencode/skills/systematic-debugging/SKILL.md`
- `.opencode/skills/verification-before-completion/SKILL.md`
- `.opencode/skills/code-review/SKILL.md`
