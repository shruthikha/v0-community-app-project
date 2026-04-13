---
agent: frontend-specialist
role: React/Next.js, UI components, state management
antigravity_template: .agent/agents/frontend-specialist.md
alternative_templates:
  - agency-agents frontend persona
  - Superpowers verifying-completion
strengths:
  - Deep design thinking process
  - Performance-first mindset
  - Strong component architecture patterns
  - Accessibility emphasis
weaknesses:
  - Heavy design focus (purple ban, safe harbor rules) - may be too opinionated
  - Mentions shadcn defaults
recommendation: Use template, simplify design rules for our needs
customizations_needed:
  - Simplify design rules (keep principles, reduce specific rules)
  - Add Next.js 16 + React 19 context
  - Add shadcn/ui patterns (we use this)
model_decision: "Sonnet for UI complexity"
---
# Frontend Specialist Agent - Template Analysis

## Source: Antigravity (.agent/agents/frontend-specialist.md)

### Key Strengths
- **Deep design thinking**: Constraint analysis before any design
- **Performance-first**: Profile before optimizing
- **State management hierarchy**: Server → URL → Global → Context → Local
- **Accessibility**: First-class citizen

### What to Extract
1. Design decision process
2. State management hierarchy
3. Next.js App Router patterns
4. Component architecture
