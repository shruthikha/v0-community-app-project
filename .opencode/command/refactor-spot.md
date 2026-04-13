---
name: refactor-spot
description: Quick refactor opportunity capture. Creates standalone file in knowledge/raw/refactoring/. Fast — 2 questions, then write.
agent: investigator
model: opencode/minimax-m2.5-free
temperature: 0.3
---

# Command: /refactor-spot

Quick capture of a refactoring opportunity. This is a 2-minute command, not a deep analysis.

Opportunity: $ARGUMENTS

---

## Phase 0: Quick Clarification

**Create a TodoWrite list now with one item per phase of this command. Mark Phase 0 as in_progress.**

Two questions only:

1. **What and where?** — What's the issue, which file(s)?
2. **Effort?** — Small (< 1hr), medium (1-4hr), or large (> 4hr)?

If `$ARGUMENTS` already answers both, skip straight to Phase 1.

---

## Phase 1: Check for Duplicates

Load and follow the `workflow-methodology` skill for standard protocols.

!`ls knowledge/raw/refactoring/ 2>/dev/null`

Scan existing backlog. If a similar opportunity already exists, update it instead of creating a duplicate.

---

## Phase 2: Write

Load and follow the `refactoring-opportunity-capture` skill for file format.

Create `knowledge/raw/refactoring/YYYY-MM-DD_{slug}.md`:

```markdown
---
title: {Short description}
status: open
created: YYYY-MM-DD
updated: YYYY-MM-DD
effort: {small | medium | large}
category: {performance | security | readability | architecture | tech-debt}
module: {file or directory path}
---

# {Short description}

## Finding
{What's wrong or could be improved}

## Files
- {file paths}

## Suggested fix
{How to address it}
```

---

## Phase 3: Closeout

Load and follow `workflow-recommender` — brief, since this is a quick capture.