---
agent: code-explorer
role: Codebase mapping, dependency analysis, impact graphs
antigravity_template: .agent/agents/code-archaeologist.md + .agent/agents/explorer-agent.md
alternative_templates:
  - agency-agents code explorer persona
strengths:
  - Legacy code understanding (archaeologist)
  - Autonomous discovery (explorer)
  - Dependency mapping
  - Socratic discovery protocol
weaknesses:
  - Two existing agents need merging
  - Some tool references to update
recommendation: Merge both templates into one code-explorer
customizations_needed:
  - Merge code-archaeologist + explorer-agent
  - Add Git MCP for blame/history
  - Add Supabase schema discovery
model_decision: "Haiku or Gemini Flash for cheap scanning"
---

# Code Explorer Agent - Template Analysis

## Source: Antigravity (.agent/agents/code-archaeologist.md + explorer-agent.md)

### Key Strengths
- **Code archaeology**: Understanding undocumented legacy code
- **Autonomous discovery**: Auto-maps project structure
- **Dependency intelligence**: Not just what's used, but how coupled
- **Socratic protocol**: Interactive discovery with questions

### What to Extract
1. Discovery workflow
2. Legacy code analysis
3. Dependency mapping
4. Socratic discovery protocol
