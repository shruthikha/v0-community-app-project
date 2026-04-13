---
framework: agency-agents
source: github.com/jxnl/agency-agents
relevance_score: 4
extracted_patterns:
  - 120+ AI specialist persona templates
  - Persona-based agent definitions with personality
  - Role specialization (security, QA, product, engineering)
  - Prompt engineering for agent behavior
  - Multi-domain coverage (engineering, design, marketing, product)
skills_to_port:
  - security-auditor-persona
  - qa-engineer-persona
  - product-manager-persona
  - backend-specialist-persona
  - frontend-specialist-persona
workflows_to_adapt:
  - Agent definitions for Phase 2
  - Persona templates for 13 agents
anti_patterns:
  - Full 120+ persona adoption (too many)
  - Some personas are context-specific (Chinese market)
customizations_needed:
  - Select 13 core personas for our agent list
  - Adapt to OpenCode YAML frontmatter format
  - Add Nido+Río specific context
---

# agency-agents Framework Deep Dive

## Overview

**Repository:** github.com/jxnl/agency-agents  
**Stars:** 4,707 ⭐ (Chinese variant: jnMetaCode/agency-agents-zh with 4,707 ⭐)  
**Created:** 2025 | **Primary Language:** Shell

agency-agents provides **120+ plug-and-play AI specialist personas** across 18 departments. The key insight: prompts need personality, not just instructions.

## Key Insight: Personality Over Instructions

Traditional prompt engineering:
```
"You are a developer. Write code that is clean and follows best practices."
```

agency-agents approach:
```
"You are a senior security auditor with 15 years of experience at Fortune 500 companies. 
You're skeptical of assumptions, meticulous about edge cases, and you always ask 'what if' 
before approving any code. You speak bluntly about risks because you'd rather be wrong 
than surprised."
```

**Why it works:** Personality drives behavior more than instructions. A "skeptical" auditor asks different questions than a "thorough" one.

## Persona Categories

### Engineering (25+)
- Backend specialist
- Frontend specialist
- Full-stack engineer
- DevOps engineer
- Security engineer
- QA engineer
- Database architect

### Product (15+)
- Product manager
- Product owner
- UX researcher
- Business analyst
- Data analyst

### Design (15+)
- UI designer
- UX designer
- Visual designer
- Design systems

### Operations (20+)
- Project manager
- Scrum master
- Tech lead
- Engineering manager

### Specialized (45+)
- API designer
- Performance engineer
- Accessibility specialist
- Internationalization expert
- Mobile developer
- Cloud architect
- And 39 more...

## Security Auditor Persona (Example)

```markdown
You are a Senior Security Auditor with 15 years of experience at Fortune 500 companies.

Your approach:
- You assume all user input is malicious until proven otherwise
- You always consider: SQL injection, XSS, CSRF, authentication bypass, privilege escalation
- You review code with an attacker's mindset
- You're skeptical of "it works, so it's secure" reasoning
- You document every finding with severity (Critical/High/Medium/Low)
- You provide remediation steps, not just problems

Your communication style:
- Blunt and direct about risks
- You use CVSS scoring when applicable
- You always ask "what if" scenarios
- You challenge assumptions

When reviewing code:
1. Start with authentication and authorization
2. Check data validation everywhere
3. Review error handling for information leakage
4. Examine session management
5. Check for insecure dependencies
6. Verify encryption at rest and in transit
```

## Relevance to Nido+Río Migration

### What to Extract (High Priority)

1. **Security auditor persona** — Direct template for our security-auditor agent
2. **QA engineer persona** — Template for our qa-engineer agent
3. **Product manager persona** — Template for our product-manager agent
4. **Personality-over-instructions approach** — All 13 agents should have defined personalities
5. **Backend/frontend specialist personas** — Customize for Nido+Río stack

### What to Skip

- **Full 120+ personas** — We need 13, not 120
- **Context-specific personas** — Chinese market, specific tool integrations
- **Marketing/sales personas** — Not relevant for our Phase 1

### Customization for OpenCode

- Select 13 core personas from engineering/product domains
- Adapt to OpenCode agent YAML frontmatter format
- Add Nido+Río specific context (Supabase, Next.js, Mastra, etc.)
- Include project conventions from AGENTS.md

### Scoring

| Criterion | Score | Notes |
|-----------|-------|-------|
| Workflow discipline | 3/5 | Not workflow-focused |
| Skill portability | 5/5 | Persona definitions map directly |
| Multi-agent coordination | 2/5 | Not the focus |
| **Overall** | **3.5/5** | **Persona source** |

## Files to Create

- `.opencode/agent/security-auditor.md`
- `.opencode/agent/qa-engineer.md`
- `.opencode/agent/product-manager.md`
- `.opencode/agent/backend-specialist.md`
- `.opencode/agent/frontend-specialist.md`
- And 8 more agent definitions
