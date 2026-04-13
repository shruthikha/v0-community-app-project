---
name: verification-before-completion
description: Ensure work is actually done before declaring it complete. Verifies the original problem is solved (not just that tests pass), checks for regressions, and confirms the user's intent was met. Hybrid of Superpowers verification-before-completion.
---

# Verification Before Completion

"Done" means the original problem is solved, not just that the code compiles.

## When to Use

- Before marking any task, workflow, or PR as complete
- After fixing a bug (does the original user problem go away?)
- After implementing a feature (does it actually work end-to-end?)
- Before the orchestrator synthesizes a final report

## The Verification Checklist

### 1. Original Problem Solved?

Go back to the original issue, spec, or user request. Re-read it. Does the implementation actually address it?

Common failure: fixing a symptom while the root problem persists. Or building something adjacent to what was asked.

### 2. Quality Gate Passes?

```bash
npm run lint && npm run type-check && npm run test
```

All three must pass. No exceptions. No "I'll fix lint later."

### 3. Manual Verification (If Applicable)

For user-facing changes:
- Can a user actually complete the flow?
- Do error states work? (not just happy path)
- Does it work on mobile? (check responsive)
- Does it work with different tenant contexts? (multi-tenancy)

### 4. Regression Check

Did you break anything that was working before?

- Run the full test suite, not just the tests you wrote
- Check adjacent functionality (if you changed auth, does login still work?)
- If migration applied: do existing queries still return correct data?

### 5. Wiki Freshness

Did your changes invalidate any wiki entries?

- Check `knowledge/wiki/patterns/` for patterns related to your change
- Check `knowledge/wiki/tools/` for tool docs related to your change
- If stale: update or note in `knowledge/wiki/documentation-gaps.md`

### 6. Build Log Complete?

Is the build log up to date with:
- What was done
- Decisions made
- Artifacts created
- Remaining items (if any)

## The "Ship It" Moment

Only declare complete when:

```markdown
## Verification: [Task/Feature]

- [x] Original problem addressed (re-read the issue)
- [x] Quality gate passes (lint, types, tests)
- [x] Manual verification done (if user-facing)
- [x] No regressions found
- [x] Wiki checked for staleness
- [x] Build log updated
- [x] Ready for review / merge
```

## Common Traps

- ❌ "Tests pass" ≠ "It works" (tests might not cover the actual user scenario)
- ❌ "It works locally" ≠ "It works in staging" (env differences, RLS, etc.)
- ❌ "The code is clean" ≠ "The feature is complete" (missing edge cases)
- ❌ "No errors in console" ≠ "The user experience is good" (silent failures)

## Defense in Depth

Verify at multiple layers:

| Layer | Check |
|-------|-------|
| **Code** | Types compile, lint passes |
| **Tests** | Unit + integration + E2E pass |
| **Runtime** | Dev server runs without errors |
| **User** | The actual flow works as intended |
| **Data** | Database state is correct after operation |
| **Docs** | Wiki and docs reflect the change |
