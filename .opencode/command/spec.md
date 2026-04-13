---
name: spec
description: Feature specification with requirements, design, and tasks. Updates issue labels to ready-for-plan on completion. Outputs to docs/specs/.
temperature: 0.4
---

# Command: /spec

Define a feature specification. Outputs to `docs/specs/<feature>/spec.md`. Creates or updates GitHub issue with `ready-for-plan` label.

Feature: $ARGUMENTS

---

## Phase 0: Socratic Gate

**Create a TodoWrite list now with one item per phase of this command. Mark Phase 0 as in_progress.**

Load and follow the `socratic-gate` skill.

**Mandatory questions:**

1. **What are we building?** — New feature, enhancement, or fix?
2. **Who is this for?** — Residents, admins, developers?
3. **What problem does this solve?** — Why do users need this? Current workaround?
4. **What's in scope / out of scope?** — MVP must-haves vs. future work?

**If needed:**
5. **Constraints?** — Timeline, technical limits, dependencies?
6. **How do we know it's done?** — Key acceptance criteria with metrics ("Load < 200ms")
7. **Existing issue?** — If there's already a GitHub issue for this, what's the number?

**Wait for user response before proceeding.**

---

## Phase 1: Context

Load and follow the `workflow-methodology` skill for standard protocols.
Load and follow the `wiki-query` skill — search ALL wiki and raw folders.

!`find knowledge/raw/research -name "*$ARGUMENTS*" 2>/dev/null`
!`find knowledge/raw/build-logs -name "*$ARGUMENTS*" 2>/dev/null`
!`find docs/specs -name "*$ARGUMENTS*" 2>/dev/null`

**Read any matching files above into context before proceeding.** Don't just list them — load the content.

Also check broadly for related context:
- Patterns in `knowledge/wiki/patterns/`
- Past feature decisions in `knowledge/wiki/concepts/`
- Prior PRDs in `knowledge/raw/prds-archive/`
- Related ideas in `knowledge/raw/ideas-archive/`

---

## Phase 2: Design Refinement

**Dispatch to `@product` via Task tool.** Pass:
- The feature description and scope from Phase 0
- Any prior context loaded in Phase 1 (research files, related specs, wiki references)
- Instructions to load the `brainstorm-before-code` skill

**Important: Tell the product agent to complete ALL design work in a single pass and return one consolidated proposal with any open questions at the end.** Do NOT request section-by-section approval from within the subagent — the subagent has no user to approve sections, and fragmenting work into multiple returns wastes orchestrator round-trips.

The product agent will:
- Complete all design work end-to-end in one pass
- Cover: data model, API surface, UI flow, edge cases
- Note bilingual requirements (Spanish/English) if user-facing
- Return ONE consolidated proposal with any open questions appended at the end

The orchestrator presents the consolidated proposal to the user for approval, then uses the approved design in Phase 3.

---

## Phase 3: Requirements

**Dispatch to `@product` via Task tool** to write the user stories, acceptance criteria, and edge cases.

Pass: the refined design from Phase 2, the feature scope from Phase 0, and the format below. Tell the product agent to return all requirements in one pass.

The product agent returns the requirements section. The orchestrator includes it in the final spec written in Phase 6.

### Required format

#### User Stories (Gherkin)

For each story:
> **As a** [persona], **I want to** [action], **so that** [benefit].
>
> **Given** [context], **When** [action], **Then** [outcome].

#### Acceptance Criteria

| Criterion | Metric | How to verify |
|-----------|--------|---------------|
| Primary | What success looks like | Test approach |
| Edge case | Error handling | Test approach |

#### Edge Cases

Document: network failures, invalid input, permission denied, concurrent conflicts, empty states.

---

## Phase 4: Technical Design

### Architecture design

**Dispatch to `@solution-architect` via Task tool** to draft the technical architecture.

Pass: the refined design from Phase 2, the requirements from Phase 3, and ask for:

```markdown
### Architecture
**Data model**: {schema changes, new tables, relationships}
**API design**: {server actions, API routes, request/response shapes}
**Security**: {auth checks, RLS policies, Zod validation, sensitive data handling}
**Integration points**: {what connects to what, external services, internal modules}
```

The solution-architect returns the architecture section. Reference relevant wiki patterns (`knowledge/wiki/patterns/`) and tool docs (`knowledge/wiki/tools/`).

### UX design (if user-facing)

**Dispatch to `@frontend-specialist` via Task tool** for any UX components.

Pass: the architecture design above, the requirements from Phase 3, and ask for:
- Screens and components needed
- User flow (entry points, states, transitions)
- Mobile responsiveness considerations
- Bilingual content requirements (Spanish + English)
- Brand compliance via `nido-design-system` skill

The frontend-specialist returns the UX section. Skip this dispatch entirely for backend-only or infrastructure features.

### Architecture review

**Dispatch to `@solution-architect` via Task tool a second time** for cross-cutting validation when the design has any of:
- New tables or schema changes
- New external services or integrations
- Security-sensitive flows (auth, payments, PII)
- Multi-tenancy implications
- Breaking changes to existing APIs

Pass: the complete technical design (architecture + UX), and ask the architect to specifically check for: cross-cutting concerns missed, multi-tenancy gaps, security blind spots, and pattern compliance against the wiki.

For straightforward features (UI-only changes, additive columns, existing patterns), skip this review dispatch.

---

## Phase 5: Tasks

For each task in the breakdown, **dispatch to the relevant specialist via Task tool** for estimation and feasibility check:
- DB tasks → `@database-architect`
- Backend tasks → `@backend-specialist`
- Frontend tasks → `@frontend-specialist`
- Test tasks → `@qa-engineer`

Pass: the task description, the spec context, and ask for effort estimate + any concerns.

Synthesize their estimates into the task table. If a specialist flags concerns, include them in the spec's "Risks" section.

---

## Phase 6: Write Spec

Create `docs/specs/{feature}/spec.md` with all content from phases 2-5:

```markdown
---
title: {Feature Name}
status: draft
created: YYYY-MM-DD
issue: #{issue-number}
---

# {Feature Name}

## Problem Statement
{from Phase 0}

## Prior Work
{from Phase 1}

## Requirements
{from Phase 3}

## Design
{from Phase 4}

## Tasks
{from Phase 5}

## Risks
{flagged concerns from specialists}
```

Set status: `draft`. Create directory if needed.

---

## Phase 7: GitHub Issue

### If existing issue (from Phase 0)

Update the existing issue via GitHub MCP:
- Add label `ready-for-plan` (remove `spec` if present)
- Comment with: spec file path, summary of design approach, link to spec
- Update issue body if it's still a stub

### If no existing issue

Create issue via GitHub MCP:

**Title**: `{Feature Name}`
**Labels**: `ready-for-plan`, `{priority}`
**Body**:
```markdown
## Summary
{Problem statement}

## Scope
- IN: {in-scope items}
- OUT: {out-of-scope items}

## Spec
`docs/specs/{feature}/spec.md`

## Status
- [x] Spec drafted
- [ ] Plan created (`/plan`)
- [ ] Implementation (`/implement`)
- [ ] Shipped (`/ship`)
```

---

## Phase 8: Closeout

Load and follow these skills:
- `auto-doc-update` — check for doc impacts
- `refactoring-opportunity-capture` — note any opportunities found
- `workflow-recommender` — recommend next (likely `/plan`)

Mark all TodoWrite items completed.