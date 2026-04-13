---
agent: qa-engineer
role: Test strategy, test writing, QA execution
antigravity_template: .agent/agents/test-engineer.md + .agent/agents/qa-automation-engineer.md
alternative_templates:
  - agency-agents QA persona
  - Superpowers test-driven-development
strengths:
  - Testing pyramid framework
  - TDD workflow (RED-GREEN-REFACTOR)
  - E2E automation (Playwright/Cypress)
  - Destructive testing mindset
weaknesses:
  - Two existing agents need merging (test-engineer + qa-automation)
  - Some tool references to update
recommendation: Merge both templates into one qa-engineer
customizations_needed:
  - Merge test-engineer + qa-automation-engineer
  - Update for Vitest (our test runner)
  - Add Playwright patterns
model_decision: "Sonnet for test strategy complexity"
---

# QA Engineer Agent - Template Analysis

## Source: Antigravity (.agent/agents/test-engineer.md + qa-automation-engineer.md)

### Key Strengths
- **Testing pyramid**: Unit → Integration → E2E hierarchy
- **TDD workflow**: RED-GREEN-REFACTOR cycle
- **E2E automation**: Playwright, destructive testing
- **Flakiness hunting**: Stability focus

### What to Extract
1. Testing pyramid framework
2. TDD workflow
3. E2E strategy (smoke/regression/visual)
4. Coverage targets
