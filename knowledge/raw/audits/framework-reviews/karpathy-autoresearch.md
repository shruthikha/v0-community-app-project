---
framework: Karpathy Auto-research
source: karpathy.github.io/llm-wiki/auto-research.html
relevance_score: 3
extracted_patterns:
  - Editable asset (knowledge artifact that can be edited)
  - Scalar metric (measurable progress indicator)
  - Time-boxed cycle (research sprints)
  - Self-improving system
  - Research → Compile → Verify → Iterate
skills_to_port:
  - auto-research-loop
  - scalar-metrics
  - time-boxed-research
workflows_to_adapt:
  - /retro (metrics review)
  - Phase 9+ loops (deferred)
anti_patterns:
  - Overnight iterations (not in scope for Phase 6)
  - Complex metric tracking (keep simple)
customizations_needed:
  - Simplify for our scale
  - Focus on research sprint concept
---

# Karpathy Auto-research Deep Dive

## Overview

**Source:** karpathy.github.io/llm-wiki/ (part of LLM Wiki site)  
**Pattern:** Self-improving AI systems through research loops

Auto-research is Karpathy's companion pattern to LLM Wiki — the idea that **AI systems can improve themselves** through structured research cycles.

## Three Primitives

### 1. Editable Asset

A knowledge artifact that can be edited by the LLM:
- Wiki pages
- Code patterns
- Decision records
- Metrics dashboards

**Key:** The asset is "alive" — not just stored, but actively maintained.

### 2. Scalar Metric

A measurable progress indicator:
- "Number of patterns documented"
- "Wiki page cross-reference density"
- "Code review turnaround time"
- "Test coverage percentage"

**Key:** Must be quantifiable, trackable over time.

### 3. Time-Boxed Cycle

Research sprints with explicit time limits:
- 1-2 hour research sprints
- Daily or weekly cadence
- Explicit start/stop boundaries

**Key:** Prevents infinite research; forces completion.

## Research Loop Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    Research Sprint                       │
├─────────────────────────────────────────────────────────┤
│  1. Define question (editable asset)                   │
│  2. Set metric to track                                │
│  3. Time-box research (1-2 hours)                       │
│  4. Gather data/evidence                               │
│  5. Compile findings into asset                        │
│  6. Update metric                                      │
│  7. Verify improvement                                 │
│  8. Iterate or complete                                │
└─────────────────────────────────────────────────────────┘
```

## Example: Wiki Improvement Loop

**Question:** "How can we improve wiki cross-reference density?"

**Metric:** Average inbound links per wiki page

**Sprint:**
1. 1 hour: Analyze current cross-reference structure
2. Find pages with no inbound links
3. Identify linking opportunities
4. Add cross-references to wiki
5. Measure new density (e.g., 2.1 → 3.4 links/page)

**Result:** Wiki becomes more interconnected.

## Relevance to Nido+Río Migration

### What to Extract (Medium Priority)

1. **Editable asset concept** — Wiki pages are our assets
2. **Scalar metrics** — Track wiki health (page count, cross-links, etc.)
3. **Time-boxed cycles** — Research sprints for Phase 9+

### What to Skip (At Our Scale)

- **Overnight iterations** — Deferred to Phase 9+
- **Complex metric infrastructure** — Keep simple
- **Self-modifying code** — Not in scope

### Phase 6 vs. Phase 9

| Phase | Auto-research |
|-------|---------------|
| Phase 6 | Basic wiki compile + doc drift check |
| Phase 9+ | Full auto-research loops |

**Decision:** Keep Phase 6 simple (post-merge compile, doc drift). Auto-research to Phase 9+ when core is stable.

### Customization for OpenCode

- Metrics → Simple counters in wiki lint
- Time-boxing → Explicit in workflow prompts
- Research → Part of `/retro` and `/document`

### Scoring

| Criterion | Score | Notes |
|-----------|-------|-------|
| Workflow discipline | 3/5 | More advanced than Phase 6 |
| Skill portability | 4/5 | Patterns adapt to later phases |
| Multi-agent coordination | 2/5 | Single-agent focus |
| **Overall** | **3/5** | **Defer to Phase 9+** |

## Files to Reference (Phase 9+)

- `.opencode/skills/auto-research/SKILL.md`
- `.github/workflows/nightly-loops.yml` (deferred)
