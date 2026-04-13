source: requirement
imported_date: 2026-04-08
---
# Implement Supabase DEV to stop working in PROD
> **Issue**: [GH-76](https://github.com/mjcr88/v0-community-app-project/issues/76)

## Problem Statement
Currently, all development work is performed directly on the `nido.prod` production database. This poses critical risks:
1.  **Data Integrity Check**: Accidental deletions or schema changes can cause immediate production outages.
2.  **Security Vulnerability**: Developers have superuser access to real user data (PII).
3.  **Audit Failure**: External audits flag this as a "Critical" failure for SOC 2 and other compliance standards.
4.  **No Testing Ground**: Cannot safely test dangerous operations (like RLS policy changes) without risking live users.

## User Persona
*   **Primary**: DevOps Engineer / Lead Developer
*   **Secondary**: Backend Developer (needs safe place to break things)

## Context & Background
Recent audits (`database_audit.md` and `devops_audit.md`) identified this as a "Critical Debt".
*   **Database Audit**: Found RLS disabled on core tables and public buckets. Fixing this in PROD directly is dangerous.
*   **DevOps Audit**: Found no CI/CD pipeline and reliance on manual updates.

The goal is to establish a "Secure by Default" pipeline where development happens in a safe `DEV` environment, and changes are promoted to `PROD` via automated or controlled processes (migrations).

## Dependencies
*   **Supabase Project**: Need to create a new project for DEV.
*   **Environment Variables**: Need to separate `.env` into `.env.local` (local dev) and `.env.production` (live).
*   **CI Code**: Need to standardize `package.json` scripts to support different targets.

## Issue Context
*   **Related Audits**:
    *   `docs/07-product/00_audits/jan_26_codebase_audit/database_audit.md`
    *   `docs/07-product/00_audits/jan_26_codebase_audit/devops_audit.md`
*   **Missing Documentation**: No current "Deployment Guide" or "Environment Setup" guide exists.

## Technical Options

### Option 1: Manual Clone (The "Quick Fix")
Create a new Supabase project (`nido-dev`) manually via the dashboard and copy schemas/data using `pg_dump` and `psql`.
*   **Pros**:
    *   **Speed**: Fastest to set up (< 1 hour) as it requires no code changes.
    *   **Simplicity**: No need to learn Supabase Actions or config management yet.
*   **Cons**:
    *   **High Risk of Drift**: Schemas will instantly diverge without automation.
    *   **Manual Toil**: Every prod change requires manual repetition in dev (and vice versa).
    *   **Audit Gap**: No record of who changed schema when.
*   **Effort**: Low (XS)

### Option 2: CLI-Driven GitOps (The "Standard")
Initialize Supabase CLI locally, linking to both `prod` and `dev` projects. Use migration files (`supabase/migrations`) as the source of truth. Deploy via GitHub Actions.
*   **Pros**:
    *   **Robustness**: Standard industry practice for infrastructure.
    *   **Safety**: "Code is Law". No schema changes happen outside of checked-in migration files.
    *   **Reversibility**: Can rollback bad migrations easily.
*   **Cons**:
    *   **Complexity**: Requires setting up GitHub Actions and managing secrets.
    *   **Workflow Change**: Developers must stop making manual table edits in the UI.
*   **Effort**: Medium (M) - 2-3 Days setup & testing.

### Option 3: Supabase Native Branching (The "Modern" Way)
Enable Supabase's native Branching feature (requires Team/Pro plan + potential addon costs). This spins up a full database instance for every Git Branch.
*   **Pros**:
    *   **Developer Experience**: Magical "Preview Deployments" for databases.
    *   **Safety**: Absolute isolation per feature.
*   **Cons**:
    *   **Cost**: Significantly higher cost (compute per branch).
    *   **Overkill**: We likely only need one stable `DEV` environment, not N ephemeral ones yet.
*   **Effort**: Low (S) - Configuration is easy, but billing admin is required.

## Recommendation

### Selected Option: Option 2 (CLI-Driven GitOps)
We will proceed with **Option 2**. While Option 3 is exciting, the project currently lacks basic CI/CD foundations. Option 2 forces us to build that foundation (Repo -> CI -> Prod) which is a prerequisite for a mature "DevOps" grading. It directly answers the Audit's call for "Automated Migrations".

### Classification
*   **Priority**: P0 (Critical Infrastructure)
*   **Size**: M (Medium - requires learning CLI + GitHub Actions setup)
*   **Horizon**: Q1 26 (Immediate)

## 8. Technical Review

### Phase 0: Context & History
*   **Current State**: Project has no `supabase` CLI configuration, no `.github` workflows, and no automated migration capability.
*   **Infrastructure**: `package.json` does not differentiate environments.
*   **Risk**: High risk of data loss or service interruption due to manual production edits.
*   **Gap Analysis**:
    *   Missing `supabase/config.toml`
    *   Missing `.github/workflows/production.yaml`
    *   Missing `.github/workflows/preview.yaml`

### Phase 1: Security Audit
*   **Vibe Check**: `lib/supabase-storage.ts` uses proper environment-based client initialization. No secrets found in code.
*   **Attack Surface**: 
    *   **CI/CD Secrets**: High risk of leaking Supabase Service Role keys in GitHub Action logs if not properly masked.
    *   **Scope**: Access tokens must be scoped.
    *   **RLS**: Migrations must apply RLS policies immediately.
*   **Verification**: `.gitignore` correctly excludes `.env*` files.

### Phase 2: Test Strategy
*   **Sad Path Analysis**:
    *   **Drift**: Production schema changed manually -> Migration fails. Solution: `supabase db diff` check in CI.
    *   **Auth Failure**: CI runner token expires. Solution: Service Account usage.
*   **Test Plan**:
    *   **Unit**: Mock `deploy.sh` logic.
    *   **Integration**: Run migrations on a temporary Supabase Branch (or `nido.dev`) before promotion.
    *   **E2E**: Full deployment pipeline test on staging branch.

### Phase 3: Performance & Infrastructure
*   **Current Infrastructure**:
    *   `nido.prod` (Active)
    *   `nido.dev` (Inactive/Paused) - **ACTION**: Restore this project for the CLI Implementation.
*   **Performance**: CLI migrations are performant, but ensure lock timeouts are configured to avoid downtime during index creation.

### Phase 4: Documentation Plan
*   **New Guide**: `docs/02-technical/infrastructure/supabase-cli.md` (Setup & Usage).
*   **New Guide**: `docs/02-technical/infrastructure/github-actions.md` (CI/CD Workflows).
*   **Update**: `docs/01-manuals/dev-guide.md` (How to contribute schema changes).

