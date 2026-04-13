---
name: ship
description: QA verification, debug loop on failures, manual smoke test, security review, release notes, merge with issue closure. Ships a feature from draft PR to merged main.
temperature: 0.2
---

# Command: /ship

QA verification and release. Ships from draft PR to merged main with proper closure.

Shipping: $ARGUMENTS

---

## Phase 0: Socratic Gate

**Create a TodoWrite list now with one item per phase of this command. Mark Phase 0 as in_progress.**

Load and follow the `socratic-gate` skill.

**Key questions:**

1. **What are we shipping?** — Feature name, PR number, or issue number
2. **Any migrations in this PR?** — Yes → migration safety REQUIRED
3. **Critical paths to verify?** — Must-pass user flows for the manual smoke test
4. **Known issues or limitations?** — Things to document but not block on

PR status: !`gh pr status 2>/dev/null`
Current branch: !`git branch --show-current`

**Wait for user response before proceeding.**

---

## Phase 1: QA Verification

Load and follow the `workflow-methodology` skill for standard protocols.
Before running QA, load and follow the `assume-nothing` skill. Verify the PR's claimed changes match what's actually committed.

**Dispatch to `@qa-engineer` via Task tool** to run automated verification:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

The qa-engineer returns: PASS or FAIL with details.

### If FAIL → enter debug loop

Load and follow the `systematic-debugging` skill.

**Iteration 1:**
1. Capture which check failed and the error output
2. Identify the layer (lint = style, type-check = types, test = behavior, build = config)
3. Dispatch to relevant specialist with failure context
4. Re-run the failed check
5. If pass → continue to Phase 2. If fail → Iteration 2.

**Iterations 2-3:** Same structure, reference what was tried.

**After 3 iterations failed:** Stop and escalate to user using the escalation template from `systematic-debugging`. Update the build log with full iteration history.

**Do NOT proceed to Phase 2 with red checks.**

---

## Phase 2: Migration Safety

**Only if there are migrations in the PR.**

Load and follow the `migration-safety` skill.

- [ ] Migration file exists in `supabase/migrations/`
- [ ] RLS enabled on new tables
- [ ] tenant_id on user-facing tables
- [ ] Rollback script ready
- [ ] Zero-downtime compatible

**Verify against staging Supabase first.** If staging apply fails, stop and debug — do not proceed to merge.

---

## Phase 3: Security & Code Review

### CodeRabbit findings

Load and follow the `coderabbit-ingest` skill.

Check CodeRabbit comments on the PR via GitHub MCP. For each finding:
- Fixed in latest commit, or
- Acknowledged with reason

### Security check

**If the PR touches auth, RLS, sensitive data, payment flows, or user PII**, dispatch to `@security-auditor` via Task tool.

Pass: the PR diff scope, files touched, and specific concerns to validate (e.g., "verify RLS policies on new tables", "check input validation in new server action").

The security-auditor returns findings. Address blockers before proceeding to Phase 4.

**Skip this dispatch** for non-sensitive PRs (UI-only changes, refactoring, doc updates).

---

## Phase 4: Manual Smoke Test

Before merging, the user verifies the deployed branch end-to-end.

### Setup

Present to user:

```markdown
## Manual Smoke Test

The branch is ready for final verification. Please:

1. Pull the latest branch:
   `git checkout {branch} && git pull`
2. Run dev server: `npm run dev`
3. Walk through the critical paths from Phase 0:
   - {path 1}
   - {path 2}
   - {path 3}

### What to test
{Specific things based on what changed in the PR}

### What "pass" looks like
- All critical paths complete without errors
- No console errors in browser dev tools
- No regressions in adjacent functionality

**Reply with:**
- ✅ "pass" → I'll proceed to release notes and merge
- ❌ "fail: {what's wrong}" → I'll enter debug loop
- ⏸ "pause" → I'll save state and stop
```

**Wait for user response.**

### If FAIL → debug loop

Same structure as Phase 1 debug loop. Up to 3 iterations, then escalate.

The debug loop here can dispatch to any specialist depending on what failed — this is the most cross-cutting failure point in the entire workflow.

---

## Phase 5: Release Notes

Load and follow the `release-notes-draft` skill. It produces three outputs:

1. **Technical note** → appended to build log in `knowledge/raw/build-logs/`
2. **User-facing note** → `docs/user/releases/YYYY-MM-DD-{feature}.md`
3. **UserJot draft** → `knowledge/raw/userjot-drafts/YYYY-MM-DD-{feature}.md`

For user-facing content (outputs 2 and 3), load and follow the `tone-of-voice-compliance` skill — bilingual (English + Spanish), warm, clear, no jargon.

**Skip outputs 2 and 3** for internal-only changes (refactoring, CI/CD, test infrastructure, doc-only changes).

---

## Phase 6: Merge

Load and follow the `git-workflow` skill.

### Pre-merge checklist

- [ ] All tests pass
- [ ] Migration verified against staging (if applicable)
- [ ] CodeRabbit addressed
- [ ] Security review complete (if applicable)
- [ ] Manual smoke test passed
- [ ] Release notes drafted
- [ ] PR body has `Closes #{issue}`
- [ ] User explicitly approved merge

### Confirm with user

> "Ready to merge PR #{number} to main. This will:
> - Auto-close issue #{issue}
> - Auto-delete branch `{branch}`
> - Trigger Vercel deploy of main
> - Run post-merge GitHub Actions (wiki compile, migration apply if applicable)
>
> Confirm? (yes/no)"

**Wait for explicit user confirmation before merging.**

### Merge

Via GitHub MCP:

```bash
gh pr merge {pr-number} --squash --delete-branch
```

After merge:
- Issue auto-closes (because of `Closes #N`)
- Branch auto-deletes (because of `--delete-branch`)
- Vercel auto-deploys main
- GitHub Actions run if configured (post-merge wiki compile, migration apply)

### Tag release (if applicable)

For versioned releases:

```bash
git checkout main
git pull
git tag v{version}
git push origin v{version}
```

---

## Phase 7: Closeout

### Update issue (post-merge verification)

Via GitHub MCP:
- Verify the issue auto-closed
- If it didn't, close manually with comment linking to merged PR
- Add label `done`
- Comment with: shipped commit hash, deploy URL, release notes link

### Standard closeout skills

- `auto-doc-update` — final doc check
- `refactoring-opportunity-capture` — note any opportunities surfaced during QA
- `workflow-recommender` — likely recommends monitoring deployment, then `/retro` if overdue

### Final build log entry

Append a closeout entry with:
- Merge commit hash
- Deploy URL (Vercel)
- Total debug iterations across phases
- Manual checkpoint outcomes
- Workflow state: shipped

Mark all TodoWrite items completed. Workflow done.