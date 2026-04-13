---
name: wiki-query
description: How to query the Nido knowledge layer — both compiled wiki and raw sources. Search ALL subfolders for relevant content, not just specific ones. Use before generating code, making design decisions, writing specs, or any substantial work.
---

# Wiki Query

Nido's knowledge lives in two trees. Search BOTH broadly — don't cherry-pick folders.

## The Two Trees

### `knowledge/wiki/` — Compiled, reusable knowledge

Curated and maintained. The first place to check.

| Folder | What's in it | Check when... |
|--------|-------------|---------------|
| `concepts/` | Domain entities, feature definitions, business rules | Defining features, writing specs, understanding the domain |
| `design/` | Brand colors, typography, spacing, design system | Building UI, reviewing designs, writing user-facing content |
| `domains/engineering/` | Tech stack choices, build config rationale | Making technology decisions, understanding why we use X |
| `domains/product/` | Feature categories, sprint mapping, roadmap context | Planning sprints, prioritizing work, understanding product direction |
| `lessons/` | Debugging insights, post-incident learnings, mistakes to avoid | Writing code (avoid past mistakes), debugging, reviewing |
| `patterns/` | Reusable code patterns, conventions, architectural decisions | Writing code (follow established patterns), reviewing code |
| `tools/` | Tool-specific knowledge (Supabase, Mastra, OpenCode, GitHub) | Using any tool in our stack, configuring services |
| `_index.md` | Auto-maintained table of contents | Navigating the wiki, finding what exists |
| `documentation-gaps.md` | Living list of missing documentation | Identifying what needs to be documented |

### `knowledge/raw/` — Uncompiled source material

Raw inputs that feed wiki compilation. Richer detail, less curated.

| Folder | What's in it | Check when... |
|--------|-------------|---------------|
| `build-logs/` | 72+ sprint worklogs with implementation details, decisions | Understanding how something was built, finding prior decisions |
| `audits/` | Codebase audit reports, retro reports | Understanding code quality, past findings, retro outcomes |
| `refactoring/` | Individual refactoring opportunity files with status | Reviewing tech debt, finding improvement opportunities |
| `prds-archive/` | 13 past product requirement documents | Understanding original feature intent, historical requirements |
| `requirements/` | Active requirement files | Understanding current requirements in progress |
| `requirements-archive/` | 64 archived requirement files | Historical requirements context |
| `ideas-archive/` | 7 idea exploration files | Past brainstorms, explored concepts |
| `research/` | External research, web clippings, framework evaluations | Technology decisions, comparing approaches |
| `observations-archive/` | Tech debt notes, scattered observations | Historical context on code quality concerns |
| `architecture-archive/` | Original architecture documents | Understanding initial system design decisions |
| `coderabbit/` | Compiled CodeRabbit findings from PR history | Understanding recurring code review patterns |
| `userjot-drafts/` | Draft user-facing announcements | Checking what's been announced or drafted |
| `meetings/` | Transcripts, notes (future use) | Meeting context |
| `experiments/` | Auto-research outputs (Phase 9+) | Experimental findings |
| `followups.md` | Deferred workflow items from recommender | Reviewing what was postponed |
| `_manifest.md` | Inventory of imported content | Understanding what raw material exists |

## How to Query

### The rule: search broadly, filter by relevance.

**Do NOT check only `patterns/` and `lessons/`.** Every task potentially touches multiple folders. Use this process:

1. **Start with wiki `_index.md`** — scan the TOC for anything related to your task
2. **Grep across all wiki folders** for keywords related to your work:
   ```
   grep -r "keyword" knowledge/wiki/ --include="*.md" -l
   ```
3. **If wiki doesn't have enough context**, search raw:
   ```
   grep -r "keyword" knowledge/raw/ --include="*.md" -l
   ```
4. **Read the most relevant files** — don't try to read everything, but don't limit yourself to one folder

### Quick relevance guide by task type

| Task | Primary wiki folders | Also check raw |
|------|---------------------|----------------|
| Writing code | patterns/, lessons/, tools/ | build-logs/, refactoring/ |
| Writing specs | concepts/, domains/product/ | prds-archive/, requirements/, ideas-archive/ |
| Architecture decisions | patterns/, tools/, domains/engineering/ | architecture-archive/, audits/, research/ |
| UI/design work | design/, patterns/ | research/ |
| Debugging | lessons/, patterns/, tools/ | build-logs/, audits/ |
| Security review | patterns/, lessons/, tools/ | audits/, coderabbit/ |
| Retrospective | ALL wiki folders | build-logs/, audits/, refactoring/, requirements/, followups.md |
| Documentation | ALL wiki folders | ALL raw folders |

## Citing Wiki in Output

When your work references wiki knowledge, cite the path:

```markdown
**Wiki reference:** `knowledge/wiki/patterns/supabase-multi-tenancy.md` — tenant_id mandate
```

## When Nothing Is Found

1. Proceed with your best judgment
2. Note the gap in your build log: "No wiki entry for [topic] — consider adding"
3. The `workflow-recommender` skill will surface gaps at closeout