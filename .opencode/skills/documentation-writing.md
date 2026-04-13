---
name: documentation-writing
description: Tone and structure guidance for writing. All agents write as part of their work - this skill provides reference for audience-specific tone.
triggers:
  - write
  - document
  - guide
  - "tone check"
  - "release notes"
---

# Documentation Writing

Per OPERATING-MODEL.md: **All agents write as part of their work.** This skill provides tone and structure guidance for different audiences.

## Core Principle

> "Write for your audience. Don't just document what; document why."

---

## Audience Guide

### Technical Audience (Developers)

**Source material:** Code, API, schema, architecture

**Tone:** Code-first, precise, actionable

**Structure:**
```markdown
## [Topic Name]

### Overview
[High-level description in 1-2 sentences]

### Implementation
[Code examples with explanations]

### API
[Endpoint/method signatures]

### Edge Cases
[Error handling, failures]

### Related
- [Link to related docs]
```

**Rules:**
- Start with code or concrete example
- Use exact terminology
- Include error cases
- Link to related docs

---

### User Audience (Residents, Admins)

**Source material:** Features, requirements, UX flows

**Tone:** "Why before how", accessible, step-by-step

**Structure:**
```markdown
## [Feature Name]

### What You'll Learn
[1-2 bullet learning objectives]

### Why It Matters
[Problem this solves, in user terms]

### Step-by-Step
1. [First step]
2. [Second step]

### Common Questions
**Q: [Question]**
A: [Answer]

### Related
- [Links to related guides]
```

**Rules:**
- Explain "why" before "how"
- Anticipate confusion
- Use plain language
- Include screenshots if relevant
- Format as checklist when possible

---

## Release Notes (Both Audiences)

Per `@skill:release-notes-draft`:

### Technical Notes (Devs)

```markdown
## [Version] - [Date]

### Changes
- **[Feature]**: Implementation details for developers

### Breaking
- **[Change]**: Migration steps

### Internal
- Refactored [module]
```

### User Notes (Residents)

```markdown
## What's New in Version [Version]

### What's Better
- [User benefit]

### How to Use
1. [Step 1]
```

**Skill produces both variants from one context.**

---

## Content Location Guide

| Content Type | Where |
|--------------|-------|
| Architecture docs | `docs-site/docs/developers/` |
| API references | `docs-site/docs/developers/` |
| Schema documentation | `docs-site/docs/developers/` |
| User guides | `docs-site/docs/guides/` |
| Release notes | `docs-site/blog/` |
| Patterns | `knowledge/wiki/patterns/` |
| Lessons | `knowledge/wiki/lessons/` |
| Build logs | `knowledge/raw/build-logs/` |

---

## Brand Voice

Reference `knowledge/wiki/design/nido-design-system.md`:
- **Forest Canopy**: #4A7C2C (primary actions)
- **Sunrise**: #D97742 (urgent CTAs)
- **Soil**: #1A1A1A (primary text)

**Never use:**
- Purple/violet/indigo as primary
- Jargon without explanation
- Passive voice in guides

---

## Writing as Part of Work

All agents write as integral to their work, NOT by invoking a separate writer agent:

| Agent | Writes |
|-------|--------|
| @backend-specialist | API implementations, build logs |
| @frontend-specialist | Component documentation, build logs |
| @database-architect | Schema docs, migration notes |
| @security-auditor | Audit reports, security findings |
| @qa-engineer | Test results, verification reports |
| @devops-engineer | Deployment notes, runbooks |
| @product | Requirements, specs, Ready-for-Dev |
| @investigator | Investigation reports |
| @solution-architect | ADR drafts |

**No agent should invoke another to write. Write as part of your domain work.**

---

## Never Do

- ❌ Don't invoke another agent to write
- ❌ Don't document without reading source first
- ❌ Don't use incorrect terminology
- ❌ Don't violate brand voice
- ❌ Don't leave gaps without marking `[TODO]`