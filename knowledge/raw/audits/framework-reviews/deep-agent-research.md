---
phase: 1
day: 6
status: deep-agent-research-complete
frameworks_deep_dived: 4
---

# Deep Agent Research - Best of Antigravity, gstack, agency-agents, BMAD

## Overview

This document consolidates the best agent patterns from all four frameworks, identifying unique strengths and extraction targets for Phase 2.

---

## AGENT PATTERNS BY FRAMEWORK

### 1. Antigravity (.agent) - 21 Agents

**Strengths:**
- Comprehensive tool permissions per agent
- Skills loading system
- Agent boundary enforcement
- Pre-flight checks

**Best Agents to Extract:**
| Agent | Why It's Good | Extract? |
|-------|---------------|---------|
| `orchestrator` | Agent invocation protocol | ✅ Adapt |
| `backend-specialist` | Tech stack decision frameworks | ✅ Already strong |
| `frontend-specialist` | Deep design thinking | ✅ Adapt |
| `security-auditor` | OWASP 2025 coverage | ✅ Keep |
| `debugger` | 4-phase process | ✅ Keep |
| `devops-engineer` | Deployment workflows | ✅ Add migration safety |

---

### 2. Superpowers - Subagent System

**Unique Pattern: Three-Layer Subagent Architecture**

Superpowers defines 3 distinct subagent types that work together:

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                          │
│         (dispatch fresh subagent per task)              │
└─────────────────────────────────────────────────────────────┘
          │              │              │
          ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │IMPLEMENTER│  │IMPLEMENTER│  │IMPLEMENTER│
   │  Subagent │  │  Subagent │  │  Subagent │
   └──────────┘  └──────────┘  └──────────┘
          │              │              │
          ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │   SPEC   │  │  CODE   │  │   QA    │
   │REVIEWER  │  │QUALITY  │  │REVIEWER │
   └──────────┘  └──────────┘  └──────────┘
```

**Key Innovation: Fresh Subagent Per Task**

Each task gets a completely fresh subagent - no context pollution. The orchestrator provides:
1. Full task description (not file reference)
2. Scene-setting context
3. Explicit "ask questions first" protocol

**Implementer Prompt Template:**
```
Task: [full task description]
Context: [where it fits, dependencies]
Before You Begin: [ask questions now if unclear]
Your Job: [implement → test → verify → commit → self-review → report]
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
```

**Two-Stage Review:**
1. **Spec Reviewer** - Verifies implementation matches spec (nothing more, nothing less)
2. **Code Quality Reviewer** - Checks code quality, patterns, tests

---

### 3. gstack - 28 Skills as Virtual Agents

**Unique Pattern: Specialist Personas as Skills**

gstack doesn't have traditional agents - each skill acts as a virtual specialist:

| "Agent" | Skill Command | What It Does |
|---------|--------------|---------------|
| CEO | `/office-hours` | Six forcing questions reframe the problem |
| Founder | `/plan-ceo-review` | Find the 10-star product |
| Eng Manager | `/plan-eng-review` | Architecture, diagrams, data flow |
| Designer | `/plan-design-review` | Rate design dimensions 0-10 |
| Staff Engineer | `/review` | Paranoid production bugs |
| Debugger | `/investigate` | Root cause, 3-fix limit |
| QA Lead | `/qa` | Auto-generate regression tests |
| Release Engineer | `/ship` | Sync, test, push, PR |
| SRE | `/canary` | Post-deploy monitoring |
| Security | `/cso` | OWASP + STRIDE |
| Technical Writer | `/document-release` | Update docs to match diff |

**Best Patterns to Extract:**

1. **`/office-hours`** - Six forcing questions:
   - Demand reality (specific humans with specific pain)
   - Status quo (what exists today)
   - Desperate specificity (concrete examples)
   - Narrowest wedge (smallest version that delivers value)
   - Observation & surprise (what did you notice that others wouldn't)
   - Future-fit (why this matters in 2 years)

2. **`/review`** - Staff engineer paranoid mode:
   - N+1 queries, stale reads, race conditions
   - Missing indexes, broken invariants
   - Forgotten enum handlers (trace new types through codebase)
   - "Fix-First" - auto-fix obvious issues

3. **`/investigate`** - Debugger with Iron Law:
   - No fixes without investigation first
   - Test hypotheses one at a time
   - Stop after 3 failed fixes - question architecture

4. **`/learn`** - Compounding knowledge:
   - Each session adds to learnings.jsonl
   - Confidence scores on patterns
   - Automatic cross-reference in future work

---

### 4. agency-agents - 193 Personas

**Unique Pattern: Personality-Over-Instructions**

Unlike traditional prompts that say "you are a developer," agency-agents defines:
- **Identity** - Who they are professionally
- **Personality** - How they think, communicate
- **Methodology** - Their specific process
- **Deliverables** - What they produce

**Example: Security Engineer Persona (from agency-agents-zh)**

Key sections in every persona:
1. **Identity & Mindset** - Role, personality, philosophy
2. **Adversarial Thinking Framework** - 4 questions they always ask
3. **Core Mission** - SDLC integration, threat modeling
4. **Mandatory Rules** - Non-negotiable principles
5. **Technical Deliverables** - Templates they produce (threat models, code review patterns)
6. **Workflow Phases** - How they approach each task
7. **Communication Style** - How they speak

**Best Personas to Extract:**

| Persona | Why Unique | Extract? |
|---------|------------|---------|
| **Security Engineer** | OWASP + STRIDE + CI/CD security pipeline | ✅ |
| **Git Workflow Master** | Branch strategies, commit conventions, bisect | ✅ |
| **Code Reviewer** | Security-focused review pattern | ✅ |
| **Software Architect** | DDD, architecture decisions | ✅ |
| **SRE** | SLO, observability, chaos engineering | ✅ |

---

### 5. BMAD - 12+ Specialized Agents

**Unique Pattern: BMad-Help + Workflow Chaining**

BMAD has a central "intelligent guide" agent that:
- Inspects project to see what's done
- Shows options based on installed modules
- Recommends what's next
- Runs automatically at end of every workflow

**BMAD Agent Types:**

| Agent | Purpose | Distinguishing Feature |
|-------|---------|----------------------|
| **BMad-Help** | Intelligent guide | Knows what to do next |
| **PM Agent** | PRD creation | Creates epics/stories from PRD |
| **Architect Agent** | Architecture design | DDD, tech decisions |
| **Developer Agent** | Implementation | Sprint planning, stories |
| **UX Designer** | UI/UX | Design system creation |

**Scale-Adaptive Planning:**
- **Quick Flow** (1-15 stories): Tech spec only
- **BMad Method** (10-50 stories): PRD + Architecture + UX
- **Enterprise** (30+ stories): Full compliance, multi-tenant

---

## BEST PATTERNS TO EXTRACT

### For Our 13 Agents

| Our Agent | Best Pattern Source | What to Extract |
|----------|---------------------|----------------|
| orchestrator | Superpowers subagent system | Fresh subagent per task, two-stage review |
| product-manager | gstack /office-hours | Six forcing questions |
| product-owner | gstack /plan-eng-review | Prioritization, scope management |
| backend-specialist | Antigravity existing | Strong baseline, add gstack /review |
| frontend-specialist | Antigravity | Deep design thinking |
| database-architect | Antigravity + agency-agents | Schema + RLS patterns |
| security-auditor | agency-agents security engineer | OWASP + STRIDE + CI/CD pipeline |
| qa-engineer | gstack /qa | Auto-regression tests |
| technical-writer | gstack /document-release | Doc update from diff |
| content-writer | Antigravity | Tone-of-voice |
| devops-engineer | gstack /ship + /canary | Deploy + post-deploy monitoring |
| code-explorer | gstack /learn | Compounding knowledge |
| debugger | Superpowers + gstack /investigate | 4-phase + 3-fix limit |

---

### Git Management (NEW - from Deep Dive)

| Skill | Source | What It Does |
|-------|---------|--------------|
| `git-worktree-management` | Superpowers | Isolated workspaces |
| `git-safety-guard` | gstack /careful | Warn before destructive commands |
| `git-branching-strategy` | agency-agents git-workflow-master | Branch conventions, bisect |
| `git-commit-standards` | agency-agents git-workflow-master | Conventional commits |

---

## UNIQUE INNOVATIONS SUMMARY

### What Each Framework Does Better

| Framework | Innovation | Use For |
|----------|-----------|--------|
| **Superpowers** | Fresh subagent per task, two-stage review | Orchestrator, quality |
| **gstack** | Six forcing questions, /learn compounding | Planning, knowledge |
| **agency-agents** | Personality-over-instructions | All agents |
| **BMAD** | Intelligent guide (BMad-Help) | Workflow routing |
| **Antigravity** | Skills loading, tool permissions | Agent definition |

### Patterns We Should Adopt

1. **Orchestrator**: Superpowers subagent pattern (fresh per task)
2. **Planning**: gstack six questions + gstack /learn
3. **Security**: agency-agents security engineer persona
4. **Debugging**: gstack Iron Law (no fix without investigation)
5. **Quality**: Superpowers two-stage review
6. **Knowledge**: gstack /learn compounding
7. **Git**: agency-agents git-workflow-master
8. **Documentation**: gstack /document-release

---

## PHASE 2 EXTRACTION PRIORITY

### Tier 1 (Critical for Phase 2)
1. ✅ Superpowers subagent-driven-development → orchestrator
2. ✅ gstack /office-hours → product-manager
3. ✅ agency-agents security engineer → security-auditor
4. ✅ gstack /ship + /canary → devops-engineer

### Tier 2 (High Value)
5. ✅ gstack /learn → code-explorer
6. ✅ gstack /investigate → debugger
7. ✅ agency-agents git-workflow-master → git skills

### Tier 3 (Phase 3+)
8. BMAD BMad-Help → workflow routing
9. agency-agents software architect → enterprise-architect (Phase 4)
10. gstack /autoplan → automated review pipelines

---

## FILES CREATED

This research is consolidated in:
- `knowledge/raw/audits/framework-reviews/deep-research-summary.md`
- `knowledge/raw/audits/skill-categories/summary.md`
- `knowledge/raw/audits/agent-templates/summary.md`

---

## NEXT: Tradeoff Review with MJ

Then → `extraction-decisions.md` → Phase 2
