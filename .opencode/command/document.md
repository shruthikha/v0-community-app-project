---
name: document
description: On-demand documentation project. Two modes — --technical (developer docs from code) or --user (resident/admin guides from features). For major doc efforts only.
agent: product
model: opencode/minimax-m2.5-free
temperature: 0.3
---

# Command: /document

Major documentation project. Routine doc updates happen automatically via workflow closeouts — this command is for dedicated documentation efforts.

Documenting: $ARGUMENTS

---

## Phase 0: Socratic Gate

**Create a TodoWrite list now with one item per phase of this command. Mark Phase 0 as in_progress.**

Load and follow the `socratic-gate` skill.

**Key questions:**

1. **What are we documenting?** — New feature, API, guide, or updating existing docs?
2. **Audience?** — Technical (developers) or user (residents/admins)?
3. **Mode?** — `--technical` (from code) or `--user` (from features)
4. **Scope?** — What's included, what's not?
5. **Any existing docs to reference?** — Related docs to update or replace?

**Wait for user response before proceeding.**

---

## Phase 1: Context

Load and follow the `workflow-methodology` skill for standard protocols.
Load and follow the `wiki-query` skill — search ALL wiki and raw folders.

### For --technical
- Read source code for the feature
- Check existing docs in `docs/dev/` and `docs-site/docs/developers/`
- Check wiki patterns relevant to the code
- Use Context7 MCP for current framework docs if needed

### For --user
- Read specs in `docs/specs/{feature}/`
- Check existing user guides in `docs/user/` and `docs-site/docs/guides/`
- Check `knowledge/wiki/design/` for brand context
- Load and follow the `tone-of-voice-compliance` skill — warm, clear, bilingual (English + Spanish)

---

## Phase 2: Write Documentation

### Technical format

```markdown
---
title: {Title}
description: {One-line description}
---

# {Title}

## Overview
{1-2 sentence summary}

## API / Usage
{Endpoints, server actions, code examples}

## Examples
{Working code samples}

## Related
- {Links to related docs}
```

Write to: `docs/dev/` or `docs-site/docs/developers/`

### User format

```markdown
---
title: {Title}
description: {One-liner}
---

# {Title}

## What you'll learn
{Learning objectives}

## Why it matters
{Problem this solves — why before how}

## Step-by-step
### Step 1: {action}
{Description with screenshot placeholders if UI}

## Common questions
**Q: {question}**
A: {answer}

## Related
- {Links}
```

Write to: `docs/user/` or `docs-site/docs/guides/`

---

## Phase 3: Cross-Reference

- Update relevant table of contents and index pages
- Link to/from related docs
- Update wiki patterns if this creates new conventions

---

## Phase 4: Closeout

Load and follow these skills:
- `auto-doc-update`
- `refactoring-opportunity-capture`
- `workflow-recommender`