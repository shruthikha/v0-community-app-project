# Build Configuration Security — Dangers of ignoreBuildErrors

> Build-time quality gates are the last line of defense before production. Disabling them is equivalent to removing the brakes before driving.

## The Problem

```typescript
// next.config.mjs — DANGEROUS
const nextConfig = {
  ignoreDuringBuilds: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}
```

This configuration:
- **Deploys broken code** — TypeScript errors, ESLint violations, and type mismatches reach production
- **Nullifies all quality controls** — `strict: true` in tsconfig becomes meaningless
- **Creates false confidence** — developers see "build passed" and assume code is safe
- **Enables supply chain attacks** — type errors from compromised dependencies go unnoticed

## Why It Exists

Typically added as a temporary workaround when:
- Type error backlog is too large to fix before a deadline
- CI/CD pipeline doesn't exist, so "at least it deploys"
- v0.dev scaffold defaults (common in AI-generated projects)

## The Risk Matrix

| Control | Status with ignoreBuildErrors | Risk |
|---------|------------------------------|------|
| TypeScript strict mode | ✅ Configured, ❌ Not enforced | Type errors silently ignored |
| ESLint rules | ✅ Configured, ❌ Not enforced | Code quality violations deployed |
| `no-explicit-any` rule | ✅ Configured, ❌ Not enforced | Type safety bypassed everywhere |
| Import ordering | ✅ Configured, ❌ Not enforced | Inconsistent codebase |

## Remediation Path

### Step 1: Remove the flags
```typescript
// next.config.mjs — SAFE
const nextConfig = {
  // No ignoreDuringBuilds
  // No ignoreBuildErrors
}
```

### Step 2: Fix the backlog (or defer strategically)
If the backlog is too large, fix incrementally:
1. Run `npm run type-check` to see all errors
2. Fix critical paths first (auth, data layer, API routes)
3. Use `@ts-expect-error` with comments for known issues
4. Track remaining errors in a refactoring backlog

### Step 3: Add CI pipeline
```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build
```

### Step 4: Enable branch protection
Require status checks to pass before merging to `main`.

## Related Patterns

- `patterns/ci-cd-requirements.md` — Full CI/CD pipeline setup
- `patterns/dependency-pinning.md` — Prevents supply chain attacks
- `tools/supabase-security-checklist.md` — Security verification checklist
