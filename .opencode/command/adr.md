---
name: adr
description: Create architecture decision record. Produces docs/dev/decisions/NNNN-title.md. Referenced by future workflows.
model: google/gemini-3.1-flash-lite-preview
temperature: 0.3
---

# Command: /adr

Create Architecture Decision Record. Outputs to `docs/dev/decisions/NNNN-title.md`.

Decision: $ARGUMENTS

---

## Phase 0: Socratic Gate

**Create a TodoWrite list now with one item per phase of this command. Mark Phase 0 as in_progress.**

Load and follow the `socratic-gate` skill.

**Key questions:**

1. **What decision?** — Technology choice, pattern choice, architecture change?
2. **Context?** — What problem, what alternatives were considered?
3. **Status?** — Proposed (not decided), accepted (decided), deprecated, or superseded?
4. **Related ADRs?** — Any existing ADRs this connects to?

**Wait for user response before proceeding.**

---

## Phase 1: Context

Load and follow the `workflow-methodology` skill for standard protocols.
Load and follow the `wiki-query` skill — search ALL wiki and raw folders for prior decisions and related context.

!`ls docs/dev/decisions/ 2>/dev/null`

Read relevant prior ADRs. Check wiki patterns for established conventions.

---

## Phase 2: Write ADR

Find next number:
!`ls docs/dev/decisions/ 2>/dev/null | sort | tail -1`

Write to `docs/dev/decisions/NNNN-{title}.md`:

```markdown
---
title: {Decision Title}
status: {proposed | accepted | deprecated | superseded}
date: YYYY-MM-DD
deciders: {name}
---

# ADR {NNNN}: {Decision Title}

## Status
{Status}

## Context
{Problem, why it matters now}

## Decision
**We will use {choice} for {purpose}.**

## Consequences

### Positive
- {benefit}

### Negative
- {downside}
- Mitigated by: {mitigation}

## Alternatives Considered

### {Option A}
- Pros: {pros}
- Cons: {cons}
- Why not: {reason}

### {Option B}
- Pros: {pros}
- Cons: {cons}
- Why not: {reason}

## Related
- ADR {NNNN}: {title}

## Notes
{Additional context, links}
```

---

## Phase 3: Closeout

Load and follow these skills:
- `auto-doc-update`
- `workflow-recommender`