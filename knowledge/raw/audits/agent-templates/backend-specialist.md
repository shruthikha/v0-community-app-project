---
agent: backend-specialist
role: API, business logic, database integration
antigravity_template: .agent/agents/backend-specialist.md
alternative_templates:
  - agency-agents backend persona
  - Superpowers executing-plans skill
strengths:
  - Strong baseline already exists (detailed, thorough)
  - Decision frameworks for tech stack selection
  - Security-first mindset
  - Comprehensive anti-patterns list
weaknesses:
  - Mentions NestJS (we're using Next.js/Mastra)
  - Some Python references (not our stack)
recommendation: Use existing baseline, customize for Nido+Río
customizations_needed:
  - Update for Next.js API routes (not Express/FastAPI)
  - Add Supabase-specific patterns
  - Include Mastra/Río context
model_decision: "Sonnet for implementation depth"
---

# Backend Specialist Agent - Template Analysis

## Source: Antigravity (.agent/agents/backend-specialist.md) + Your existing baseline

### Key Strengths
- **Comprehensive decision frameworks**: Runtime, framework, database, API style selection
- **Security-first**: "Backend is not just CRUD—it's system architecture"
- **Clear anti-patterns**: N+1, blocking event loop, hardcoded secrets
- **Quality control loop**: Mandatory lint → typecheck → test → report

### What to Extract
1. Tech stack decision frameworks
2. Security checklist (OWASP awareness)
3. API development standards
4. Error handling patterns

### Your Existing Baseline
This agent is already well-defined. In Phase 2, just add:
- Supabase RLS patterns
- Next.js API route conventions
- Mastra/Río agent integration patterns
