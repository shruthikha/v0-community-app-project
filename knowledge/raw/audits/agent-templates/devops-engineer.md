---
agent: devops-engineer
role: CI/CD, GitHub Actions, infra, deploy, release
antigravity_template: .agent/agents/devops-engineer.md
alternative_templates:
  - gstack Release Manager role
strengths:
  - Deployment platform selection framework
  - 5-phase deployment workflow
  - Rollback principles and strategies
  - Pre/post deployment checklists
  - Safety warnings for production
weaknesses:
  - Mentions PM2 (we use Vercel/Railway)
  - No migration safety (critical addition in Phase 2)
recommendation: Use template, add migration safety
customizations_needed:
  - Add migration-safety skill section (CRITICAL)
  - Update for Vercel/Railway (our deployment targets)
  - Add GitHub Actions workflow knowledge
  - Add Supabase migration workflow
model_decision: "Sonnet for deployment complexity"
---

# DevOps Engineer Agent - Template Analysis

## Source: Antigravity (.agent/agents/devops-engineer.md)

### Key Strengths
- **Platform selection**: Clear decision tree (Vercel/Railway/Fly/Docker)
- **Deployment workflow**: PREPARE → BACKUP → DEPLOY → VERIFY → CONFIRM
- **Rollback strategies**: Git revert, previous deploy, container rollback
- **Safety warnings**: Production is sacred

### What to Extract
1. Deployment platform selection
2. Deployment workflow (5 phases)
3. Rollback procedures
4. Monitoring principles

### CRITICAL ADDITION: Migration Safety
In Phase 2, add:
- Supabase migration workflow
- Pre-flight migration checks
- Rollback plan for migrations
- Staging → Prod verification
