---
name: plan
description: Implementation plan from approved spec. Dispatches to product, specialists, qa-engineer, and solution-architect for domain expertise. Produces task breakdown, manual test checkpoints, and risk register. Updates issue labels.
temperature: 0.4
---

# Command: /plan

Create implementation plans from approved specs. The orchestrator coordinates phases and synthesizes outputs. Product owns delivery sequencing, specialists own technical feasibility, QA owns test design, solution-architect owns risk evaluation.

Planning: $ARGUMENTS

---

## Phase 0: Socratic Gate

**Create a TodoWrite list now with one item per phase of this command. Mark Phase 0 as in_progress.**

Load and follow the `socratic-gate` skill. Light gate — spec should be approved already.

### Refine clarifying questions

**For complex or ambiguous specs, dispatch to `@product` via Task tool** to refine the gate questions.

Pass: the spec content from `$ARGUMENTS` and ask the product agent to flag any ambiguities, scope risks, or missing requirements that should be resolved before planning.

The product agent returns: a refined set of clarifying questions (or "no clarifications needed"). Use these to enrich the questions below before asking the user.

### Standard questions

1. **Which spec are we planning?** — Feature name or path to spec file
2. **Smallest shippable slice?** — All-at-once or split into phases?
3. **Risk tolerance?** — Aggressive (ship, iterate) or conservative (extra verification, smaller commits)
4. **Any blockers or dependencies?** — External decisions pending, other work needed first?
5. **Plus any clarifications surfaced by `@product` in the refinement step above**

### Scope check

Has the spec changed since approval?
- Unchanged → proceed
- Minor clarifications → I'll note them in the spec as "Planning refinements" and continue
- Major changes → stop, re-run `/spec` first, then return to `/plan`

**Wait for user response before proceeding.**

---

## Phase 1: Context

Load and follow the `workflow-methodology` skill for standard protocols.
Load and follow the `wiki-query` skill — search ALL wiki and raw folders.

!`find docs/specs -name "*$ARGUMENTS*" 2>/dev/null`
!`find knowledge/raw/build-logs -name "*$ARGUMENTS*" 2>/dev/null`
!`find knowledge/raw/research -name "*$ARGUMENTS*" 2>/dev/null`

**Read all matching files into context.** The spec is the source of truth — load its full content. Identify dependencies and prior work from the loaded files.

---

## Phase 2: Continuous Refactoring Check

Scan for open refactoring opportunities that overlap with planned work:

!`ls knowledge/raw/refactoring/ 2>/dev/null | grep -v completed`

For each open refactoring file, read the `module:` field from its frontmatter. Compare against the file paths this plan will touch.

### If overlaps are found

**Dispatch to `@product` via Task tool** to evaluate the overlapping items.

Pass: the list of overlapping refactoring files, the spec being planned, and the user's risk tolerance from Phase 0.

Ask the product agent to:
- Categorize each overlap by inclusion value (high / medium / low)
- Identify which items would meaningfully reduce future tech debt vs. which are nice-to-haves
- Flag any items that are large enough they'd derail the sprint
- Recommend a default selection (e.g., "include items 1 and 3, defer 2")

The product agent returns a recommendation with reasoning. Present the recommendation to the user:

```markdown
## Refactoring Opportunities in Scope

These open refactoring items overlap with files you're about to touch:

| # | Item | File | Effort | Inclusion Value | Recommendation |
|---|------|------|--------|-----------------|----------------|
| 1 | {title} | {module path} | {small/medium/large} | {high/medium/low} | {include / defer} |

**Product agent's reasoning:**
{paste @product's reasoning here}

**Confirm or adjust?** (accept all / accept some / reject all / discuss)
```

**Wait for user response.** Fold confirmed items into the task breakdown as additional subtasks under the relevant feature.

---

## Phase 3: Task Breakdown

Load and follow the `writing-plans` skill for task granularity guidance.

### Step 1: Draft structure with @product

**Dispatch to `@product` via Task tool** to draft the initial task breakdown.

Pass: the spec content, the user's slice preference from Phase 0 (smallest shippable slice), and the refactoring items being included.

Ask the product agent to:
- Break the spec into atomic tasks
- Group tasks by domain (DB, backend, frontend, tests)
- Identify task dependencies
- Suggest a logical execution order

The product agent returns a draft task list with groups and dependencies.

### Step 2: Validate feasibility per task with specialists

For each task in the draft, **dispatch to the relevant specialist via Task tool** to validate feasibility and refine the file targets:
- DB tasks → `@database-architect`
- Backend tasks → `@backend-specialist`
- Frontend tasks → `@frontend-specialist`
- Test tasks → `@qa-engineer`

Pass: the task description from the product draft, the planned files, and ask for confirmation that the file targets are correct and the action is feasible as scoped.

Each task needs:
- Files to modify (exact paths)
- Action (create / modify / delete)
- Verification steps (what proves it's done)
- Dependencies (which earlier tasks must complete first)

### Step 3: Synthesize

Combine product's structure (the **what** and the **order**) with specialists' refinements (the **how** and the **feasibility**) into the final task list.

If any specialist flagged concerns that affect the structure (e.g., "this task should be split into two"), loop back to product with the specialist's feedback before finalizing.

---

## Phase 4: Manual Test Checkpoints

The user will manually test through dev servers — no E2E coverage. Plan when those manual tests happen.

### Step 1: Design checkpoint structure with @product

**Dispatch to `@product` via Task tool** to design the checkpoint structure.

Pass: the task breakdown from Phase 3 and the user's risk tolerance from Phase 0.

Ask the product agent to:
- Group tasks into 2-4 checkpoints based on what the user can independently verify
- Define the user-facing goal of each checkpoint (e.g., "verify schema works", "verify happy path")
- Suggest checkpoint ordering (which should come first)

### Grouping principles for the product agent

- **Schema before logic** — DB tasks (migration, RLS, types) form one checkpoint. User verifies schema in Supabase Studio before any code touches it.
- **Backend before frontend** — server actions / API routes form a checkpoint. User can hit them via curl, dev tools, or a temporary test page.
- **UI in slices** — large UI work splits into "data display" (read-only) and "interactions" (mutations). Display checkpoint comes first.
- **Integration last** — wiring different layers together is its own checkpoint after each layer is verified independently.
- **Tests can be in their own group** or distributed across other groups depending on what's being tested.

The product agent returns the checkpoint structure (groupings and goals).

### Step 2: Write test instructions per checkpoint with @qa-engineer

For each checkpoint, **dispatch to `@qa-engineer` via Task tool** to write the actual test instructions.

Pass: the checkpoint goal from product, the tasks in that checkpoint, the dev server URLs and routes from the spec, and any relevant tenant context (e.g., `/t/ecovilla-san-mateo/...`).

Ask the qa-engineer to produce, for each checkpoint:

```markdown
## Checkpoint {N}: {name from product}

**Tasks in this group:**
- Task X: {description}
- Task Y: {description}

**What to test:**
1. {Specific step, e.g., "Start dev server: npm run dev"}
2. {Specific step, e.g., "Visit: http://localhost:3000/t/ecovilla-san-mateo/dashboard/{path}"}
3. {Specific step, e.g., "Click X, expect Y"}

**What to verify:**
- [ ] {behavior 1}
- [ ] {behavior 2}
- [ ] {behavior 3}

**Edge cases to try:**
- [ ] {edge case 1}
- [ ] {edge case 2}

**What "pass" looks like:**
{Concrete success criteria}

**What "fail" looks like:**
{Concrete failure modes — what to look out for}
```

### Step 3: Synthesize

Combine product's structure (groupings and goals) with qa-engineer's instructions (concrete test steps) into the final checkpoint definitions.

### Default checkpoint count

For most features, expect **2-4 checkpoints**. Single-checkpoint features are usually too risky (no early failure detection). Five-plus checkpoints usually mean tasks aren't grouped well — combine related ones.

### Example checkpoint set for a typical feature

```
Checkpoint 1: Schema (after DB tasks)
  → Verify migration applied, RLS works, tenant isolation correct
Checkpoint 2: Backend (after server actions / API)
  → Hit endpoints, verify responses, check edge cases
Checkpoint 3: UI display (after read-only UI)
  → Visit page, verify data renders, mobile responsive
Checkpoint 4: UI interactions (after mutations + integration)
  → Full user flow happy path + edge cases
```

---

## Phase 5: Risk Assessment

**Dispatch to `@solution-architect` via Task tool** for risk evaluation.

Pass: the task breakdown from Phase 3, the spec, and the user's risk tolerance from Phase 0.

Ask the solution-architect to:
- Identify HIGH RISK items beyond the obvious (migrations, breaking changes)
- Consider cross-cutting concerns: security, multi-tenancy, performance impact
- Identify hidden dependencies on external services or shared infrastructure
- Suggest mitigation strategies for each HIGH RISK item
- Design rollback strategies for each HIGH RISK item

The solution-architect returns a risk register with mitigations and rollbacks.

### HIGH RISK criteria (baseline)

- Schema migrations
- Breaking API changes
- New dependencies
- Third-party integrations
- Auth changes
- RLS policy changes

The architect may surface additional risks beyond this baseline.

### Risk register format

| Task | Risk | Reason | Mitigation | Rollback |
|------|------|--------|------------|----------|
| Migration | HIGH | Schema change | Apply to staging first, smoke test | Revert migration script |
| API change | MEDIUM | Breaking | Version bump, deprecation notice | Restore old endpoint |

---

## Phase 6: Write Plan

Write to `docs/specs/{feature}/plan.md`:

```markdown
---
title: {Feature} — Implementation Plan
status: ready
created: YYYY-MM-DD
issue: #{issue-number}
---

# {Feature} — Implementation Plan

## Goal
{1-2 sentences from spec}

## Tasks

### Group 1: {group name}
| # | Task | Type | Specialist | Files | Dependencies |
|---|------|------|------------|-------|--------------|
| 1 | {task} | DB | @database-architect | `supabase/migrations/...` | none |

### Group 2: {group name}
{...}

## Manual Test Checkpoints

### Checkpoint 1: {name}
{full checkpoint structure from Phase 4}

### Checkpoint 2: {name}
{...}

## Risk Register
{Risk table from Phase 5}

## Refactoring Items Included
- {items from Phase 2 if user selected any}

## Out of Scope
- {What was deferred and why}
```

Create directory if needed.

---

## Phase 7: Update Issue

**Dispatch to `@product` via Task tool** to draft the issue comment.

Pass: the plan summary, task count, checkpoint count, HIGH RISK list, and refactoring items included.

Ask the product agent to write a clear comment in the project's voice: what's planned, what risks exist, what the user should expect during implementation.

The product agent returns the comment text.

Then via GitHub MCP, update the parent issue:
- Remove label `ready-for-plan`
- Add label `ready-for-dev`
- Post the comment from `@product` with link to the plan file

---

## Phase 8: GitHub Issues for Sub-Tasks (optional)

Ask the user: "Create separate GitHub issues for each task group, or keep them tracked in the parent issue only?"

If yes, **dispatch to `@product` via Task tool** to draft the sub-task issue bodies.

Pass: the task groups from the plan and the parent issue context.

Ask the product agent to write each sub-task issue with: clear title, scope description, link to plan, parent issue reference, acceptance criteria.

The product agent returns drafted issues. Confirm with user before creating, then create them via GitHub MCP:
- Title: `[#{parent-issue}] {Group name}: tasks`
- Labels: `sprint-{N}` (if known), `{type}`
- Body: as drafted by `@product`

---

## Phase 9: Closeout

Load and follow these skills:
- `auto-doc-update`
- `refactoring-opportunity-capture`
- `workflow-recommender` — likely recommends `/implement`

Mark all TodoWrite items completed.