---
agent: technical-writer
role: Architecture docs, API docs, ADRs, dev docs
antigravity_template: .agent/agents/documentation-writer.md
alternative_templates:
  - agency-agents technical writer persona
  - gstack Doc Engineer role
strengths:
  - Mandatory workflow (read context → cross-reference → output)
  - Taxonomy for doc types (architecture, schema, API, security)
  - Gap documentation process
  - Cross-referencing discipline
weaknesses:
  - Focus on Docusaurus output (we have docs-site)
  - Less user guide focus (content-writer handles that)
recommendation: Use template, adapt for our docs structure
customizations_needed:
  - Update for our docs structure (docs/dev/)
  - Add ADR workflow
  - Integrate with wiki-ingest skill
model_decision: "Haiku for documentation writing"
---

# Technical Writer Agent - Template Analysis

## Source: Antigravity (.agent/agents/documentation-writer.md)

### Key Strengths
- **Mandatory workflow**: Read → Cross-reference → Output
- **Taxonomy**: Architecture, Schema, API, Security, Deployment, Testing
- **Gap tracking**: documentation_gaps.md updates
- **Docusaurus integration**: Standard features

### What to Extract
1. Documentation workflow
2. Taxonomy structure
3. Gap analysis process
4. Cross-reference discipline
