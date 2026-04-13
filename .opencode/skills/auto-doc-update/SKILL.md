---
name: auto-doc-update
description: Detects changed files and drafts documentation updates. Runs at /implement and /ship closeout. Checks if docs, wiki, or user guides need updating based on what code changed. Also triggers UserJot draft if user-facing.
---

# Auto-Doc Update

Code changes without doc updates create drift. This skill catches it at closeout.

## When to Use

- At `/implement` closeout (after code changes are complete)
- At `/ship` closeout (final doc check before merge)
- When any agent modifies files in `apps/`, `packages/`, or `supabase/`

## The Process

### Step 1: Identify Changed Files

Check what was modified in this workflow session (or PR):

```bash
git diff --name-only HEAD~{n}  # or compare against base branch
```

### Step 2: Map Changes to Doc Areas

Check ALL wiki and raw folders for content that might be affected — not just the obvious ones.

| Changed File Pattern | Docs to Check |
|---------------------|---------------|
| `app/api/**` | `docs/dev/architecture/`, `knowledge/wiki/patterns/`, `knowledge/wiki/tools/` |
| `supabase/migrations/**` | `knowledge/wiki/tools/supabase-nido.md`, `knowledge/wiki/patterns/supabase-*` |
| `components/**` | `knowledge/wiki/design/`, component docs, storybook |
| `app/**/page.tsx` | `docs/user/`, `knowledge/wiki/concepts/` (feature definitions) |
| `.env*` | `docs/dev/`, `knowledge/wiki/tools/` |
| `packages/rio-agent/**` | `knowledge/wiki/tools/mastra-nido-patterns.md`, `knowledge/wiki/concepts/` |
| Any RLS policy change | `knowledge/wiki/patterns/supabase-multi-tenancy.md`, `knowledge/wiki/tools/supabase-nido.md` |
| Any auth change | `knowledge/wiki/patterns/`, `knowledge/wiki/lessons/` |

Also grep broadly:
```bash
grep -r "function_or_feature_name" knowledge/wiki/ --include="*.md" -l
```

### Step 3: Draft Updates or Note Gaps

For each stale doc:
- **If you can update it** → Draft the update inline
- **If it needs deeper work** → Add to `knowledge/wiki/documentation-gaps.md`:

```markdown
- [ ] **{Doc path}** needs update — {what changed} (from {issue/PR})
```

### Step 4: User-Facing Change Detection

If any changes touch:
- Route pages (`app/**/page.tsx`)
- User-visible UI components
- Feature flags that enable new features
- Public API endpoints

Then trigger: **Release notes draft** (invoke `release-notes-draft` skill).

## What to Update vs. What to Note

**Update directly:**
- Wiki pattern files (small additions to existing patterns)
- Tool knowledge files (new convention discovered)
- Architecture docs (new endpoint, changed schema)

**Note as gap (don't update):**
- User guides (need review for tone and completeness)
- ADRs (need deliberate architectural discussion)
- Onboarding docs (need broader context)

## Output

At closeout, produce:

```markdown
## Doc Update Summary

### Updated
- `knowledge/wiki/patterns/xyz.md` — added new pattern from this implementation

### Gaps Identified
- `docs/dev/architecture/api.md` — new endpoint not documented
- `docs/user/guides/events.md` — new event feature not in user guide

### User-Facing Changes
- [Yes/No] → [If yes: release-notes-draft triggered]
```