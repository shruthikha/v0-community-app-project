---
name: coderabbit-ingest
description: Reads CodeRabbit PR review comments via GitHub MCP and extracts patterns for wiki compilation. Use during /ship or as part of the Phase 9 compile loop.
---

# CodeRabbit Ingest

CodeRabbit reviews every PR for syntax, style, security, and dependency issues. This skill extracts recurring patterns from those reviews and feeds them into the wiki.

## When to Use

- During `/ship` workflow (read CodeRabbit comments on current PR)
- During Phase 9 `coderabbit-compile-loop` (batch processing of recent PRs)
- When `/retro` reviews recent PR feedback patterns

## Process

### Step 1: Read PR Comments via GitHub MCP

Use GitHub MCP to list review comments on the current or recent PRs:
- Filter for CodeRabbit comments (author: `coderabbitai[bot]` or similar)
- Focus on comments with severity markers or code suggestions

### Step 2: Classify Findings

| Category | Action |
|----------|--------|
| **Recurring pattern** (seen 3+ times across PRs) | → Extract to `knowledge/wiki/patterns/` |
| **New lesson** (one-time insight worth remembering) | → Extract to `knowledge/wiki/lessons/` |
| **Security finding** | → Flag for `security-auditor` review |
| **Style/formatting only** | → Skip (CodeRabbit handles this) |
| **False positive** | → Note for CodeRabbit config tuning |

### Step 3: File to Raw

Write extracted findings to `knowledge/raw/coderabbit/{YYYY-MM-DD}-findings.md`:

```markdown
# CodeRabbit Findings — {date}

## PRs Reviewed
- #{PR1}: {title}
- #{PR2}: {title}

## Patterns Extracted
### {Pattern Name}
- **Seen in:** PR #{X}, #{Y}, #{Z}
- **Issue:** {What CodeRabbit flagged}
- **Fix pattern:** {The correct approach}
- **Wiki target:** `knowledge/wiki/patterns/{file}.md`

## Lessons Extracted
### {Lesson Name}
- **From:** PR #{X}
- **Insight:** {What we learned}
- **Wiki target:** `knowledge/wiki/lessons/{file}.md`
```

### Step 4: Compile to Wiki (Phase 9)

The `wiki-compile.ts` script reads from `knowledge/raw/coderabbit/` and merges patterns into the appropriate wiki files during the post-merge compile action.

## Integration

- **Agents** reference CodeRabbit awareness: "Line-level review handled by CodeRabbit; focus on architecture"
- **`/ship` workflow** reads CodeRabbit comments before approving merge
- **`/retro` workflow** includes CodeRabbit pattern summary
