---
name: workflow-recommender
description: Recommends 1-3 next workflows at every workflow closeout. Reads retro dates, refactoring backlog age, undocumented decisions, and feature branch status to surface what should happen next. Prevents /retro, /adr, and /refactor-spot from being forgotten.
---

# Workflow Recommender

Every workflow closeout includes a "what to run next" section. This skill prevents important maintenance workflows from being forgotten.

## When to Use

- At the **closeout** of every workflow (`/explore`, `/spec`, `/plan`, `/implement`, `/ship`, `/audit`, `/retro`, `/document`)
- Automatically — no manual invocation needed

## What It Reads

### 1. Last Retro Date
Check `knowledge/raw/audits/retros/` for the most recent retro file.
- If >7 days since last retro → recommend `/retro`

### 2. Refactoring Backlog Age
Scan `knowledge/raw/refactoring/` for open items:
- If any items are >30 days old → recommend review or `/refactor-spot`
- Count total items — if growing, flag it

### 3. Undocumented Decisions
Scan last 5 files in `knowledge/raw/build-logs/`:
- Look for decision patterns: "we decided to", "chose X over Y", "tradeoff"
- If decisions found without corresponding ADR → recommend `/adr`

### 4. Documentation Gaps
Read `knowledge/wiki/documentation-gaps.md`:
- If gaps are growing (more items than 2 weeks ago) → recommend `/document`

### 5. Current Context
Based on the workflow that just completed:
- Finished `/spec` on feature X → recommend `/plan` on feature X
- Finished `/implement` → recommend `/ship`
- Finished `/ship` → recommend monitoring, then `/retro` if overdue

### 6. Branch Status (via Git MCP)
Check for stale feature branches:
- Branches with no commits in >7 days → suggest finishing or closing
- Branches behind main by >20 commits → suggest rebase or close

## Output Format

Append to every workflow closeout artifact:

```markdown
## What to Run Next

1. **`/retro`** (high priority): No retrospective in 9 days. Recent builds touched auth and billing — worth reflecting.
2. **`/adr` on "session timeout strategy"** (medium): Build log #{N} documents a decision that should be an ADR.
3. **`/spec` on "pilot onboarding flow"** (low): Related to recent pilot discussions.

Respond: `yes <number>`, `no`, or `later <number>` to queue.
```

## "Later" Queue

Items deferred with "later" are written to `knowledge/raw/followups.md`:

```markdown
- [ ] `/adr` on "session timeout strategy" — deferred {date} from {workflow}
- [ ] `/refactor-spot` review — deferred {date}, 3 items >30 days
```

The `/retro` workflow reads this file and reviews queued items.

## Priority Heuristics

| Signal | Priority | Recommendation |
|--------|----------|---------------|
| No retro in >7 days | High | `/retro` |
| Refactoring items >30 days old | Medium | `/refactor-spot` review |
| Undocumented decisions in build logs | Medium | `/adr` |
| Doc gaps growing | Medium | `/document` |
| Just finished `/spec` | Low (natural flow) | `/plan` |
| Stale branch >7 days | Low | Finish or close |

## Anti-Patterns

- ❌ Recommending more than 3 items (decision fatigue)
- ❌ Recommending `/retro` every single closeout (only when >7 days)
- ❌ Recommending workflows the user just completed
- ❌ Being pushy — "later" is a valid response