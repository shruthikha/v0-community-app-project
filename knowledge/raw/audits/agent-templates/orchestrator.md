---
agent: orchestrator
role: Multi-agent coordination and task orchestration
antigravity_template: .agent/agents/orchestrator.md
alternative_templates:
  - gstack CEO role
  - Superpowers subagent-driven-development
strengths:
  - Detailed native agent invocation protocol
  - Clear agent boundary enforcement
  - Pre-flight check workflow
  - Conflict resolution process
weaknesses:
  - Tightly coupled to Claude Code's Agent Tool (needs adaptation for OpenCode Task tool)
  - Heavy on PLAN.md requirement (may be too rigid)
  - Some file type ownership rules may not map to our structure
recommendation: Start with antigravity template, adapt for OpenCode Task tool
customizations_needed:
  - Replace "Agent Tool" references with OpenCode Task tool
  - Simplify file ownership rules for our structure
  - Map to our 13 agents (not all 21)
model_decision: "Sonnet for orchestration complexity"
---

# Orchestrator Agent - Template Analysis

## Source: Antigravity (.agent/agents/orchestrator.md)

### Key Strengths
- **Comprehensive protocol**: Native agent invocation with clear patterns
- **Boundary enforcement**: Strict agent domain separation
- **Pre-flight checks**: PLAN.md verification before agent dispatch
- **Conflict resolution**: Documented process for disagreements

### Template Structure
```yaml
---
name: orchestrator
description: Multi-agent coordination and task orchestration
tools: Read, Grep, Glob, Bash, Write, Edit, Agent
model: inherit
skills: clean-code, parallel-agents, behavioral-modes, plan-writing...
---
```

### What to Extract
1. Agent invocation protocol (adapt for OpenCode Task tool)
2. Pre-flight checklist workflow
3. Agent boundary enforcement rules
4. Synthesis reporting format

### Alternative: gstack CEO Role
- Less protocol-heavy, more autonomous
- Better for simple dispatch scenarios
- Use as simplification baseline

### OpenCode Adaptation Required
- Replace `Agent` tool with Task tool
- Simplify file type ownership for our structure
- Map to 13 agents (not 21)
