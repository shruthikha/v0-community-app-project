---
name: release-notes-draft
description: Produces three release note variants from one release context — technical (build log), user-facing (Docusaurus), and UserJot draft. Use during /ship closeout for any user-visible change.
---

# Release Notes Draft

One release, three outputs. Different audiences need different information.

## When to Use

- During `/ship` closeout
- After any merge that includes user-visible changes
- When `devops-engineer` completes a deployment

## The Three Outputs

### Output 1: Technical Release Note (Build Log)

Appended to `knowledge/raw/build-logs/{issue-number}_*.md`:

```markdown
## Release: {feature-name} — {date}

### Changes
- [Concrete technical changes]
- [Files modified, APIs added/changed]
- [Migration applied: yes/no]

### Performance Impact
- [Bundle size change]
- [Query performance change]
- [New indexes added]

### Configuration Changes
- [New env vars]
- [Feature flags]

### Known Issues
- [Anything not yet resolved]
```

### Output 2: User-Facing Release Note (Docusaurus)

Written to `docs/user/releases/{YYYY-MM-DD}-{feature-name}.md`:

```markdown
---
title: "{Feature Name}"
date: {YYYY-MM-DD}
---

## What's New

{1-2 sentences explaining the benefit in plain language. No jargon.}

## How It Works

{Step-by-step if it's a new feature, or "no action needed" if it's an improvement.}

## What Changed

- {Change 1 in user terms}
- {Change 2 in user terms}
```

**Tone:** Reference `docs/dev/tone-of-voice.md`. Friendly, clear, bilingual (Spanish/English) when required.

### Output 3: UserJot Draft

Written to `knowledge/raw/userjot-drafts/{YYYY-MM-DD}-{feature-name}.md`:

```markdown
---
status: draft
publish_to: userjot
needs_review: true
---

# {Feature Name}

{2-3 sentences for the announcement. Focus on the user benefit, not the implementation.}

{Optional: screenshot or GIF placeholder}

---
*This is a draft. Review and publish manually via UserJot.*
```

## Content Guidelines

### Technical Note (Output 1)
- Be precise. File paths, migration names, API changes.
- Audience: future developers, weekly retro.

### User Note (Output 2)
- Explain "why" before "how"
- No code, no technical terms
- Include screenshots if UI changed
- Bilingual if user-facing (English + Spanish)

### UserJot Draft (Output 3)
- Short, announcement-style
- Focus on the benefit to residents
- Include a call-to-action if applicable ("Try it now")
- Always mark as draft — user publishes manually

## When to Skip

- Internal-only changes (refactoring, CI/CD, test infrastructure): Output 1 only
- Security fixes: Output 1 only (don't announce vulnerabilities)
- Bug fixes with no user-visible impact: Output 1 only
