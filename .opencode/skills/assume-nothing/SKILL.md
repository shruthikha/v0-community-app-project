name: assume-nothing
description: Verify codebase state before making changes. Never trust that the code matches the spec, plan, or documentation. Always read what's actually there before acting. Catches drift between intent and reality.
---

# Assume Nothing

Plans, specs, and docs describe what code is *supposed* to look like. The code itself describes what it *actually* looks like. These two are rarely in perfect sync.

Before touching code, verify the code's actual state. Don't trust the description.

## When to Use

Load and follow this skill whenever:
- You're about to modify a file based on a spec or plan
- You're about to add a feature that interacts with existing code
- You're about to refactor based on a refactoring opportunity captured days or weeks ago
- You're about to fix a bug based on a description (the code may have already changed)
- You're entering a debug loop and forming hypotheses about why something failed

## The Verification Checklist

Before any code change, check:

### 1. Does the file still exist where the spec says it does?
Files get moved, renamed, deleted. The spec was written at a point in time. The code has moved on.

```bash
ls path/from/spec/file.ts
```

If not, search for it:
```bash
find . -name "file.ts" -not -path "*/node_modules/*"
```

### 2. Does the function/component/type still exist with the same signature?
Functions get renamed, parameters change, return types shift. Read the actual current signature before calling it or modifying it.

```bash
grep -n "functionName" path/to/file.ts
```

Then read the file. Don't trust the spec's claim about how it works.

### 3. Are the imports and dependencies still what the spec assumed?
Packages get upgraded, imports change paths, deprecated APIs get removed.

```bash
grep -A2 "import" path/to/file.ts | head -20
```

### 4. Has the file been touched recently?
If a file was modified in the last few days, the spec may already be stale.

```bash
git log --oneline -5 path/to/file.ts
```

If you see commits between when the spec was written and now, **read those commits** to understand what changed.

### 5. Are there related changes you don't see in the spec?
Search for the function/class name across the whole codebase. There may be callers, tests, or related modules that need updating in sync — but the spec didn't mention them because they didn't exist when the spec was written.

```bash
grep -rn "functionName" --include="*.ts" --include="*.tsx"
```

### 6. Does the database schema match what the spec assumes?
If the spec references columns, tables, or RLS policies, verify them in the actual schema:

```bash
cat supabase/migrations/$(ls supabase/migrations/ | tail -1)
```

Or query the live schema via Supabase MCP if available.

## What to Do When Reality Disagrees with the Plan

You will find drift. When you do:

**Small drift** (renamed function, moved file, slightly different signature):
- Note it in the build log
- Adapt your work to match reality
- Continue

**Medium drift** (the function does something different than the spec assumed, the schema has extra columns, the file structure is reorganized):
- Stop and tell the user: "The spec says X but the code shows Y. Here's the difference. Should I (a) follow the spec and change the code to match, (b) follow the code and adapt the plan, or (c) discuss?"
- Wait for direction before continuing

**Large drift** (the feature you're supposed to build already partially exists, the spec assumes architecture that's been replaced, the dependency the spec relies on has been removed):
- Stop completely
- Escalate to the user
- Recommend re-running `/spec` or `/plan` against current reality

## The Mindset

Treat the spec like a treasure map drawn last month. The X marks where treasure was. Maybe it's still there. Maybe someone moved it. Maybe the cave collapsed. **Walk in with eyes open.**

Plans are valuable because they capture intent. They're dangerous because they capture intent **at a point in time** and the world keeps moving.

## Anti-Patterns

| ❌ Wrong | ✅ Right |
|---------|---------|
| "The plan says modify `lib/auth/validate.ts`" → modify it | Read the file first. Verify it exists and does what the plan claims. |
| "The spec mentions `users.tenant_id`" → write a query using it | Check the current schema. Maybe it's `users.tenant` now, or maybe RLS handles it differently. |
| "I'll add this feature next to the existing one" → assume the existing one works as documented | Read the existing one. Test it briefly. Then add yours next to it. |
| "The bug is probably in X" → start fixing X | Reproduce the bug. Confirm the failure happens where you think. Then fix. |
| "This refactoring opportunity from 3 weeks ago is still valid" → start refactoring | Re-verify the file still has the issue. Code may have already changed. |

## Integration with Other Skills

- `systematic-debugging` — Phase 1 (Reproduce) is an instance of this skill applied to a bug. Same principle: don't assume the bug exists where the report says, verify it.
- `verification-before-completion` — checks AFTER work is done. This skill checks BEFORE work starts. They bookend the work.
- `migration-safety` — for database changes, this skill's "verify schema" step is essential before drafting a migration.

## When Not to Use

- Trivial documentation changes (typos, link fixes) — the cost of verification exceeds the cost of being wrong
- Pure UI text changes (copy edits) — same logic
- Auto-generated files (don't verify, don't edit them anyway)

For everything else, verify first.