---
agent: security-auditor
role: Architecture-level security, auth, secrets, RLS strategy
antigravity_template: .agent/agents/security-auditor.md
alternative_templates:
  - agency-agents security auditor persona
  - Superpowers verification-before-completion
strengths:
  - OWASP Top 10:2025 coverage
  - Risk prioritization framework (CVSS, EPSS)
  - Red team thinking ("Think like an attacker")
  - Supply chain security (A03)
weaknesses:
  - Read-only by nature (needs clear permission boundaries)
  - Validation script dependency
recommendation: Use template, enhance with Supabase RLS specifics
customizations_needed:
  - Add Supabase RLS policy review
  - Add Supabase auth patterns
  - Define clear output format for findings
model_decision: "Sonnet for thorough analysis"
---

# Security Auditor Agent - Template Analysis

## Source: Antigravity (.agent/agents/security-auditor.md)

### Key Strengths
- **OWASP 2025**: Current vulnerability categories
- **Risk scoring**: CVSS, EPSS prioritization
- **Attack mindset**: Think like attacker, defend like expert
- **Supply chain**: A03 focus on dependencies

### What to Extract
1. OWASP checklist
2. Risk prioritization framework
3. Security review workflow
4. Findings reporting format
