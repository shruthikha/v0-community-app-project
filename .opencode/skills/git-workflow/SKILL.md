---
name: git-workflow
description: Branch naming, commit conventions, and lifecycle for Nido. Trunk-based with short-lived feature branches tied to GitHub issues. One feature = one branch = one PR = one issue.
---

# Git Workflow

Trunk-based development with short-lived feature branches. One feature = one branch = one PR = one issue.

## Branch Naming

**Format:** `{type}/{issue-number}-{short-slug}`

| Type prefix | Use for |
|-------------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `chore/` | Maintenance, CI, docs, dependencies |
| `refactor/` | Pure refactoring (no behavior change) |

**Examples:**
- `feat/66-lot-images`
- `fix/82-middleware-redirect-loop`
- `chore/91-ci-update`
- `refactor/104-extract-auth-helpers`

The issue number is mandatory. It's how branches link back to GitHub issues, how PRs auto-close issues on merge, and how the build log knows which feature it tracks.

## Branch Lifecycle

### 1. Create — at the start of `/implement`

```bash
# Ensure clean main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feat/{issue}-{slug}
```

The `/implement` command does this automatically in Phase 2 (Branch Setup). Don't create branches manually unless you're working outside the harness.

### 2. Commit — incrementally during build

Each meaningful change gets one commit. Use conventional commit format:

```bash
git commit -m "feat(events): add tenant_id validation to createEvent"
git commit -m "test(events): add unit tests for createEvent validation"
git commit -m "fix(auth): use x-forwarded-host for redirect URL"
```

Conventional commit prefixes:
- `feat:` — new feature
- `fix:` — bug fix
- `test:` — adding/updating tests
- `docs:` — documentation only
- `refactor:` — code restructuring without behavior change
- `chore:` — maintenance

Each commit should be:
- **Atomic** — one logical change
- **Buildable** — `npm run lint && type-check` passes at every commit
- **Described** — conventional format with scope when relevant

Commit after each task completes in `/implement`. Commit after each manual checkpoint passes. Do not batch commits at the end.

### 3. Keep current — daily for active branches

```bash
git fetch origin
git rebase origin/main
```

If main has moved while you've been working, rebase onto it. Resolve conflicts immediately, don't let them accumulate.

### 4. Open Draft PR — at end of `/implement`

```bash
gh pr create --draft \
  --title "feat: {feature description}" \
  --body "Closes #{issue}

## Summary
{what this PR does}

## Testing
{what was verified}

## Notes
{anything relevant for review}"
```

The `Closes #{issue}` syntax is critical — it auto-closes the issue on merge.

PR title format mirrors commit format: `{type}: {description}`. Examples:
- `feat: residential lot image upload`
- `fix: middleware session corruption on auth recovery`

### 5. Merge — at end of `/ship`

After QA passes, security review (if needed), and user approval:

```bash
gh pr merge --squash --delete-branch
```

Squash merge is the default for trunk-based — keeps main history clean (one commit per feature) while preserving the branch's commit history in the PR. The `--delete-branch` flag removes the local and remote branch automatically.

After merge:
- Issue auto-closes (because of `Closes #N` in PR body)
- Branch auto-deletes (because of `--delete-branch`)
- Vercel auto-deploys main
- GitHub Actions run (post-merge wiki compile, migration apply if applicable)

## When to Branch vs. Stay on Main

**Branch (always for code changes):**
- New features (`feat/`)
- Bug fixes (`fix/`)
- Refactoring (`refactor/`)
- Dependency updates that touch code (`chore/`)

**Stay on main (rare, only for):**
- Documentation-only changes that don't touch code
- README updates
- Wiki entries (which are usually committed by GitHub Actions anyway)

When in doubt, branch. The cost is tiny.

## Epic + Child Issues (large features)

For features that span multiple sprints or need multiple PRs:

```
Epic Issue #100: Resident profile system
├── Child #101: Profile schema + API
├── Child #102: Profile UI - basic info
├── Child #103: Profile UI - photos
└── Child #104: Profile privacy settings
```

Each child gets its own branch and PR, all merging to `main` independently:
- `feat/101-profile-schema`
- `feat/102-profile-ui-basic`
- `feat/103-profile-photos`
- `feat/104-profile-privacy`

The epic issue stays open as a tracking issue, with a checklist linking to each child. When all children merge, the epic closes.

**Slice for shippability:** each child must be independently shippable. If child #102 depends on child #103, that's a sign the slicing is wrong — re-slice so each piece can ship in isolation.

## Feature Flags for In-Progress Work

If a child issue can't ship in isolation because it would expose a half-built feature to users, wrap it in a feature flag:

```typescript
if (await flags.isEnabled('resident-profiles')) {
  // new feature code
}
```

The code merges to main, but the flag is off in production. Flip the flag in a tiny PR when all related work is done.

This pattern lets you keep merging to main without exposing incomplete work — Vercel deploys constantly, but users only see what flags expose.

## Rollback

If a deployment goes wrong:

```bash
# Find the merge commit
git log --oneline -10

# Revert it
git revert -m 1 {merge-commit-hash}
git push origin main
```

For Vercel: use dashboard → Deployments → Rollback.
For database: follow the `migration-safety` skill rollback procedures.

## Stale Branch Cleanup

The `/retro` command lists branches older than 7 days that aren't merged. For each:

- **Active work** → rebase on main, continue
- **Abandoned** → close PR, delete branch
- **Forgotten** → ask user to decide

Aim for zero stale branches at the end of each retro cycle.

## Never Do

- ❌ Force push to `main` (or any shared branch)
- ❌ Commit secrets, API keys, or `.env` files
- ❌ Merge without passing CI
- ❌ Leave unfinished branches indefinitely
- ❌ Use merge commits on feature branches (use rebase for keeping current)
- ❌ Create branches without an issue number
- ❌ Skip the `Closes #N` line in PR descriptions

## Pre-PR Checklist

Before opening a PR (the `/implement` command runs through this):

- [ ] Branch rebased on latest `main`
- [ ] All tests pass (`npm run test`)
- [ ] Lint clean (`npm run lint`)
- [ ] Type-check clean (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Commit messages follow conventional format
- [ ] PR description has `Closes #{issue}`
- [ ] If migrations: `migration-safety` checklist complete