---
name: socratic-gate
description: Enforces structured clarification before substantial work begins. Use at the start of any workflow phase that writes artifacts or makes code changes. Prevents assumptions, surfaces ambiguity, and ensures alignment before execution.
---

# Socratic Gate

Before writing code, specs, or artifacts, STOP and clarify. This skill prevents the most expensive category of mistake: building the wrong thing.

## When to Fire

- Start of any `/explore`, `/spec`, `/plan`, `/implement`, or `/ship` workflow
- Before any multi-file code change
- When requirements are ambiguous or incomplete
- When the user says something vague ("make it better", "fix the auth", "add a feature")

## The Six Questions

Adapted from gstack's office-hours framework and Superpowers' brainstorming pattern:

### 1. What problem are we solving?
Not "what feature" — what *pain point* for what *person*.

### 2. Who has this problem?
Persona: resident, admin, tenant admin, Río user, developer?

### 3. What have we already tried or decided?
Check wiki (`knowledge/wiki/`), build logs, existing specs. Don't re-litigate settled decisions.

### 4. What does success look like?
Measurable. "Users can X" not "it works." Include acceptance criteria if possible.

### 5. What are the constraints?
Technical (stack, performance budget), timeline, scope (MVP vs full), dependencies.

### 6. What are we explicitly NOT doing?
Scope boundaries prevent creep. Document the "Won't Have" list.

## Output Format

Before proceeding past the gate, produce:

```markdown
## Socratic Gate: [Topic]

**Problem:** [1-2 sentences]
**For:** [Persona]
**Success:** [Measurable outcome]
**Constraints:** [Key limits]
**Out of scope:** [What we're NOT doing]
**Prior context:** [Wiki/build log references, if any]

**Proceed?** [Yes / Need more info on: ___]
```

## Escape Hatch

If the user explicitly says "skip clarification" or passes `--yolo`, log that the gate was skipped and proceed. But log it — the build log should note "Socratic gate skipped by user request."

## Presenting Design in Digestible Chunks

When the gate reveals a complex scope, present your understanding in sections — not a wall of text. Each section should be short enough to read in 30 seconds. Wait for approval on each section before moving to the next. (Pattern from Superpowers brainstorming.)

## Anti-Patterns

- ❌ Asking 15 questions before doing anything (pick the 2-3 most critical)
- ❌ Asking questions the wiki already answers (check first)
- ❌ Asking questions when the task is clearly scoped ("add an index to the events table" doesn't need a Socratic gate)
- ❌ Using the gate to stall — if 3 of 6 questions are clear, ask only the unclear ones
