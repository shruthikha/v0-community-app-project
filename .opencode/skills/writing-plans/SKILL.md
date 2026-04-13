---
name: writing-plans
description: Create detailed implementation plans with bite-sized tasks. Each task has file paths, verification steps, and clear acceptance criteria. Plans are explicit enough for a fresh agent to execute without context. Hybrid of Superpowers writing-plans pattern.
---

# Writing Plans

Convert approved designs into implementation plans with tasks small enough to verify individually.

## When to Use

- After brainstorm/design is approved
- When `/plan` workflow executes
- Before any multi-file implementation begins

## Plan Structure

```markdown
# Implementation Plan: [Feature Name]

**Issue:** #{number}
**Design:** [Link to spec or build log]
**Branch:** `feat/{feature-name}`
**Estimated tasks:** {N}

## Prerequisites
- [ ] [Any setup needed before starting]

## Tasks

### Task 1: [Short descriptive name]
**Files:** `path/to/file.ts`
**Action:** [Create | Modify | Delete]
**Details:**
[Exact description of what to implement. Include code signatures if helpful.]

**Verification:**
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] [Specific test or manual check]

**Depends on:** None

---

### Task 2: [Short descriptive name]
**Files:** `path/to/other-file.ts`, `path/to/test.ts`
**Action:** [Create | Modify]
**Details:**
[What to implement]

**Verification:**
- [ ] [How to verify this task is complete]

**Depends on:** Task 1
```

## Task Sizing

Each task should be:
- **2-5 minutes** of focused work for an agent
- **One logical change** (not "implement the feature")
- **Independently verifiable** — you can check if it's done without looking at other tasks
- **Clear file targets** — exact paths, not "somewhere in the components folder"

## The Superpowers Test

Each task must be clear enough that "an enthusiastic junior engineer with poor taste, no judgment, no project context, and an aversion to testing" could follow it. If a task requires deep context to understand, break it down further or add explicit context.

## Migration Safety

If the plan touches `supabase/migrations/`:
- Add a dedicated migration task with rollback script
- Note: "Requires `migration-safety` skill verification before merge"
- Include staging verification as a task

## Plan Metadata

At the end of every plan:

```markdown
## Plan Metadata
- **Total tasks:** {N}
- **Estimated time:** {X hours}
- **Risk areas:** [What could go wrong]
- **Wiki patterns used:** [List referenced patterns]
- **Migrations involved:** Yes/No
- **User-facing changes:** Yes/No (triggers release notes)
```

## Anti-Patterns

- ❌ Tasks like "implement the backend" (too big)
- ❌ Tasks without verification steps (how do you know it's done?)
- ❌ Plans without file paths (where does the code go?)
- ❌ Circular dependencies between tasks
- ❌ Skipping the test task ("we'll add tests later" — no you won't)
