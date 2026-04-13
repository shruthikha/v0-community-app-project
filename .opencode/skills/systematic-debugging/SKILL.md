---
name: systematic-debugging
description: Root cause analysis methodology and debug loop protocol. Use whenever code fails verification, tests fail, or unexpected behavior occurs. Includes 4-phase investigation, 5 Whys, bug categorization, tool selection, anti-patterns, and the 3-iteration loop limit before user escalation.
---

# Systematic Debugging

> "Don't guess. Investigate systematically. Fix the root cause, not the symptom."

## Core Mindset

- **Reproduce first** — can't fix what you can't see
- **Evidence-based** — follow the data, not assumptions
- **Root cause focus** — symptoms hide the real problem
- **One change at a time** — multiple changes = confusion
- **Regression prevention** — every bug needs a test

---

## The 4-Phase Process

### Phase 1: REPRODUCE
- Get exact reproduction steps
- Determine reproduction rate (100%, intermittent, environment-specific)
- Document expected vs actual behavior
- If you can't reproduce, you can't verify a fix — gather more data first

### Phase 2: ISOLATE
- When did it start? Check `git log` for recent changes. Use `git bisect` if needed.
- Which layer? Frontend → API → Database → External service
- Create minimal reproduction case
- Binary search: find a working point, find a failing point, check the middle, repeat

### Phase 3: UNDERSTAND (Root Cause)
- Apply the 5 Whys technique (see below)
- Trace data flow end-to-end
- Identify the actual bug, not just the symptom

### Phase 4: FIX & VERIFY
- Fix the root cause, not the symptom
- Verify the fix resolves the original reproduction
- Add regression test that would catch this if it recurred
- Check for similar issues — if the bug existed in one place, does it exist in others?

---

## Bug Categorization

### By Error Type

| Error Type | Investigation Approach |
|------------|----------------------|
| Runtime Error | Read stack trace, check types and nulls |
| Logic Bug | Trace data flow, compare expected vs actual |
| Performance | Profile first, then optimize |
| Intermittent | Look for race conditions, timing issues |
| Memory Leak | Check event listeners, closures, caches |
| Auth/RLS | Check tenant context, JWT claims, policy definitions |
| Hydration | Server vs client rendering mismatch — check `Date.now()`, `Math.random()`, browser-only APIs |

### By Symptom

| Symptom | First Steps |
|---------|------------|
| "It crashes" | Get stack trace, check error logs |
| "It's slow" | Profile, don't guess |
| "Sometimes works" | Race condition? Timing? External dependency? |
| "Wrong output" | Trace data flow step by step |
| "Works locally, fails in prod" | Environment diff, check env vars and configs |
| "Empty results" | Check RLS, check tenant_id, check JWT claims |
| "Permission denied" | Check RLS policies, auth state, role assignments |

---

## The 5 Whys

Keep asking "why" until you reach a root cause that's actually fixable.

```
WHY is the user seeing a blank screen?
→ Because the component throws during render.

WHY does it throw?
→ Because user.tenant_id is undefined.

WHY is tenant_id undefined?
→ Because the JWT doesn't include it.

WHY doesn't the JWT include it?
→ Because the user was created before tenant_id was added to claims.

WHY wasn't this caught?
→ Because there's no migration to backfill existing users. ← ROOT CAUSE
```

The fix is the migration, not a null check in the component.

---

## Tool Selection

### Frontend Issues

| Need | Tool |
|------|------|
| See network requests | Browser Network tab |
| Inspect DOM state | Browser Elements tab |
| Debug JavaScript | Browser Sources tab + breakpoints |
| Performance analysis | Browser Performance tab |
| Memory investigation | Browser Memory tab + heap snapshots |
| React state inspection | React DevTools |

### Backend Issues

| Need | Tool |
|------|------|
| See request flow | Console logging, request middleware |
| Debug step-by-step | Node `--inspect` |
| Find slow queries | Supabase logs, query EXPLAIN |
| Trace server actions | Build log + console output |
| Find regression | `git bisect` |

### Supabase / RLS Issues

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies on a table
SELECT * FROM pg_policies WHERE tablename = 'events';

-- Test as a specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"tenant_id": "uuid-here"}';
SELECT * FROM events;
```

### Mastra / Río Issues

- Check `initRls()` was called before agent queries
- Verify `tenant_id` propagated through agent context
- Check embedding dimensions match the vector column
- Review Mastra logs on Railway dashboard

### Next.js Server Component Issues

- **Stale data**: Check if `export const dynamic = 'force-dynamic'` is set
- **Hydration mismatch**: Server and client rendering different content
- **Auth in middleware**: Ensure `/auth/*` paths are skipped in middleware
- **Redirect URL wrong**: Use `x-forwarded-host` header, not `request.url`

---

## The Debug Loop Protocol (for /implement and /ship)

When code fails verification (quality gate, tests, manual checkpoint), follow this loop:

### Iteration Structure

```
Iteration 1:
  1. Capture failure: error message, stack trace, what was expected
  2. Run Phases 1-3 (reproduce, isolate, understand) — quickly if it's obvious
  3. Dispatch to relevant specialist with: failure context + suspected root cause + suggested fix
  4. Specialist applies fix
  5. Re-run verification
  6. If pass → done, log iteration to build log, continue workflow
  7. If fail → go to Iteration 2

Iteration 2:
  Same as Iteration 1, but:
  - Reference what was tried in Iteration 1 and why it didn't work
  - Look for what was missed (different layer, different assumption)
  - May involve a different specialist (e.g., if iteration 1 was backend, iteration 2 might be database)

Iteration 3:
  Same structure, but:
  - This is the LAST automatic iteration
  - If this fails, stop and escalate to user
```

### Escalation After 3 Iterations

If 3 iterations don't resolve the issue, **stop and escalate to the user**. Do not silently continue looping. The escalation message must include:

```markdown
## Debug Escalation: {task or feature}

**Iterations attempted:** 3
**Issue:** {one-sentence summary}

### What was tried
1. **Iteration 1:** {hypothesis} → {fix attempted} → {why it failed}
2. **Iteration 2:** {hypothesis} → {fix attempted} → {why it failed}
3. **Iteration 3:** {hypothesis} → {fix attempted} → {why it failed}

### Current state
- Files modified: {list}
- Test/verification status: {what's still failing}
- Suspected root cause: {best current guess}

### Why I'm escalating
{e.g., "the failures suggest an architectural mismatch I can't resolve without scope changes" or "the error class is outside my training context"}

### Options for the user
- **Continue debugging** (1-2 more iterations with new hypothesis)
- **Roll back changes** and try a different approach
- **Pause workflow** and explore more deeply via /investigate
- **Adjust scope** in the spec/plan
```

### Early Escalation (Before 3 Iterations)

Some bug classes warrant escalation BEFORE the 3-iteration limit:
- **Architectural mismatch** — the spec or plan is fundamentally incompatible with the existing system
- **Out-of-scope dependency** — fixing this requires touching unrelated systems
- **Data integrity risk** — the fix could corrupt existing data
- **Security implications** — the bug exposes a vulnerability that needs design discussion
- **Repeated identical failures** — if iterations 1 and 2 produced the exact same failure mode, more iterations won't help

When escalating early, use the same template but note "Escalating early because: {reason}".

---

## Defense in Depth Verification

After fixing, verify at multiple layers:

1. **Unit test** — does the function behave correctly?
2. **Integration test** — does the API return the right response?
3. **Manual test** — does the user flow work end-to-end?
4. **Similar code check** — are there other instances of the same bug pattern?

---

## Condition-Based Waiting (Not Sleep)

When debugging timing issues:

```typescript
// ❌ WRONG: Sleep and hope
await new Promise(resolve => setTimeout(resolve, 5000));

// ✅ CORRECT: Wait for condition
async function waitFor(condition: () => Promise<boolean>, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return;
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Condition not met within timeout');
}
```

---

## Anti-Patterns

| ❌ Anti-Pattern | ✅ Correct Approach |
|-----------------|---------------------|
| Random changes hoping to fix | Systematic investigation |
| Ignoring stack traces | Read every line carefully |
| "Works on my machine" | Reproduce in same environment |
| Fixing symptoms only | Find and fix root cause |
| No regression test | Always add test for the bug |
| Multiple changes at once | One change, then verify |
| Guessing without data | Profile and measure first |
| Silent looping past 3 iterations | Stop and escalate to user |

---

## Debugging Checklists

### Before Starting
- [ ] Can reproduce consistently
- [ ] Have error message / stack trace
- [ ] Know expected behavior
- [ ] Checked recent changes (`git log`)

### During Investigation
- [ ] Following the 4 phases in order
- [ ] Hypothesis written down before testing
- [ ] One change at a time
- [ ] Logging cleaned up between attempts

### After Fix
- [ ] Root cause documented in build log
- [ ] Fix verified against original reproduction
- [ ] Regression test added
- [ ] Similar code checked for same bug
- [ ] Debug logging removed
- [ ] Build log updated with iteration count

---

## Build Log Documentation

After debugging, document in the active build log:

```markdown
## Debug: {Issue Description}

**Iterations:** {N}
**Root Cause:** {one sentence}
**5 Whys:** {chain of causation}
**Fix:** {what was changed, files affected}
**Regression Test:** {test file/name added or "n/a"}
**Similar Code Checked:** {Yes/No — what was found}
**Time invested:** {rough estimate}
```

---

## When to Use This Skill

Load and follow this skill whenever:
- A quality gate fails (lint, type-check, test)
- A manual test checkpoint reveals a problem
- Tests fail in `/ship` Phase 1
- Unexpected behavior reported during development
- Production error analysis needed
- Performance bottleneck identification
- Intermittent or flaky test investigation
- "It works on my machine" reports

Commands that invoke this skill: `/implement` (per-task loop), `/ship` (QA failure recovery), `/audit` (when investigating findings), and any direct user request involving debugging.