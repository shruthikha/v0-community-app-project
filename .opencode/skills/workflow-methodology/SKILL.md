---
name: workflow-methodology
description: Shared methodology for all Nido workflows. Knowledge checks (wiki + raw), build log management, output discipline, priority markers, deferred invocation, phase tracking, output confirmation. Load at the start of any command for consistent methodology.
---

# Workflow Methodology

Standard operating procedures for all Nido + Río workflows.

## Knowledge Check Protocol

Before any substantial work, search BOTH knowledge trees broadly:

1. **Load the `wiki-query` skill** and follow its full search process
2. Search `knowledge/wiki/` — ALL subfolders (concepts, design, domains, lessons, patterns, tools)
3. If wiki is insufficient, search `knowledge/raw/` — ALL subfolders (build-logs, audits, refactoring, prds-archive, requirements, research, etc.)
4. **Reference** matching entries in your output (cite file paths)
5. **Note gaps** — if you find nothing relevant, log: "No wiki entry for [topic] — consider adding"

**Do NOT cherry-pick folders.** The `wiki-query` skill has a relevance guide by task type — use it.

## Context Loading Discipline

When a workflow references a feature, issue, or topic by name (often via `$ARGUMENTS`), the agent MUST actually load the relevant content into context — not just list filenames.

**Wrong:**
```
!`ls knowledge/raw/build-logs/ | tail -5`
```
This shows the 5 most recent files alphabetically. If your topic isn't in those 5, the agent assumes nothing exists and proceeds blind.

**Right:**
```
!`find knowledge/raw/build-logs -name "*topic*" 2>/dev/null`
!`find docs/specs -name "*topic*" 2>/dev/null`
```
Then **read the matching files** with the read tool before proceeding. A directory listing is not context — file content is.

**The rule:** If a workflow needs to know about a feature, search by feature name across ALL relevant folders, then load matching file contents. Listing without reading = working blind.

## Build Log Protocol

For any task tied to a GitHub issue or feature:

1. **Check** `knowledge/raw/build-logs/` for existing log matching the issue/feature
2. **If no log exists** and work is non-trivial — ask user: "Should I create a build log?"
3. **Update log continuously** (see Continuous Build Log Updates below)
4. **Comment on GitHub issue** with progress summary linking to the build log

### Build Log Format

```markdown
# Build Log: {issue-number} — {Title}

## {YYYY-MM-DD HH:MM} — {Agent/Command}

### Phase: {current phase}

### What was done
- [Concrete action taken]

### Artifacts created/modified
- `path/to/file` — [what changed]

### Decisions made
- [Decision]: [Reasoning]

### Wiki references used
- `knowledge/wiki/patterns/xyz.md`

### Iteration count (if debug loop ran)
- {N}

### Next steps
- [ ] [Action item]
```

## Continuous Build Log Updates

The build log is the **conversation memory** for any multi-phase workflow. It must be updated continuously, not just at closeout. Specifically:

- **After each task completes** in `/implement` — what was built, what wiki references were used, any decisions
- **After each debug loop iteration** — what failed, what was tried, what worked or didn't (the `systematic-debugging` skill has the format)
- **After each manual test checkpoint** — what user verified, any issues found, whether the workflow continued or paused
- **At each phase transition** — phase completed, phase starting next
- **At closeout** — final summary with overall status

If the user comes back tomorrow to resume a paused workflow, the build log tells them exactly where things stopped, what was done, what's left, and what was learned. The build log is not a closeout artifact — it's a live working document.

**Anti-pattern:** Building 6 tasks, then writing one big build log entry at the end. By that point you've forgotten the per-task decisions and can't reconstruct the iteration history.

**Right pattern:** Update after each task or iteration, even if the entry is short. Five small entries beat one big one.

## Phase Tracking Discipline

For any workflow with 3+ phases, the agent MUST create a todo list at the start using the TodoWrite tool, with one item per phase from the command's phase structure.

**At the start of the workflow:**
- Create todos matching the command's phase headers (e.g., "Phase 0: Socratic Gate", "Phase 1: Context", "Phase 2: Explore")
- Mark Phase 0 as `in_progress`

**During the workflow:**
- Mark each phase `completed` when its outputs exist
- Mark the next phase `in_progress` before starting it
- If a phase is skipped, mark it `cancelled` with a one-line reason

**At review gates and completion points:**
- Reference the current todo state in your message: "We're at Phase 3 of 6 — Task Breakdown. Phases 0-2 complete."
- Don't repeat this every message, only at phase transitions, gate questions, and final completion

**At workflow completion:**
- All phases marked `completed` or `cancelled`
- Final message includes: "Workflow complete. Phases run: X/Y. Skipped: [list]."

## Output Discipline

Every workflow phase produces a **file artifact** — not just conversation text.

| Output type | Location |
|------------|----------|
| Build logs | `knowledge/raw/build-logs/` |
| Audit reports | `knowledge/raw/audits/` |
| Retro reports | `knowledge/raw/audits/retros/` |
| Refactoring opportunities | `knowledge/raw/refactoring/` |
| Specs and requirements | `docs/specs/` |
| Sprint plans | `docs/specs/sprints/` |
| Architecture decisions | `docs/dev/decisions/` |
| Documentation gaps | `knowledge/wiki/documentation-gaps.md` |
| Deferred followups | `knowledge/raw/followups.md` |
| User-facing release notes | `docs/user/releases/` |
| UserJot drafts | `knowledge/raw/userjot-drafts/` |

## Output Confirmation Discipline

Agents may freely create outputs that the current workflow phase explicitly defines (e.g., `/explore` writes to its designated research file, `/spec` writes to `docs/specs/{feature}/spec.md`).

**Before creating ANY additional file or artifact not explicitly described in the current command's instructions, the agent MUST ask the user.**

This includes:
- Creating a second research file when one already exists for the topic
- Splitting findings into multiple files instead of appending to the existing one
- Creating a refactoring opportunity file mid-workflow (vs. capturing inline first)
- Writing a separate ADR when a decision could go in the build log
- Creating any "summary" or "synthesis" file not requested

**The right question format:**

> "I found [X]. I can either:
> (a) append to the existing [file], or
> (b) create a new [file type] at [path].
> Which do you prefer?"

**Default to appending to existing artifacts** when relevant, rather than fragmenting context across multiple files. New files should be the exception, not the default.

This rule applies even when the agent thinks a new file would be cleaner — the user owns the artifact structure.

## Priority Markers

| Marker | Meaning | Examples |
|--------|---------|----------|
| 🔴 | **Blocker** — must fix before proceeding | Security vulnerability, data loss, breaking change |
| 🟡 | **Suggestion** — should fix | Missing tests, N+1 queries, unclear naming |
| 💭 | **Nice to have** — low priority | Style improvements, minor doc gaps |

## Deferred Invocation

When your work reveals the need for another agent:

- **Do NOT invoke the agent directly**
- **Report completion** with recommendations for the orchestrator
- **Note in build log**: "QA verification needed" or "Security review recommended"
- The orchestrator controls workflow sequencing

## CodeRabbit Awareness

Line-level syntax, style, and dependency scanning is handled by CodeRabbit on PRs. Focus on: architecture, domain logic, pattern compliance against wiki, cross-cutting concerns.