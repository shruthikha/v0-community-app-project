---
name: retro
description: Weekly retrospective. Reads recent worklogs, surfaces patterns, compiles lessons to wiki, reviews refactoring backlog, proposes next actions.
agent: orchestrator
model: openrouter/qwen/qwen3.6-plus
temperature: 0.3
---

# Command: /retro

Weekly retrospective. Cross-domain synthesis of recent work, patterns, and process health.

Period: $ARGUMENTS

---

## Phase 0: Socratic Gate

**Create a TodoWrite list now with one item per phase of this command. Mark Phase 0 as in_progress.**

Load and follow the `socratic-gate` skill. Light gate.

**Key questions:**

1. **Time period?** — Last week (default), last N weeks, or custom range?
2. **Focus?** — General retro, specific feature retro, or process improvement?
3. **Any specific concerns?** — Problem areas noticed?

**Wait for user response before proceeding.**

---

## Phase 1: Gather Data

Load and follow the `workflow-methodology` skill for standard protocols.
Load and follow the `wiki-query` skill — search ALL wiki and raw folders.

### Recent work — scan ALL relevant raw folders
!`ls -la knowledge/raw/build-logs/ 2>/dev/null | tail -10`

Read build logs from the time period. Extract: key decisions, blockers, completed items.

### Refactoring backlog
!`ls knowledge/raw/refactoring/ 2>/dev/null`

Read all items. Flag anything older than 30 days. Update status in frontmatter for resolved items:
- `status: completed` → move to `knowledge/raw/refactoring/completed/`
- `status: wont-fix` → move to archive with reason

### Requirements status
!`ls knowledge/raw/requirements/ 2>/dev/null`

Check for active requirements — are any stale or completed?

### GitHub activity
Check via GitHub MCP: PRs merged, issues created/closed in period.

### Deferred items
!`cat knowledge/raw/followups.md 2>/dev/null`

Review items deferred by `workflow-recommender` in previous closeouts.

### Audit artifacts since last retro
!`ls -t knowledge/raw/audits/retros/retro_*.md 2>/dev/null | head -1`
!`ls -t knowledge/raw/audits/audit_*.md 2>/dev/null | head -n 10`

Ingest audit reports newer than the most recent retro. Extract: key lessons, reusable patterns, concept updates, documentation gap candidates.

---

## Phase 2: Pattern Analysis

### What's working well
Identify patterns from build logs: fast decisions, clean implementations, effective skill usage.

### Challenges
Identify recurring problems: blockers, rework, confusion, missed edge cases.

### Undocumented decisions
Scan build logs for decision patterns ("we decided to", "chose X over Y", "tradeoff"). Flag any that should become ADRs.

### Documentation gaps
Check `knowledge/wiki/documentation-gaps.md` — are gaps growing or shrinking?

---

## Phase 3: Wiki Compile

This is the critical step — fold learnings into the wiki.

### New lessons
For each debugging insight or post-incident learning found in build logs:
- Add to `knowledge/wiki/lessons/{topic}.md`

### New patterns
For each reusable code pattern discovered:
- Add to `knowledge/wiki/patterns/{topic}.md`

### Updated concepts
If domain understanding evolved:
- Update `knowledge/wiki/concepts/{topic}.md`

---

## Phase 4: Write Retro Report

Write to `knowledge/raw/audits/retros/retro_YYYY-MM-DD.md`:

```markdown
# Retro: {Date Range}

**Date**: YYYY-MM-DD
**Focus**: {general | feature | process}

## Summary
PRs merged: {n} | Features shipped: {n} | Build logs reviewed: {n}

## Working Well
- {pattern with evidence}

## Challenges
- {issue with evidence}

## Decisions to Document
| Decision | Context | → /adr? |
|----------|---------|---------|

## Refactoring Backlog Review
| Item | Age | Action |
|------|-----|--------|

## Documentation Gaps
| Gap | Priority |
|-----|----------|

## Wiki Updates Made
- {what was compiled}

## Recommendations
### Immediate
- [ ] {action}
### This Sprint
- [ ] {action}
```

---

## Phase 5: AGENTS.md Check

If retro reveals agent or skill changes needed:
- Note in report with recommendation
- User decides whether to update

---

## Phase 6: Closeout

Load and follow these skills:
- `auto-doc-update`
- `workflow-recommender` — will NOT recommend `/retro` since we just ran it