# Dependency Pinning and Supply Chain Risk

> Unpinned dependencies create unpredictable builds and open supply chain attack vectors.

## The Problem

```json
{
  "dependencies": {
    "@supabase/ssr": "latest",
    "@supabase/supabase-js": "latest",
    "@tiptap/core": "latest",
    "@tiptap/pm": "latest"
  }
}
```

11 packages pinned to `latest` in the Ecovilla codebase.

## Risks

| Risk | Impact |
|------|--------|
| **Unpredictable builds** | `npm install` today ≠ `npm install` tomorrow |
| **Supply chain attacks** | Compromished package version auto-deployed |
| **No rollback path** | Can't revert to "yesterday's working version" |
| **Silent breaking changes** | Major version bumps without migration |
| **CI/CD irreproducibility** | Builds differ between local and CI |

## Correct Pattern

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.49.1",
    "@tiptap/core": "^2.11.5",
    "@tiptap/pm": "^2.11.5"
  }
}
```

## Automated Update Strategy

### Dependabot
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

### Renovate
```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    }
  ]
}
```

## CI Reproducibility

```bash
# In CI — use npm ci for reproducible installs
npm ci
# NOT npm install (which can update lockfile)
```

## Regular Audits

```bash
npm audit          # Check for known vulnerabilities
npm audit fix      # Auto-fix compatible vulnerabilities
npm outdated       # See available updates
```

## Related Patterns

- `patterns/ci-cd-requirements.md` — CI/CD pipeline setup
- `patterns/build-config-security.md` — Build configuration security
