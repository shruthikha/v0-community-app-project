---
name: audit
description: Codebase review. Reads code in place, produces reports to knowledge/raw/audits/. Modes — top-level, module, cross-cutting, synthesis.
agent: orchestrator
model: openrouter/qwen/qwen3.6-plus
temperature: 0.3
---

# Command: /audit

Systematic codebase review. Read-only by default — produces reports, does NOT modify code unless explicitly asked.

Auditing: $ARGUMENTS

---

## Phase 0: Socratic Gate

**Create a TodoWrite list now with one item per phase of this command. Mark Phase 0 as in_progress.**

Load and follow the `socratic-gate` skill.

**Key questions:**

1. **Type?** — Top-level (whole codebase), module (specific path), cross-cutting (auth, data flow), or synthesis (combine prior audits)?
2. **Focus?** — Security, performance, code quality, understanding (architecture mapping) — select all that apply
3. **Depth?** — Quick scan (~30 min) or full analysis (~2 hours)?
4. **Known concerns?** — Specific areas of worry?

!`ls knowledge/raw/audits/ 2>/dev/null | tail -10`

**Wait for user response before proceeding.**

---

## Phase 1: Context

Load and follow the `workflow-methodology` skill for standard protocols.
Load and follow the `wiki-query` skill — search ALL wiki and raw folders for prior work.

Check prior audits, relevant wiki patterns, and recent specs. Document what prior work exists.

---

## Phase 2: Codebase Ingestion

### Top-level
Scan directory structure, map entry points (API routes, server actions, components), identify key modules.

### Module
Find module files via glob, trace dependencies (imports/exports), identify public APIs.

### Cross-cutting
Trace data flow end-to-end, identify patterns for the concern (auth enforcement, data validation, error handling).

**Dispatch specialists as needed** via Task tool. Reference the `agent-collaboration` skill for which agent handles which domain:
- Auth/security areas → `@security-auditor`
- Database/schemas → `@database-architect`
- API/server actions → `@backend-specialist`
- UI/components → `@frontend-specialist`
- Full system synthesis → `@solution-architect`

---

## Phase 3: Analysis

Run analysis for EACH selected focus:

**Security**: Findings with severity (CRITICAL/HIGH/MEDIUM/LOW), file paths, recommendations.
**Performance**: Bottlenecks, impact estimates, optimization suggestions.
**Code quality**: Maintainability issues, pattern inconsistencies, missing types.
**Understanding**: Architecture mapping — components, entry points, data flow, patterns used, dependencies. This maps how code works, not what's broken.

---

## Phase 4: Write Report

Write to `knowledge/raw/audits/audit_YYYY-MM-DD_{area}.md`:

```markdown
# Audit: {Area}

**Date**: YYYY-MM-DD
**Type**: {top-level | module | cross-cutting | synthesis}
**Focus**: {security, performance, quality, understanding}
**Scope**: {paths or areas}

## Context
{What and why}

## Prior Work
{From wiki-query}

## Findings

### Critical
| Finding | File | Recommendation |
|---------|------|---------------|

### High / Medium / Low
{Same format}

## Understanding Mapping (if selected)
{Components, entry points, data flow, patterns, dependencies}

## Recommendations
### Immediate
- [ ] {action}
### Future
- [ ] {action}
```

---

## Phase 5: Issues (if requested, always ask user first)

For critical findings, create GitHub issues via GitHub MCP:
**Title**: `[Audit] {finding}: {severity}`
**Labels**: `audit`, `{severity}`

---

## Phase 6: Closeout

Load and follow these skills:
- `refactoring-opportunity-capture` — create standalone files in `knowledge/raw/refactoring/` for each refactoring opportunity found
- `auto-doc-update`
- `workflow-recommender`