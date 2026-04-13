---
name: refactoring-opportunity-capture
description: Captures refactoring opportunities discovered while reading or writing code. Agents note tech debt, code smells, and improvement ideas without stopping their current work. Creates standalone files in knowledge/raw/refactoring/.
---

# Refactoring Opportunity Capture

While working on features, agents inevitably discover code that should be improved but isn't related to the current task. Capture it, don't fix it in place (unless it's ≤10 lines and clearly related).

## When to Use

- During any code-reading or code-writing task
- When an agent encounters tech debt, code smells, or improvement opportunities
- During `/implement` and `/ship` workflows

## The Rule

**Capture always. Fix in-PR only if ≤10 lines and clearly related to the current task.**

Everything else gets logged for future work.

## How to Capture

Create a standalone file in `knowledge/raw/refactoring/YYYY-MM-DD_{slug}.md`:

```markdown
---
title: {Short Description}
status: open
created: YYYY-MM-DD
updated: YYYY-MM-DD
effort: small | medium | large
category: performance | security | readability | architecture | tech-debt
module: path/to/affected/code
---

# {Short Description}

## Finding
{What's wrong and what should change}

## Files
- `path/to/file.ts`

## Suggested fix
{How to address it}
```

Each opportunity = one file. This makes it easy for `/retro` and `workflow-recommender` to list, filter, and update status.

## Categories

| Category | Examples |
|----------|---------|
| **Performance** | N+1 query, missing index, unnecessary re-render, large bundle |
| **Security** | Hardcoded value, missing validation, RLS gap |
| **Readability** | Complex function, unclear naming, missing types |
| **Architecture** | Tight coupling, circular dependency, wrong abstraction |
| **Tech Debt** | TODO comment, deprecated API, copied code |

## Heuristics: When to Fix vs. Capture

| Situation | Action |
|-----------|--------|
| Renaming a variable in the file you're editing | Fix in-PR |
| Adding a missing type annotation you just discovered | Fix in-PR |
| Finding N+1 query in unrelated module | Capture |
| Discovering a security gap in auth code you're not touching | Capture (and flag as 🔴) |
| Seeing duplicated code across 5 files | Capture (L effort) |

## Weekly Review

The `/retro` workflow and `workflow-recommender` skill both scan `knowledge/raw/refactoring/`:
- Items older than 30 days get flagged for review
- Items marked 🔴 (security, data loss risk) get escalated

## Continuous Refactoring (During Planning)

The `/plan` command scans open refactoring items and matches them against planned file paths. When overlap is found, the user decides which items to fold into the sprint — keeping refactoring incremental rather than a separate large effort.

This means: if you're already touching `lib/auth/validation.ts` for a feature, and there's an open refactoring item for that file, it gets offered as an in-scope addition. Small effort items that piggyback on planned work are nearly free.

## Completion Protocol

When a refactoring item is completed (during `/implement` or any other workflow):

1. **Update frontmatter** in the file:
   ```yaml
   status: completed
   updated: YYYY-MM-DD
   completed_in: "{feature name or PR number}"
   ```

2. **Rename the file** with `_completed` suffix:
   ```
   YYYY-MM-DD_{slug}.md → YYYY-MM-DD_{slug}_completed.md
   ```

3. **Move to completed folder**:
   ```
   knowledge/raw/refactoring/completed/
   ```

Create `knowledge/raw/refactoring/completed/` if it doesn't exist.

### Won't-Fix Protocol

For items that won't be addressed:

1. **Update frontmatter**:
   ```yaml
   status: wont-fix
   updated: YYYY-MM-DD
   reason: "{why this won't be fixed}"
   ```

2. **Rename**: `YYYY-MM-DD_{slug}.md` → `YYYY-MM-DD_{slug}_wontfix.md`

3. **Move to completed folder** (same location — it's an archive for all resolved items)