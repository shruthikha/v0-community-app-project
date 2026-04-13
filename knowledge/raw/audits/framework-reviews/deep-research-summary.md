---
phase: 1
day: 6
status: deep-framework-research-complete
frameworks_deep_dived: 4
---

# Deep Framework Research - Summary

## Research Completed

Date: April 8, 2026  
Frameworks Deep-Dived: 4  

---

## Superpowers (obra/superpowers)

### Skills (14 total)

| Skill | Description | Port to OpenCode |
|-------|-------------|------------------|
| `using-superpowers` | Skill discovery and usage | ✅ Use as template |
| `brainstorming` | Socratic design refinement | ✅ Keep |
| `writing-plans` | Detailed implementation plans | ✅ Keep |
| `subagent-driven-development` | Fresh subagent per task | ✅ **CRITICAL** |
| `executing-plans` | Plan execution workflow | ✅ Keep |
| `finishing-a-development-branch` | Merge/PR workflow | ✅ Keep |
| `test-driven-development` | RED-GREEN-REFACTOR | ✅ Keep |
| `systematic-debugging` | 4-phase root cause | ✅ Keep |
| `verification-before-completion` | Prove it's fixed | ✅ Keep |
| `requesting-code-review` | Pre-review checklist | ✅ Keep |
| `receiving-code-review` | Responding to feedback | ✅ Keep |
| `dispatching-parallel-agents` | Concurrent workflows | ✅ Keep |
| `using-git-worktrees` | **NEW** - Isolated workspaces | ✅ **ADD** |
| `writing-skills` | Create new skills | ✅ Keep |

### Key Innovation: Git Worktrees

The `using-git-worktrees` skill is highly relevant for our git-management need:
- Creates isolated workspaces for feature work
- Verifies directory is gitignored before creating
- Runs baseline tests to ensure clean state
- Follows directory priority: existing → CLAUDE.md → ask user

### Subagent Pattern (CRITICAL)

Superpowers' `subagent-driven-development` is the model for our orchestrator:
- Fresh subagent per task (no context pollution)
- Two-stage review: spec compliance → code quality
- Model selection by complexity
- Clear status handling (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED)

---

## gstack (garrytan/gstack)

### Skills/Commands (28 total)

| Category | Skills | Port to OpenCode |
|----------|--------|------------------|
| **CEO** | `/office-hours`, `/plan-ceo-review` | ✅ `/spec` integration |
| **Designer** | `/design-consultation`, `/design-review`, `/design-shotgun`, `/design-html` | ⏸ Defer |
| **Eng Manager** | `/plan-eng-review`, `/retro` | ✅ Keep |
| **Engineer** | `/spec`, `/implement`, `/review`, `/test`, `/debug`, `/refactor` | ✅ Workflows |
| **Release Manager** | `/ship`, `/land-and-deploy`, `/canary`, `/benchmark` | ✅ `/ship` |
| **Doc Engineer** | `/document-release` | ✅ `/document` |
| **QA** | `/qa`, `/qa-only`, `/browse` | ⏸ Defer (browser) |
| **Security** | `/cso` | ✅ security-auditor |
| **Multi-AI** | `/codex` | ⏸ Defer |
| **Safety** | `/careful`, `/freeze`, `/guard`, `/unfreeze` | ✅ **ADD** (git safety) |

### Key Patterns

1. **`/office-hours`** - Six forcing questions for product clarification
2. **`/learn`** - Compounding knowledge across sessions (maps to wiki!)
3. **`/canary`** - Post-deploy monitoring (exactly what we need)
4. **`/investigate`** - Systematic debugging with "Iron Law"

### gstack Git Workflow

Notable: gstack doesn't have a dedicated git skill, but has safety features:
- `/careful` - Warns before destructive commands (rm -rf, DROP TABLE, force-push)
- `/freeze` - Restrict edits to a single directory
- `/guard` - Combines careful + freeze

---

## agency-agents (jnMetaCode/agency-agents-zh)

### Personas (193 total, 14 tool integrations)

| Department | Notable Personas | Port to OpenCode |
|------------|------------------|------------------|
| **Engineering** | `engineering-code-reviewer`, `engineering-git-workflow-master`, `engineering-software-architect`, `engineering-sre` | ✅ git-workflow-master |
| **Testing** | `testing-evidence-collector`, `testing-reality-checker` | ⏸ Defer |
| **Specialized** | `specialized-mcp-builder` | ⏸ Defer |

### Key Findings

1. **Git Workflow Master** (`engineering-git-workflow-master.md`) -专门处理分支策略、约定式提交、变基
2. **Code Reviewer** - Security-focused code review
3. **Software Architect** - System design, DDD, architecture decisions

### OpenCode Integration

agency-agents explicitly supports OpenCode:
```bash
./scripts/convert.sh --tool opencode
./scripts/install.sh --tool opencode
```

---

## Antigravity (.agent) - Already Analyzed

### Summary of Skills to Keep

From our earlier analysis, keep these Antigravity skills:
- `brainstorming` → socratic-gate
- `systematic-debugging` → debugger
- `tdd-workflow` → qa-engineer
- `clean-code` → all agents
- `lint-and-validate` → quality gate
- `vibe-code-check` → security
- `database-design` → database-architect
- `api-patterns` → backend-specialist

---

## Updated Skills List (With Git Management)

### NEW Skills Identified

| # | Skill | Source | Priority |
|---|-------|--------|----------|
| 1 | **git-worktree-management** | Superpowers `using-git-worktrees` | CRITICAL |
| 2 | **git-safety-guard** | gstack `/careful`, `/freeze` | HIGH |
| 3 | **canary-monitoring** | gstack `/canary` | HIGH |
| 4 | **learn-compounding** | gstack `/learn` | HIGH |

### Git Management Approach

**Option A: Create dedicated git-manager skill**
- Pre-flight checks: uncommitted changes, remote divergence
- Branch naming validation
- Worktree creation when needed
- Safety warnings before destructive commands

**Option B: Integrate into existing agents**
- devops-engineer handles git operations
- All agents run "git sanity check" before changes

**Recommendation:** Option B - integrate into devops-engineer + add `git-safety-guard` as a reusable skill all agents can invoke.

---

## Files Created

This research is captured in:
- `knowledge/raw/audits/framework-reviews/superpowers.md` (updated with skill list)
- `knowledge/raw/audits/framework-reviews/gstack.md` (updated with skill list)
- `knowledge/raw/audits/framework-reviews/agency-agents.md` (updated)
- `knowledge/raw/audits/skill-categories/summary.md` (updated)

## Next: Phase 2

With the deep research complete, we can now build:
1. 13 agents from templates
2. ~18 skills (including new git-management skills)
3. 10 canonical workflows
