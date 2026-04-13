---
name: explore
description: Codebase, topic, or idea exploration. Clarifies scope first, then explores and synthesizes findings with recommendations.
model: opencode/minimax-m2.5-free
temperature: 0.3
---

# Command: /explore

Explore codebase, research topics, or investigate ideas. Outputs findings to `knowledge/raw/` with recommendations for next steps.

$ARGUMENTS

---

## Phase 0: Socratic Gate

**Create a TodoWrite list now with one item per phase of this command. Mark Phase 0 as in_progress.**

Load and follow the `socratic-gate` skill. Clarify before exploring.

**Key questions (ask only the unclear ones):**

1. **Type?** — Codebase ("how does X work"), research ("tell me about Y"), or idea ("can we do Z")?
2. **Depth?** — Quick (~10 min), moderate (~30 min), or deep (~1 hour)?
3. **What does useful output look like?** — Summary? Code examples? Architecture map?

Output goes to:
- Codebase → `knowledge/raw/research/explore_YYYY-MM-DD_{topic}.md`
- Research/idea → `knowledge/raw/research/explore_YYYY-MM-DD_{topic}.md`

*Note: The `knowledge/raw/audits/` directory is reserved exclusively for the `/audit` workflow.*

**Wait for user response before proceeding.**

---

## Phase 1: Context

Load and follow the `workflow-methodology` skill for standard protocols.
Load and follow the `wiki-query` skill — search ALL wiki and raw folders.

Existing explorations and related work:
!`ls knowledge/raw/research/ 2>/dev/null | tail -5`
!`ls knowledge/raw/audits/ 2>/dev/null | grep explore | tail -5`

Check `knowledge/wiki/` for related patterns, lessons, and concepts. Document what prior work exists.

---

## Phase 2: Explore

**Dispatch to `@investigator` via Task tool.** Pass:
- The exploration topic from Phase 0
- Depth (quick/moderate/deep)
- Output path agreed in Phase 0
- Any prior context loaded in Phase 1 (file paths, wiki references)

The investigator handles the actual exploration:
- Codebase: grep, glob, trace imports, identify patterns
- Research: Context7 MCP for framework docs, web search for comparisons
- Idea: check architecture fit, integration points, prior PRDs

The investigator returns findings to you. You synthesize and write the output file in Phase 3.

---

## Phase 3: Document Findings

Write to the path agreed in Phase 0:

```markdown
# Exploration: {Topic}

**Date**: YYYY-MM-DD
**Type**: codebase | research | idea
**Depth**: quick | moderate | deep

## Context
{What was asked and why}

## Prior Work
{From wiki-query — what already exists}

## Findings
{Structure depends on type — code paths, research summary, feasibility analysis}

## Summary
{2-3 sentence overview}

## Recommendations
- [ ] Next step 1
- [ ] Next step 2
```

---

## Phase 4: Closeout

Load and follow these skills:
- `auto-doc-update` — check if any docs need updating based on findings
- `refactoring-opportunity-capture` — note any code quality issues found
- `workflow-recommender` — recommend what to run next