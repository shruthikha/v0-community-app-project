---
name: implement
description: Build feature from approved plan. Branch setup, per-task execution with debug loops, manual test checkpoints between task groups, continuous build log updates, draft PR with issue closure.
temperature: 0.3
---

# Command: /implement

Build features from an approved plan. Stop-and-go execution with manual test checkpoints — not a build-everything-then-test workflow.

Implementing: $ARGUMENTS

---

## Phase 0: Socratic Gate

**Create a TodoWrite list now with one item per phase of this command. Mark Phase 0 as in_progress.**

Load and follow the `socratic-gate` skill.

**Key questions:**

1. **Which issue are we implementing?** — Issue number is canonical, e.g., `#66`. The branch, PR, and build log all derive from this.
2. **Plan reference?** — Path to the approved plan file (usually `docs/specs/{feature}/plan.md`)
3. **Any changes since plan was approved?** — Scope changes, new constraints?

Current branch: !`git branch --show-current`
Git status: !`git status --short`

**Wait for user response before proceeding.**

---

## Phase 1: Context

Load and follow the `workflow-methodology` skill for standard protocols.
Load and follow the `wiki-query` skill — search ALL wiki and raw folders.

!`find docs/specs -name "*$ARGUMENTS*" 2>/dev/null`
!`find knowledge/raw/build-logs -name "*$ARGUMENTS*" 2>/dev/null`

**Read all matching files into context.** The plan and spec are the source of truth — load their full content. If a build log already exists for this issue, load it too — you're resuming, not starting fresh.

Check `knowledge/wiki/patterns/`, `knowledge/wiki/lessons/`, and `knowledge/wiki/tools/` for relevant patterns and prior lessons.

---

## Phase 2: Branch Setup

Load and follow the `git-workflow` skill.

### Check for existing branch

!`git branch --list "feat/$ARGUMENTS-*" "fix/$ARGUMENTS-*" "chore/$ARGUMENTS-*" "refactor/$ARGUMENTS-*"`

**If a branch exists for this issue:**
- Switch to it: `git checkout {branch-name}`
- Verify it's up to date with main: `git fetch origin && git rebase origin/main`
- Resume work — the build log should tell you where you left off

**If no branch exists:**
- Confirm with user: which type prefix? (feat/fix/chore/refactor)
- Confirm slug: short kebab-case description (e.g., `lot-images`)
- Create from clean main:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b {type}/{issue}-{slug}
  ```

### Update issue label

Via GitHub MCP, update the issue label from `ready-for-dev` to `in-progress`. This signals to anyone looking at the issue tracker that work has started.

### Create or load build log

Build log path: `knowledge/raw/build-logs/{issue}_{slug}.md`

If it exists, append a new section with today's date. If not, create it using the format from the `workflow-methodology` skill.

---

## Phase 3: Migration Safety Gate

**Only if the plan includes database changes.**

Load and follow the `migration-safety` skill.

Pre-flight checklist:
- [ ] Migration file planned with descriptive name
- [ ] RLS enabled on all new tables (load `nido-multi-tenancy` skill)
- [ ] tenant_id on all user-facing tables
- [ ] Rollback script designed
- [ ] Zero-downtime compatible

**Do NOT proceed to Phase 4 without migration safety cleared.**

---

## Phase 4: Build with Checkpoints

This is the core phase. The plan from `/plan` defines task groups and manual test checkpoints. Work group by group, with debug loops per task and manual verification between groups.

### Group execution structure

For each task group in the plan:

#### Step 1: Execute tasks in the group

For each task in the current group:

1. **Dispatch to the relevant specialist** via Task tool:
   - Database/migration → `@database-architect`
   - Server actions, API, server logic → `@backend-specialist`
   - React components, UI, styling → `@frontend-specialist`

   Pass: task description from the plan, file targets, wiki patterns to reference, the build log path.
   Pass: Before each task, load and follow the assume-nothing skill. Verify the file targets in the plan match actual codebase state.

2. **Run quality gate** after the specialist completes:
   ```bash
   npm run lint
   npm run type-check
   ```
   Plus scoped tests for the changed files if applicable.

3. **If quality gate fails → enter debug loop** (see Phase 5 below). Otherwise continue to step 4.

4. **Commit incrementally** with conventional commit format:
   ```bash
   git add {files}
   git commit -m "{type}({scope}): {what changed}"
   ```

5. **Update build log** with:
   - What was built
   - Files modified
   - Wiki references used
   - Any decisions made
   - Iteration count (1 if no debug loop ran)

6. Move to next task in the group. **Do not skip ahead to other groups.**

#### Step 2: Manual test checkpoint

After all tasks in the group complete, **stop and present the checkpoint to the user**:

```markdown
## Checkpoint {N}: {checkpoint name from plan}

### What was built
- {summary of tasks completed}
- {files changed}

### What to test
{Specific instructions from the plan checkpoint, e.g.:}
1. Start dev server: `npm run dev`
2. Visit: `http://localhost:3000/t/ecovilla-san-mateo/dashboard/...`
3. Verify:
   - [ ] {specific behavior 1}
   - [ ] {specific behavior 2}
4. Edge cases to try:
   - [ ] {edge case 1}
   - [ ] {edge case 2}

### What "pass" looks like
{From the plan checkpoint}

**Reply with:**
- ✅ "pass" → I'll continue to the next group
- ❌ "fail: {what's wrong}" → I'll enter debug loop
- ⏸ "pause" → I'll save state and stop, you can resume later
```

**Wait for user response before continuing.**

#### Step 3: Handle checkpoint result

- **Pass** → Mark this checkpoint complete in the build log, move to next group
- **Fail** → Capture what failed, enter Phase 5 debug loop with the failure context
- **Pause** → Update build log with current state, mark workflow paused, exit cleanly

### After all groups complete

All tasks done, all checkpoints passed. Proceed to Phase 6 (Verification).

---

## Phase 5: Debug Loop (when verification fails)

This phase is invoked when a quality gate fails OR a manual checkpoint fails. It's not run linearly — it's a loop entered from Phase 4.

Load and follow the `systematic-debugging` skill. The skill has the full debug loop protocol — this command just orchestrates it.

### Loop iterations

**Iteration 1:**
1. Capture failure context: error message, what was expected, what happened
2. Apply Phases 1-3 of the debugging skill (reproduce, isolate, understand)
3. Dispatch to relevant specialist with: failure context + suspected root cause + suggested fix
4. Specialist applies fix
5. Re-run the verification that failed
6. If pass → log iteration, return to Phase 4 group execution, continue
7. If fail → Iteration 2

**Iteration 2:** Same structure, reference what was tried in Iteration 1.

**Iteration 3:** Last automatic iteration. If this fails, escalate to user.

### Escalation after 3 iterations

Use the escalation template from the `systematic-debugging` skill. Stop the workflow, present options to the user, wait for direction.

### Build log per iteration

After EACH iteration (pass or fail), update the build log:

```markdown
### Debug Iteration {N} — {YYYY-MM-DD HH:MM}
**Failure:** {what failed}
**Hypothesis:** {what we thought was wrong}
**Fix attempted:** {what was changed}
**Result:** {pass | fail with new error}
**Specialist involved:** {@agent}
```

This is critical — if you escalate, the user needs to see the full iteration history.

---

## Phase 6: Final Verification

Load and follow the `verification-before-completion` skill.

- [ ] Original problem from spec is actually solved
- [ ] Quality gate passes: !`npm run lint 2>&1 | tail -3` and !`npm run type-check 2>&1 | tail -3`
- [ ] Build succeeds: `npm run build`
- [ ] All manual checkpoints passed
- [ ] No regressions in adjacent functionality
- [ ] Build log is complete and current

**If any item fails, return to Phase 5 debug loop.**

---

## Phase 7: Draft PR

Create draft PR via GitHub MCP:

```bash
gh pr create --draft \
  --title "{type}: {feature description}" \
  --body "Closes #$ARGUMENTS

## Summary
{what this PR does}

## Spec
\`docs/specs/{feature}/spec.md\`

## Plan
\`docs/specs/{feature}/plan.md\`

## Changes
- {change 1}
- {change 2}

## Testing
{Manual checkpoints completed, automated tests added}

## Build Log
\`knowledge/raw/build-logs/{issue}_{slug}.md\`

## Notes
- {decisions worth highlighting}
- {known limitations}"
```

**Critical:** the `Closes #$ARGUMENTS` line auto-closes the issue when the PR merges. Do not omit it.

**Leave as draft.** Marking ready-for-review and merging is `/ship`'s job.

---

## Phase 8: Closeout

### Refactoring completion

If any refactoring items from the plan were completed during this implementation, follow the `refactoring-opportunity-capture` skill's Completion Protocol:

1. Update the file's frontmatter: `status: completed`, `updated: YYYY-MM-DD`
2. Rename: `YYYY-MM-DD_{slug}.md` → `YYYY-MM-DD_{slug}_completed.md`
3. Move to `knowledge/raw/refactoring/completed/`

### Update issue

Via GitHub MCP, update the issue:
- Remove label `in-progress`
- Add label `in-review`
- Comment with link to the draft PR

### Standard closeout skills

- `auto-doc-update` — check changed files for doc impacts
- `refactoring-opportunity-capture` — document NEW opportunities found during build (don't fix in-PR unless ≤10 lines and clearly related)
- `workflow-recommender` — likely recommends `/ship`

### Final build log entry

Append a closeout entry with:
- Total tasks completed
- Total checkpoints passed
- Total debug iterations across all tasks
- PR URL
- Workflow state: complete | paused

Mark all TodoWrite items completed.