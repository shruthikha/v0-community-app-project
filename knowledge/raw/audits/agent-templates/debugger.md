---
agent: debugger
role: Root cause analysis, error investigation, systematic debugging
antigravity_template: .agent/agents/debugger.md
alternative_templates:
  - Superpowers systematic-debugging skill
strengths:
  - 4-phase debugging process (Reproduce → Isolate → Understand → Fix)
  - 5 Whys technique for root cause
  - Binary search debugging
  - Git bisect strategy
  - Clear error analysis template
weaknesses:
  - Some tool references to update (browser tools)
recommendation: Use existing template
customizations_needed:
  - Update for our tooling (Git MCP, not git CLI)
  - Add Supabase debugging patterns
  - Add Mastra/Río debugging context
model_decision: "Sonnet for debugging complexity"
---

# Debugger Agent - Template Analysis

## Source: Antigravity (.agent/agents/debugger.md)

### Key Strengths
- **4-Phase Process**: Reproduce → Isolate → Understand → Fix
- **5 Whys**: Root cause technique
- **Binary search**: When unsure where bug is
- **Git bisect**: Regression finding
- **Category-based**: Runtime, logic, performance, intermittent

### What to Extract
1. Debugging workflow
2. Root cause techniques
3. Error analysis template
4. Investigation principles
