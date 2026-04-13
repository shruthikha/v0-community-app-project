---
name: sprint
description: Backlog grooming and sprint composition. Reviews ready-for-dev issues, identifies dependencies, proposes sequencing, assigns to a sprint window. Lightweight planning at the sprint level (vs /plan which is feature-level).
temperature: 0.4
---

# Command: /sprint

Sprint composition and backlog grooming. Reviews `ready-for-dev` issues, identifies dependencies between them, proposes a sequence, and assigns to a sprint window.

This is different from `/plan` — `/plan` is feature-level (how to build one thing), `/sprint` is sprint-level (what to build this week, in what order).

Sprint: $ARGUMENTS

---

## Phase 0: Socratic Gate

**Create a TodoWrite list now with one item per phase of this command. Mark Phase 0 as in_progress.**

Load and follow the `socratic-gate` skill.

**Key questions:**

1. **Sprint window?** — This week, next week, or custom date range?
2. **Sprint number/name?** — e.g., `sprint-12` or `2026-04-15-week`
3. **Theme or goal?** — Is there a focus for this sprint, or open backlog grooming?
4. **Time available?** — Rough estimate of hours/days you'll have for development this sprint

**Wait for user response before proceeding.**

---

## Phase 1: Load Backlog

Load and follow the `workflow-methodology` skill for standard protocols.

### Fetch issues from GitHub

Via GitHub MCP, fetch all issues with these labels:
- `ready-for-dev` — planned and ready to start
- `ready-for-plan` — has a spec but not yet planned (may move to ready-for-dev during this session)
- `backlog` — ideas/specs not yet prioritized

For each issue, capture: number, title, labels, current sprint assignment (if any), linked spec, linked plan, dependencies noted in body.

### Load related artifacts

For each `ready-for-dev` issue, load the plan file:

!`find docs/specs -name "plan.md" 2>/dev/null`

Read the plan files for issues being considered. The plan tells you task count, checkpoint count, risk register, and refactoring items included — all of which inform sprint sizing.

### Check current sprint state

!`find docs/specs/sprints -name "*.md" 2>/dev/null | sort | tail -3`

Read the most recent sprint plan if one exists. Check which issues from prior sprints are still in flight (`in-progress` or `in-review` labels).

---

## Phase 2: Dependency Analysis

**Dispatch to `@product` via Task tool** to analyze dependencies between candidate issues.

Pass: the list of `ready-for-dev` issues with their plans, and ask:
- Which issues have hard dependencies on each other?
- Which can be built in parallel without conflict?
- Which would benefit from being built together (shared context, related files)?
- Which should explicitly NOT be built in the same sprint (high-risk combinations)?

The product agent returns a dependency map. Example:

```markdown
## Dependency Analysis

### Hard dependencies (must build in order)
- #66 (lot images schema) → #67 (lot images UI) → #68 (lot images permissions)

### Parallel-safe (can build in any order)
- #82 (middleware fix), independent
- #91 (CI update), independent

### Co-build candidates (related, share context)
- #103 + #104 (both touch resident profiles)

### Avoid pairing
- #66 (DB migration) + #82 (auth fix) — both touch session-critical paths, debug interactions would be painful
```

---

## Phase 3: Sprint Composition

Based on the user's time available, theme, and dependency analysis, propose a sprint composition.

Present to the user:

```markdown
## Proposed Sprint: {sprint name}

**Window:** {start} → {end}
**Theme:** {theme or "open"}
**Time available:** {hours}

### In Sprint

| Order | Issue | Title | Risk | Notes |
|-------|-------|-------|------|-------|
| 1 | #66 | Lot images schema | HIGH | Migration required, do early in sprint |
| 2 | #67 | Lot images UI | LOW | Depends on #66 |
| 3 | #82 | Middleware fix | MEDIUM | Independent, can pivot to if blocked |

### Pulled into ready-for-plan (specs done, need plans)
- #94 — bilingual onboarding flow
- #99 — admin dashboard refresh

### Stays in backlog
- #103, #104 — co-build candidates, defer to next sprint when both are spec'd

### Carryover from previous sprint
- #58 — currently `in-review`, will close this sprint when shipped

### Risk notes
- #66 has migration → use staging carefully, follow migration-safety
- Total HIGH RISK items: 1 (acceptable for the time available)

**Approve this composition?** (yes / adjust / different sprint)
```

**Wait for user response.** Iterate if needed — user may want to swap items, change order, or adjust scope.

---

## Phase 4: Write Sprint Plan

Once approved, write to `docs/specs/sprints/{sprint-name}.md`:

```markdown
---
title: {Sprint name}
status: active
start: YYYY-MM-DD
end: YYYY-MM-DD
theme: {theme or "open"}
---

# {Sprint name}

## Goal
{1-2 sentences describing the sprint focus}

## In Sprint
{Table from Phase 3}

## Carryover
{From Phase 3}

## Dependencies
{Dependency map from Phase 2}

## Risk Notes
{From Phase 3}

## Out of Scope
{What was considered but deferred}

## Daily Status
- {YYYY-MM-DD}: started
```

---

## Phase 5: Update GitHub Issues

Via GitHub MCP, for each issue in the sprint:
- Add label `sprint-{name}` (or whatever convention you use)
- Comment with: "Assigned to {sprint name}, position {N} in sequence"

For each issue moved to `ready-for-plan`:
- Add label `ready-for-plan`
- Comment with: "Promoted from backlog during sprint planning. Run `/spec` to refine."

For carryover issues:
- Update the existing sprint label to the new sprint name

---

## Phase 6: Closeout

Load and follow these skills:
- `workflow-recommender` — likely recommends `/implement` on the first sprint issue, or `/spec` on the highest-priority `ready-for-plan` item

Mark all TodoWrite items completed.

### Reminder for the user

> "Sprint {name} is now active. To start work on the first issue, run `/implement #{first-issue}`. To refine an unspec'd item, run `/spec` on it. Run `/sprint` again at the end of the window to wrap up and plan the next one."