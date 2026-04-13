---
phase: 1
day: 5
status: agent-template-research-complete
agents_reviewed: 13
output_location: knowledge/raw/audits/agent-templates/
---

# Agent Template Research Summary

## Completed

Date: April 8, 2026  
Agents Analyzed: 13  
Output Location: `knowledge/raw/audits/agent-templates/`

## Template Sources Used

| Source | Agents Used For |
|--------|-----------------|
| Antigravity (.agent/) | All 13 — primary source |
| gstack | orchestrator (CEO role), devops-engineer (Release Manager) |
| agency-agents | backup personas |
| Superpowers | debugger (systematic-debugging) |

## Agent Summary & Recommendations

| # | Agent | Primary Template | Customizations Needed | Model Decision |
|---|-------|------------------|----------------------|----------------|
| 1 | orchestrator | Antigravity | Task tool adaptation | Sonnet |
| 2 | product-manager | Antigravity | Remove browser tools | Sonnet |
| 3 | product-owner | Antigravity | Add Supabase context | Sonnet |
| 4 | backend-specialist | **Your existing** | Supabase/Next.js context | Sonnet |
| 5 | frontend-specialist | Antigravity | Next.js 16/React 19 | Sonnet |
| 6 | database-architect | Antigravity | Add Supabase RLS | Sonnet |
| 7 | security-auditor | Antigravity | Add Supabase RLS | Sonnet |
| 8 | qa-engineer | Merge test + qa-auto | Vitest/Playwright | Sonnet |
| 9 | technical-writer | Antigravity | docs/dev structure | Haiku |
| 10 | content-writer | Antigravity | UserJot workflow | Haiku |
| 11 | devops-engineer | Antigravity | **Migration safety** (CRITICAL) | Sonnet |
| 12 | code-explorer | Merge archaeologist + explorer | Git MCP | Haiku/Flash |
| 13 | debugger | Antigravity | Supabase/Río context | Sonnet |

## Key Findings

### Already Strong
- **backend-specialist**: Your existing baseline is detailed and thorough
- **debugger**: 4-phase process is excellent
- **frontend-specialist**: Deep design thinking is valuable

### Need Critical Additions
- **devops-engineer**: Must add migration-safety section (Phase 2)
- **database-architect**: Must add Supabase RLS patterns
- **security-auditor**: Must add Supabase auth patterns

### Need Merging
- **qa-engineer**: Merge test-engineer + qa-automation-engineer
- **code-explorer**: Merge code-archaeologist + explorer-agent

### Need Simplification
- **orchestrator**: Adapt from Claude Code Agent Tool to OpenCode Task tool
- **frontend-specialist**: Design rules are too opinionated, simplify

## Next: Day 6 Skill Research

Then: Tradeoff review with MJ
- Confirm 13 agents
- Confirm model decisions
- Confirm skill customizations

---

## Files Created

```
knowledge/raw/audits/agent-templates/
├── orchestrator.md
├── product-manager.md
├── product-owner.md
├── backend-specialist.md
├── frontend-specialist.md
├── database-architect.md
├── security-auditor.md
├── qa-engineer.md
├── technical-writer.md
├── content-writer.md
├── devops-engineer.md
├── code-explorer.md
├── debugger.md
└── summary.md (this file)
```
