---
name: quality-gate
description: Post-edit validation loop for all code changes. Runs lint, type-check, verifies no hardcoded secrets, confirms Zod validation on inputs. Use after editing any code file to ensure quality standards.
---

# Quality Gate

Run this after editing any code file. Non-negotiable.

## Validation Commands

```bash
# Step 1: Lint and type-check
npm run lint && npm run type-check

# Step 2: Run affected tests (if known)
npm run test -- --changed  # or specific test file
```

## Post-Edit Checklist

After every code change, verify:

- [ ] **TypeScript strict** — no `any` types (use `unknown` + type guards)
- [ ] **Zod validation** — all external inputs validated with Zod schemas
- [ ] **No hardcoded secrets** — no API keys, tokens, or passwords in code
- [ ] **Error handling** — errors caught, logged with context, user-facing messages are safe
- [ ] **Proper HTTP status codes** — 400 for bad input, 401 for unauth, 403 for forbidden, 404 for missing, 500 for server errors

## Zod Validation Rules

```typescript
// ✅ CORRECT: Trim before validation
z.string().trim().min(1, 'Required')

// ❌ WRONG: Validate then trim
z.string().min(1).transform(val => val.trim())
```

All Server Actions, API routes, and form handlers MUST use Zod `safeParse` or `parse`.

## Security Quick-Check

- [ ] No `service_role` used without `supabase.auth.getUser()` verification
- [ ] No `dangerouslySetInnerHTML` without DOMPurify
- [ ] No PII in logs (`console.log` guarded by `NODE_ENV !== 'production'`)
- [ ] Feature flags fail closed (default to `false`)

## When to Skip

Never skip. If lint or type-check fails, fix before proceeding. If a test fails and it's unrelated to your change, document it and move on — but never suppress.
