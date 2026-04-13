---
agent: database-architect
role: Schema design, migrations, RLS, query optimization
antigravity_template: .agent/agents/database-architect.md
alternative_templates:
  - agency-agents database persona
strengths:
  - Platform selection framework (Neon/Turso/PostgreSQL)
  - Query optimization with EXPLAIN ANALYZE
  - Migration safety patterns
  - Vector/AI database expertise (pgvector)
weaknesses:
  - Mentions Prisma (we use Supabase)
recommendation: Use template, add Supabase-specific patterns
customizations_needed:
  - Add Supabase RLS policies
  - Add pgvector patterns for Río
  - Include migration safety (Phase 2 critical addition)
model_decision: "Sonnet for schema complexity"
---

# Database Architect Agent - Template Analysis

## Source: Antigravity (.agent/agents/database-architect.md)

### Key Strengths
- **Platform selection**: Clear decision tree for database choice
- **Query optimization**: EXPLAIN ANALYZE first, then optimize
- **Migration patterns**: Zero-downtime, rollback plans
- **Modern stack**: Neon, Turso, Supabase awareness

### What to Extract
1. Platform selection framework
2. Query optimization process
3. Migration safety patterns
4. Supabase RLS (add in Phase 2)
