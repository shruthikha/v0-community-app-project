---
name: brainstorm-before-code
description: Structured design refinement before writing code. Explores alternatives, presents design in digestible sections, gets approval before implementation. Use at the start of any feature that involves design decisions. Hybrid of Superpowers brainstorming and gstack office-hours.
---

# Brainstorm Before Code

Don't jump to implementation. Refine the idea first, explore alternatives, then commit.

## When to Use

- Starting a new feature or significant change
- When `/spec` or `/plan` begins
- When the user describes something open-ended ("I want to add notifications")
- After the Socratic Gate has established the problem

## When Run as a Subagent

If you are running as a dispatched subagent (you have no direct user access), do NOT pause for section-by-section approval. Instead:

1. Complete all design work end-to-end in one pass
2. Cover all dimensions: data model, API surface, UI flow, edge cases
3. Identify any open questions or decisions that need user input
4. Return a single consolidated proposal with the open questions appended at the end

The dispatching agent (orchestrator) will present your work to the user. Multiple returns from a subagent waste tokens and create the appearance of indecision.

Section-by-section approval is for primary-context conversations where the user is present. Subagents batch.

## The Process

### Step 1: Understand (Don't Solve Yet)

Ask the 2-3 most critical questions from the Socratic Gate. Check wiki for prior art. Reference existing patterns, build logs, or PRDs that relate.

### Step 2: Explore Alternatives

Generate 2-3 distinct approaches. For each:

```markdown
### Option A: [Name]
**Approach:** [How it works]
**Pros:** [Benefits]
**Cons:** [Drawbacks]
**Effort:** [S/M/L]
**Wiki precedent:** [Related pattern or "None"]
```

Don't present options that are clearly wrong just to have three. If there's one obvious approach, say so and explain why alternatives are worse.

### Step 3: Present in Sections

Break the design into chunks short enough to read in 30 seconds each. Present one section, wait for approval, then move to the next.

Pattern from Superpowers: "An enthusiastic junior engineer with poor taste, no judgment, no project context, and an aversion to testing could follow this."

Sections might be:
1. **Data model** — what entities, what fields, what relationships
2. **API surface** — what endpoints or server actions
3. **UI flow** — what screens, what interactions
4. **Edge cases** — what happens when things go wrong
5. **Migration/rollout** — how do we get from here to there

### Step 4: Get Explicit Sign-Off

Before writing any code:

```markdown
## Design Summary: [Feature]

### Agreed Approach
[1-2 sentence summary]

### Key Decisions
1. [Decision 1]
2. [Decision 2]

### Out of Scope
- [What we're NOT building]

**Ready to proceed to implementation plan?**
```

## Bilingual Consideration

For user-facing features, note if content needs Spanish/English support. Reference `docs/dev/tone-of-voice.md` for bilingual requirements.

## Anti-Patterns

- ❌ Presenting a fully-built solution as if brainstorming ("I made this, approve it?")
- ❌ Analysis paralysis — 3 options max, then commit
- ❌ Ignoring wiki precedent — check before proposing novel approaches
- ❌ Skipping edge cases — they're part of the design, not an afterthought
