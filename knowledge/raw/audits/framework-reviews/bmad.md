---
framework: BMAD
source: github.com/bmad-code-org/BMAD-METHOD
relevance_score: 4
extracted_patterns:
  - Quick-dev iteration cycles
  - Vibe coding + structured iteration balance
  - Orchestrator pattern for multi-agent coordination
  - Module-based system building
  - Trust & safety in AI development
skills_to_port:
  - quick-dev-workflow
  - vibe-coding-balance
  - iteration-cycles
workflows_to_adapt:
  - /implement (quick-dev iteration)
  - /spec (structured iteration)
anti_patterns:
  - Full methodology adoption (too verbose)
  - Trust & safety modules (keep simple)
customizations_needed:
  - Simplify for OpenCode format
  - Focus on workflow, not enterprise concerns
---

# BMAD Framework Deep Dive

## Overview

**Repository:** github.com/bmad-code-org/BMAD-METHOD  
**Name:** Breakthrough Method for Agile AI-Driven Development  
**Stars:** 43,814 ⭐  
**Created:** April 2025 | **Primary Language:** JavaScript (88.2%)

BMAD is a **comprehensive methodology for AI-driven development** that balances "vibe coding" (intuitive, fast) with structured iteration cycles. Born from the observation that Andrej Karpathy's "vibe coding" quote captured a real phenomenon: "I just see things, say things, run things, and copy-paste things, and it mostly works."

## Core Philosophy

BMAD addresses the problem with vibe coding:
- Fast initial progress
- Accumulating technical debt
- Eventually "untangling a bigger mess"

The solution: **structured iteration** — quick development cycles with built-in checkpoints.

## Key Patterns

### Quick-Dev Workflow

BMAD's core innovation is the **quick-dev cycle**:

```
1. Rapid prototype (vibe coding allowed)
2. Structured review (not code review — architectural review)
3. Iteration based on feedback
4. Checkpoint before next cycle
```

### Iteration Cycles

BMAD uses **time-boxed iterations**:
- Each iteration has a time limit
- Checkpoints at iteration boundaries
- "Good enough" vs. "perfect" decisions

### Orchestrator Pattern

BMAD includes multi-agent orchestration:
- Orchestrator agent coordinates sub-agents
- Each sub-agent has specific role
- Communication protocol between agents

### Module-Based System

BMAD promotes building with **composable modules**:
- Each module has clear interface
- Modules can be swapped/replaced
- Easier debugging and testing

## Vibe Coding Balance

The key insight from BMAD: **vibe coding is fine for prototyping, structured iteration for production**.

| Phase | Approach | When to Use |
|-------|----------|--------------|
| Exploration | Vibe coding | Initial prototype, learning new territory |
| Development | Structured | Building actual features |
| Review | Checkpoint | Before moving forward |
| Polish | Vibe coding | UI refinements, small tweaks |

## Trust & Safety

BMAD includes enterprise-level trust & safety considerations:
- Input validation
- Output filtering
- Rate limiting
- Audit trails

**For Nido+Río:** These are overkill for our scale, but we should consider basic security patterns in our security-auditor agent.

## Relevance to Nido+Río Migration

### What to Extract (High Priority)

1. **Quick-dev workflow** — Fast iteration cycles for `/implement`
2. **Vibe coding balance** — Knowing when to use structured vs. intuitive approaches
3. **Iteration time-boxing** — Explicit time limits prevent scope creep

### What to Skip

- **Full enterprise methodology** — Too verbose for our needs
- **Trust & safety modules** — Keep security simpler
- **Complex orchestration** — Use our orchestrator, not BMAD's

### Customization for OpenCode

- Simplify to essential workflow patterns
- Remove enterprise overhead
- Keep the quick-dev + structured iteration balance

### Scoring

| Criterion | Score | Notes |
|-----------|-------|-------|
| Workflow discipline | 3/5 | Less prescriptive than Superpowers |
| Skill portability | 4/5 | Workflow patterns adapt well |
| Multi-agent coordination | 3/5 | Orchestrator exists but complex |
| **Overall** | **3.5/5** | **Useful complement** |

## Files to Create

- `.opencode/skills/quick-dev/SKILL.md`
- `.opencode/skills/vibe-coding-balance/SKILL.md`
