---
name: agent-collaboration
description: Patterns for cross-agent coordination, deferred invocation, and impact checking. Replaces the Integration Points and Related Agents tables in individual agent definitions. Reference when agents need to coordinate work.
---

# Agent Collaboration

How agents work together in the Nido harness. The orchestrator controls sequencing; agents report needs, not invoke directly.

## The 10 Agents

| Agent | Domain | Mode |
|-------|--------|------|
| `@orchestrator` | Coordination, synthesis | `all` |
| `@backend-specialist` | APIs, server logic, Supabase, Mastra | `subagent` |
| `@frontend-specialist` | React/Next.js UI, styling, accessibility | `subagent` |
| `@database-architect` | Schema, migrations, RLS, query optimization | `subagent` |
| `@security-auditor` | OWASP, RLS audits, threat modeling | `subagent` |
| `@qa-engineer` | Test strategy, execution, verification | `subagent` |
| `@devops-engineer` | CI/CD, deployment, migration application | `subagent` |
| `@solution-architect` | Cross-cutting concerns, ADRs, system design | `subagent` |
| `@product` | Requirements, prioritization, ready-for-dev | `subagent` |
| `@investigator` | Code exploration, debugging, root cause | `subagent` |

## Deferred Invocation Pattern

Agents do NOT invoke other agents directly. Instead:

```markdown
## Recommendations for Orchestrator

### Verification Needed
- **@qa-engineer**: New API route needs endpoint testing
- **@security-auditor**: RLS policy change needs audit

### Context to Pass
- Migration `20260410_add_events_status.sql` created
- New endpoint: `POST /api/v1/events`
```

The orchestrator decides timing and sequencing.

## Cross-Agent Impact Check

When your work affects another agent's domain:

| Your Change | Notify |
|------------|--------|
| New/changed RLS policy | @security-auditor needs audit |
| New API endpoint | @qa-engineer needs tests |
| Schema migration | @database-architect should review |
| UI with auth flow | @security-auditor for XSS/CSRF |
| New feature touching data | @backend-specialist + @database-architect |
| Performance-sensitive change | @solution-architect for architecture review |

## Orchestrator Sequencing

Standard flow for multi-agent tasks:

```
1. @investigator → Map affected areas (if complex/unknown)
2. @product → Clarify requirements (if ambiguous)
3. @solution-architect → Architecture review (if cross-cutting)
4. [domain agent] → Implement
5. @qa-engineer → Verify
6. @security-auditor → Final security check (if auth/data)
7. @devops-engineer → Deploy (if ready)
```

Not every task needs all agents. The orchestrator selects 2-5 based on the task.

## Conflict Resolution

If multiple agents recommend different approaches:

1. **Orchestrator collects both perspectives**
2. **Documents trade-offs**
3. **Presents to user for decision**
4. **Decision recorded as ADR if significant**

## Shared Artifacts

Agents share context through:
- **Build logs** (`knowledge/raw/build-logs/`) — all agents read/write
- **Wiki** (`knowledge/wiki/`) — all agents read, note updates
- **GitHub issues** — via GitHub MCP
- **Plan files** — written by `/plan`, executed by `/implement`
