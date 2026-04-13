---
title: Create GitHub Actions CI pipeline
status: open
created: 2026-04-11
updated: 2026-04-11
effort: medium
category: security
module: .github/workflows/
---

# Create GitHub Actions CI pipeline

## Finding
There is no `.github/workflows/` directory. The project has zero CI/CD automation. Vercel auto-deploys from `main` with zero gates — no PR checks, no test runs, no security scanning, no dependency auditing.

## Files
- `.github/workflows/` — missing entirely

## Suggested fix
Create `.github/workflows/ci.yml` with jobs for:
1. **Security scan** — gitleaks for secrets, `npm audit` for vulnerabilities
2. **Quality gate** — `npm run lint`, `npm run type-check`, `npm run build`
3. **Test suite** — `npm run test -- --run`, Playwright E2E tests

Also:
- Enable branch protection on `main` (require PR reviews, status checks, signed commits)
- Add `.github/dependabot.yml` for automated dependency updates
- Add `.github/PULL_REQUEST_TEMPLATE.md`

## Priority
🔴 CRITICAL — Identified as C3 in the CI/CD cross-cutting audit (audit_2026-04-11_cicd_crosscutting.md)
