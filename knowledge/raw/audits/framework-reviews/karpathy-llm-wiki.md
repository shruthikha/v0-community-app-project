---
framework: Karpathy LLM Wiki
source: gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
relevance_score: 5
extracted_patterns:
  - Three-layer architecture (raw sources → wiki → schema)
  - Incremental compilation (LLM maintains persistent wiki)
  - Ingest → Query → Lint operations
  - index.md (content catalog) and log.md (chronological record)
  - Obsidian integration
  - Optional CLI tools (qmd, TreeSearch)
  - Bold-field metadata (Type: knowledge)
  - Confidence-scored claims
  - Temporal tracking
skills_to_port:
  - wiki-ingest
  - wiki-query
  - wiki-lint
  - wiki-compile
  - workflow-recommender
workflows_to_adapt:
  - All workflows (wiki integration)
  - /implement (worklog → wiki)
  - /retro (compile + lint)
  - Phase 6 loops
anti_patterns:
  - Full RAG infrastructure (not needed at our scale)
  - Over-engineering metadata
customizations_needed:
  - Adapt to Nido+Río specifics
  - Use GitHub MCP for search (not separate tool)
  - Simplify for single-user context
---

# Karpathy LLM Wiki Deep Dive

## Overview

**Source:** Andrej Karpathy's gist (April 2026)  
**Stars:** 5,000+ in first day  
**Key Quote:** "Stop treating LLMs as search. Let them build wikis."

Karpathy's LLM Wiki is a **pattern for building personal knowledge bases using LLMs** — replacing RAG with compiled, persistent knowledge.

## The Core Idea

### RAG vs. Wiki

**RAG (current approach):**
- Upload documents
- LLM retrieves chunks at query time
- Must "rediscover" knowledge every time
- No accumulation

**LLM Wiki (new approach):**
- LLM incrementally builds a persistent wiki
- Updates entity pages, revises summaries
- Cross-references already exist
- Knowledge compounds over time

## Three-Layer Architecture

### Layer 1: Raw Sources

Immutable source documents:
- Articles, papers, images, data files
- LLM reads from them but never modifies
- Source of truth

### Layer 2: The Wiki

LLM-generated markdown files:
- Summaries, entity pages, concept pages
- Cross-references maintained automatically
- Updates when new sources arrive
- The "compiled" knowledge

### Layer 3: The Schema

Configuration document (AGENTS.md for Codex, CLAUDE.md for Claude Code):
- Tells LLM how wiki is structured
- Defines conventions
- Workflows for ingest/query/lint
- Co-evolves with usage

## Operations

### Ingest

```
1. Drop new source into raw collection
2. Tell LLM to process it
3. LLM reads source, discusses takeaways
4. LLM writes summary page
5. LLM updates index
6. LLM updates relevant entity pages
7. LLM appends to log
```

**Result:** A single source touches 10-15 wiki pages.

### Query

```
1. Ask question against wiki
2. LLM searches for relevant pages
3. LLM reads them, synthesizes answer
4. Answer with citations
5. Good answers → filed back as new wiki pages
```

**Key insight:** Answers compound into wiki just like sources.

### Lint

```
1. Ask LLM to health-check wiki
2. Look for:
   - Contradictions between pages
   - Stale claims superseded by new sources
   - Orphan pages with no inbound links
   - Missing cross-references
   - Data gaps
3. LLM suggests new questions to investigate
```

## Indexing and Logging

### index.md — Content Catalog

- Every page listed with link + one-line summary
- Optional metadata (date, source count)
- Organized by category
- Updated on every ingest

### log.md — Chronological Record

- Append-only record of what happened when
- Format: `## [2026-04-02] ingest | Article Title`
- Parseable with unix tools: `grep "^## \[" log.md | tail -5`
- Timeline of wiki evolution

## Implementation Patterns

### Bold-Field Metadata (Alternative to YAML)

```
**Type:** knowledge
**Source:** article
**Date:** 2026-04-06
**Confidence:** high
```

Why: Every LLM parses it correctly, renders in any viewer, no YAML knowledge needed.

### Confidence Scoring

- Single-source claims → low confidence
- Corroborated across sources → promoted to high confidence
- Contested claims → surfaced, not buried

### Temporal Tracking

- Claims timestamped
- Shows knowledge evolution
- Flags stale facts

### Training Period

- System starts chatty, asks questions
- Learns your conventions
- Goes quiet after 30 days
- Wiki trains its own AI agent

## Optional Tools

### qmd (Local Search Engine)

- BM25 + vector search + LLM re-ranking
- MCP server available
- ~2GB model footprint

### TreeSearch (Alternative)

- Structure-first (no chunking, no embeddings)
- SQLite FTS5 keyword matching
- Zero model dependency
- Millisecond latency

### sage-wiki (Full Implementation)

- Web UI + TUI
- Prompt caching (50-90% savings)
- Cost tracking
- Batch API support

### quicky-wiki (Zero-Config CLI)

- `npx quicky-wiki init`
- Auto-detects API keys
- Confidence-scored claims
- Multi-provider

### MemPalace (Recall-Focused)

- Different problem than wiki
- Stores conversations verbatim
- "What did I say 3 months ago?"

### thinking-mcp (Cognition-Focused)

- Tracks not just knowledge, but thinking patterns
- Decision rules, frameworks, tensions
- Typed edges (supports, contradicts, evolved_into)
- Nodes decay over time

## Why This Works

The tedious part of knowledge bases isn't reading — it's **bookkeeping**:
- Updating cross-references
- Keeping summaries current
- Noting contradictions
- Maintaining consistency

**Humans abandon wikis** because maintenance burden grows faster than value.

**LLMs don't get bored**, don't forget updates, can touch 15 files in one pass.

## Relevance to Nido+Río Migration

### This IS Our Architecture

The `knowledge/` tree is directly modeled on Karpathy's LLM Wiki:

```
knowledge/
├── raw/           → Raw sources layer
├── wiki/          → Wiki layer
└── (schema)       → AGENTS.md, OPERATING-MODEL.md
```

### What We Already Have

- ✅ Raw sources: `knowledge/raw/research/`, `knowledge/raw/build-logs/`
- ✅ Wiki: `knowledge/wiki/` (just starting)
- ✅ Schema: `AGENTS.md`, `OPERATING-MODEL.md`

### What to Extract (High Priority)

1. **Ingest → Wiki → Query → Lint operations** — All Phase 5-6 work
2. **index.md + log.md pattern** — Already using in Phase 5
3. **Bold-field metadata** — Alternative to YAML for some pages
4. **Confidence scoring** — For wiki quality
5. **Training period concept** — How wiki "learns" our patterns

### What to Skip

- **Full RAG infrastructure** — Not needed at our scale
- **Complex search tools** — GitHub MCP + grep sufficient
- **Over-engineering** — Keep simple, iterate

### Customization for OpenCode

- Wiki operations → Skills in `.opencode/skills/`
- Schema → Already AGENTS.md + OPERATING-MODEL.md
- Ingest → Part of workflow closeouts
- Query → `wiki-query` skill
- Lint → Phase 6 loops

### Scoring

| Criterion | Score | Notes |
|-----------|-------|-------|
| Workflow discipline | 5/5 | **Core to our architecture** |
| Skill portability | 5/5 | Direct mapping to knowledge/ |
| Multi-agent coordination | N/A | Not applicable |
| **Overall** | **5/5** | **Foundation pattern** |

## Files to Create (Phase 5-6)

- `.opencode/skills/wiki-ingest/SKILL.md`
- `.opencode/skills/wiki-query/SKILL.md`
- `.opencode/skills/wiki-lint/SKILL.md`
- `.opencode/skills/wiki-compile/SKILL.md`
- `scripts/compile/wiki-compile.ts`
- `scripts/compile/docs-drift-check.ts`
