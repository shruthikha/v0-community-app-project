---
name: subagent-dispatch
description: Pattern for dispatching fresh subagents via OpenCode Task tool with two-stage review. Use during /implement when executing plan tasks. Each task gets a fresh agent, then a reviewer checks spec compliance and code quality.
---

# Subagent Dispatch

Execute plan tasks using fresh subagents for isolation, with two-stage review for quality. Adapted from Superpowers' subagent-driven-development for OpenCode's Task tool.

## When to Use

- During `/implement` when executing tasks from a plan
- When a plan has 3+ independent tasks
- When you want isolation between task implementations

## The Pattern

### Step 1: Dispatch Task to Fresh Subagent

Use OpenCode's Task tool to dispatch each plan task to a subagent:

```
Task: Execute Task {N} from the implementation plan.

Context:
- Feature: {feature name}
- Plan: {link to plan file}
- Task description: {copy from plan}
- Files to modify: {list from plan}
- Verification: {steps from plan}

Constraints:
- Only modify the files listed
- Follow patterns in knowledge/wiki/patterns/
- Run quality-gate after changes
- Report results, do not proceed to next task
```

### Step 2: Two-Stage Review

After each task completes, review in two stages:

**Stage 1: Spec Compliance** (Does it match the plan?)
- Did the agent modify only the listed files?
- Does the implementation match the task description?
- Do the verification steps pass?

**Stage 2: Quality & Pattern Compliance** (Is it good code?)
- Does it follow patterns from `knowledge/wiki/patterns/`?
- Is it consistent with existing code in the same module?
- Any security concerns? (Reference `nido-multi-tenancy` skill if data-touching)
- TypeScript strict? No `any`?

### Step 3: Continue or Fix

- **Both stages pass** → Move to next task
- **Stage 1 fails** → Re-dispatch with clarified instructions
- **Stage 2 fails** → Fix in place or re-dispatch with pattern guidance
- **3 failures on same task** → Stop, escalate to user

## Parallelization

Tasks without dependencies can be dispatched in parallel. Check the `Depends on:` field in the plan. Independent tasks (e.g., "create component" and "add migration") can run simultaneously.

## Context Sharing

When dispatching subsequent tasks, include findings from prior tasks:

```
Additional context from prior tasks:
- Task 1 created `lib/utils/tenant.ts` — import from there
- Task 2 discovered the users table already has an `active` column
```

## Progress Tracking

Update the build log after each task:

```markdown
## {timestamp} — Task {N} Complete

### Result: ✅ Pass / ❌ Fail
### Files modified: [list]
### Review: Stage 1 ✅ Stage 2 ✅
### Notes: [Any context for next tasks]
```

## When NOT to Use

- Simple single-file changes — just do them directly
- Tasks that are tightly coupled and can't be isolated
- When the plan has only 1-2 tasks — overhead isn't worth it
