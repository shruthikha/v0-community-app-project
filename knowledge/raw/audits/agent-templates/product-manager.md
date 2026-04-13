---
agent: product-manager
role: Research, definition, clarification, dependency checks
antigravity_template: .agent/agents/product-manager.md
alternative_templates:
  - agency-agents product-manager persona
  - gstack Eng Manager role
strengths:
  - Clear requirement gathering process
  - MoSCoW prioritization framework
  - User story and acceptance criteria templates
  - Socratic gate for ambiguous requests
weaknesses:
  - Browser tools included (not needed with MCP)
  - Very focused on human workflows
recommendation: Start with antigravity template, simplify for OpenCode
customizations_needed:
  - Remove browser tools
  - Focus on workflow integration (wiki-query, socratic-gate)
  - Add Supabase/Río-specific context
model_decision: "Sonnet for research depth"
---

# Product Manager Agent - Template Analysis

## Source: Antigravity (.agent/agents/product-manager.md)

### Key Strengths
- **Requirement gathering**: Discovery → Definition → Prioritization workflow
- **MoSCoW framework**: Must/Should/Could/Won't prioritization
- **User story format**: Clear "As a... I want to... so that..." structure
- **Acceptance criteria**: Gherkin-style Given/When/Then

### What to Extract
1. Requirement gathering workflow
2. Prioritization framework
3. User story and AC format
4. Gap analysis process
