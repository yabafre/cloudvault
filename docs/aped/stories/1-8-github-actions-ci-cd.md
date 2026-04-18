# Story: 1-8-github-actions-ci-cd — Scaffold GitHub Actions CI + OIDC-authenticated deploy workflow

**Epic:** 1 — Platform Foundation & Contract Layer
**Status:** review
**Ticket:** [KON-89](https://linear.app/koni/issue/KON-89/1-8-scaffold-github-actions-cicd-workflows-ciyml-deployyml)
**Branch:** `feature/KON-89-1-8-github-actions-ci-cd`
**Size:** M (2 pts)

## User Story

**As a** platform engineer, **I want** every pull request gated by a single `ci.yml` workflow (lint → test → build) and every push to `main` to trigger a `deploy.yml` workflow authenticated via GitHub OIDC, **so that** unverified code can never land on `main` and no long-lived AWS credentials ever touch the repository.

## Acceptance Criteria

**AC1 — CI triggers and gates**
- **Given** a pull request targeting `main` (or a direct push to `main`)
- **When** the workflow fires
- **Then** `ci.yml` executes `pnpm lint`, `pnpm test`, and `pnpm build` in order
- **And** the workflow fails (non-zero exit) if any of those three commands fail

**AC2 — Runtime pinning**
- **Given** `ci.yml` or `deploy.yml` runs
- **When** the runner provisions Node and pnpm
- **Then** Node is `20.x` (matches `engines.node` in root `package.json`) and pnpm is `9.x` (matches `packageManager` pin)
- **And** `corepack enable` or `pnpm/action-setup@v4` is used so the pin comes from `package.json`, not the workflow YAML

**AC3 — Prisma client is generated before build/test**
- **Given** `ci.yml` reaches the test or build step
- **When** the step starts
- **Then** `pnpm db:generate` has already run successfully earlier in the job, with `DATABASE_URL` set to a dummy placeholder (`postgresql://user:pass@localhost:5432/stub`) sufficient to satisfy `prisma generate` (no network needed)
- **Rationale:** lessons from story 1-5 — TS typecheck cascades ~30 errors when the Prisma client is missing

**AC4 — pnpm store cache**
- **Given** a second run of `ci.yml` on the same branch within 7 days
- **When** the install step runs
- **Then** the pnpm store is restored from the actions cache keyed by `pnpm-lock.yaml` hash
- **And** cache hit/miss is visible in the job summary

**AC5 — Turborepo remote cache, conditional**
- **Given** repository secrets `TURBO_TOKEN` and `TURBO_TEAM` are configured
- **When** `pnpm build` and `pnpm test` run under turbo
- **Then** those secrets are exported as env vars and turbo uses the remote cache
- **And when** the secrets are absent (fork PRs, new repo)
- **Then** the workflow still succeeds with local cache only — no skipped-step error, no leaked secret reference

**AC6 — Coverage artifact**
- **Given** `pnpm test` completes (pass or fail)
- **When** the step finishes
- **Then** `apps/api/coverage/` and `apps/web/coverage/` (if present) are uploaded as a single `coverage` artifact with retention 14 days
- **And** the upload is `if: always()` so coverage is available even when tests fail

**AC7 — Deploy workflow trigger and gating**
- **Given** a push to `main`
- **When** `ci.yml` completes successfully (or `workflow_dispatch` is invoked manually)
- **Then** `deploy.yml` runs
- **And** `deploy.yml` never runs on forks, pull requests, or feature branches
- **And** `deploy.yml` uses `environment: production` so GitHub enforces the configured manual-approval protection before any deploy job starts

**AC8 — OIDC authentication (no long-lived keys)**
- **Given** any deploy job that needs AWS access
- **When** it authenticates
- **Then** it uses `aws-actions/configure-aws-credentials@v4` with `role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}` and `aws-region: eu-west-3`
- **And** job-level permissions include `id-token: write` and `contents: read` (nothing broader)
- **And** `grep -R "AWS_ACCESS_KEY_ID\|AWS_SECRET_ACCESS_KEY" .github/` returns **zero** matches

**AC9 — Three stub deploy jobs**
- **Given** `deploy.yml`
- **When** inspected
- **Then** it contains three jobs: `deploy-infra`, `deploy-api`, `deploy-lambda`
- **And** each job has `needs: []` wired so they can run in parallel once the environment approval unlocks
- **And** each job has `concurrency: { group: deploy-<job>-prod, cancel-in-progress: false }` so two pushes never race on the same target
- **And** each job body is a documented stub (`echo "TODO: wire in story KON-NN"`) — no real `cdk deploy`, `vercel`, or `aws lambda update-function-code` is invoked in this story
- **And** inline comments reference the follow-up tickets: `deploy-infra` → KON-88, `deploy-lambda` → KON-109, `deploy-api` → a future story in epic 1 (Fargate deploy, TBD)

**AC10 — Least-privilege workflow permissions**
- **Given** `ci.yml`
- **When** inspected
- **Then** top-level `permissions` is `contents: read` only (read-only by default)
- **And given** `deploy.yml`, top-level permissions is also `contents: read` and each deploy job elevates to `id-token: write` locally

**AC11 — Static validation in CI itself**
- **Given** either workflow file
- **When** `actionlint` runs (via `rhysd/actionlint@v1` or `npx -y actionlint`)
- **Then** it reports zero errors
- **And** this `actionlint` check runs as a step inside `ci.yml` so drift is caught on every PR

**AC12 — Composite action for monorepo setup**
- **Given** both `ci.yml` and `deploy.yml` need the same Node + pnpm + install sequence
- **When** they declare it
- **Then** they call a single reusable composite action at `.github/actions/setup-monorepo/action.yml`
- **And** that action takes no inputs (the versions are derived from `package.json`) and performs: checkout → setup-node with pnpm cache → `pnpm install --frozen-lockfile` → `pnpm db:generate`
- **Rationale:** DRY, and the architecture's §4.1 workflow tree will later split `deploy.yml` into `deploy-{infra,api,lambda}.yml` — the composite action makes that split cheap

**AC13 — Secrets documentation**
- **Given** the root `README.md`
- **When** a new engineer onboards
- **Then** a **CI/CD** section documents the four required repository secrets: `TURBO_TOKEN` (optional), `TURBO_TEAM` (optional), `AWS_ROLE_TO_ASSUME`, `VERCEL_TOKEN` (used by a later story — noted as future)
- **And** the section explicitly says "Do **not** create long-lived AWS IAM user keys — auth is OIDC-only"

## Tasks

- [x] Create `.github/actions/setup-monorepo/action.yml` — composite action: checkout (`actions/checkout@v4`), setup-node 20 (`actions/setup-node@v4` with `cache: pnpm`), enable pnpm via `pnpm/action-setup@v4` (version from `package.json`), `pnpm install --frozen-lockfile`, `pnpm db:generate` with dummy `DATABASE_URL` [AC3, AC12]
- [x] Create `.github/workflows/ci.yml` — triggers `pull_request` + `push: { branches: [main] }`; top-level `permissions: contents: read`; single `verify` job using the composite action, then `pnpm lint`, `pnpm test`, `pnpm build` sequentially; conditional `TURBO_TOKEN`/`TURBO_TEAM` env block; coverage upload `if: always()`; final `actionlint` step [AC1, AC2, AC3, AC4, AC5, AC6, AC10, AC11]
- [x] Create `.github/workflows/deploy.yml` — triggers `workflow_run: { workflows: [CI], types: [completed], branches: [main] }` gated by `if: github.event.workflow_run.conclusion == 'success'` + `workflow_dispatch`; top-level `permissions: contents: read`; three jobs `deploy-infra`, `deploy-api`, `deploy-lambda` each with `environment: production`, job-level `permissions: { id-token: write, contents: read }`, `concurrency` group, OIDC `aws-actions/configure-aws-credentials@v4`, and a stub `echo` body referencing the follow-up ticket [AC7, AC8, AC9, AC10]
- [x] Add CI/CD section to root `README.md` listing required repository secrets and the OIDC-only policy [AC13]
- [x] Smoke-test locally: run `actionlint` on both workflow files; composite action validated via YAML parse (actionlint CLI does not lint `action.yml` schema directly) [AC11]
- [x] Verify `grep -RE "AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY" .github/` returns nothing [AC8]

## Dev Notes

### Architecture alignment (LAW)

- **§4.1 Workflow tree** proposes four files: `ci.yml`, `deploy-api.yml`, `deploy-lambda.yml`, `deploy-infra.yml`. The Linear ticket and epics.md AC specify two: `ci.yml`, `deploy.yml`. Reconciled decision for this story (validated with user): **single `deploy.yml` with three jobs named exactly `deploy-infra`, `deploy-api`, `deploy-lambda`**. When those jobs outgrow the single file in a later story, splitting is cheap because the composite action already factors out the setup.
- **§3.x Security headers / Secrets** — no static AWS keys; OIDC federation only.
- **§4.x Risk G (CDK deploy breaks prod, no staging)** — mitigation is `workflow_dispatch` manual trigger + `environment: production` approval gate. This story wires both.
- **§3.8 Testing** — coverage targets (80% backend) are enforced by `/aped-review`, not by CI. CI uploads coverage artifacts; no threshold gate yet.

### OIDC prerequisites (out of scope — document only)

This story does **not** create the AWS IAM role. A follow-up bootstrap step (manual or via `infra/cdk/bin/bootstrap-oidc.ts` in KON-88) must:
1. Add the GitHub OIDC provider to the AWS account (`https://token.actions.githubusercontent.com`).
2. Create an IAM role with a trust policy restricted to `repo:<org>/CloudVault-official:ref:refs/heads/main` and `repo:<org>/CloudVault-official:environment:production`.
3. Attach the least-privilege policies for CDK, Lambda, and Fargate updates.
4. Surface the role ARN as repository secret `AWS_ROLE_TO_ASSUME`.

Until that role exists, `deploy.yml` stub jobs will still pass because the stub bodies are `echo`-only — the real `configure-aws-credentials` call can be left behind `if: ${{ secrets.AWS_ROLE_TO_ASSUME != '' }}` if needed during bootstrap. Flag this in the README.

### Key implementation patterns

**Composite action shape (sketch — not final):**
```yaml
# .github/actions/setup-monorepo/action.yml
name: Setup CloudVault monorepo
description: Checkout, Node 20, pnpm 9, install, prisma generate.
runs:
  using: composite
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      # version is read from packageManager in package.json
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: pnpm
    - shell: bash
      run: pnpm install --frozen-lockfile
    - shell: bash
      env:
        DATABASE_URL: postgresql://user:pass@localhost:5432/stub
      run: pnpm db:generate
```

**CI job shape (sketch):**
```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
      TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
    steps:
      - uses: ./.github/actions/setup-monorepo
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: |
            apps/api/coverage
            apps/web/coverage
          retention-days: 14
      - uses: rhysd/actionlint@v1
```

Note: `uses: ./.github/actions/setup-monorepo` requires the checkout to happen first when called from `ci.yml`. Because the composite action does the checkout itself, it works here — the first step of the composite is the checkout.

**Deploy job shape (sketch):**
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  deploy-infra:
    if: github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    environment: production
    permissions:
      id-token: write
      contents: read
    concurrency:
      group: deploy-infra-prod
      cancel-in-progress: false
    steps:
      - uses: ./.github/actions/setup-monorepo
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
          aws-region: eu-west-3
      - run: echo "TODO: cdk deploy — wired in KON-88 (story 1-7)"
  # deploy-api: similar, TODO ref points to the future API deploy story
  # deploy-lambda: similar, TODO ref points to KON-109 (story 4-5)
```

### Turborepo remote cache (AC5)

`TURBO_TOKEN` and `TURBO_TEAM` are exported at the job `env` block — when absent in the triggering context (e.g. a fork PR without access to secrets), they resolve to empty strings and turbo silently falls back to local cache. No `if:` guard needed. This is the vendor-documented pattern.

### Testcontainers and Docker on GH Actions

Some backend integration tests use Testcontainers (per architecture §3.8). `ubuntu-latest` runners ship with Docker — no extra setup step is required. If a later story adds Lambda container tests, they too run unmodified.

### Scope boundaries — explicitly OUT

- **IAM role / OIDC provider creation in AWS** — belongs to KON-88 (CDK stacks) or a one-time manual bootstrap.
- **Actual CDK / Vercel / Lambda deploy commands** — belong to KON-88, the future api-deploy story, and KON-109 respectively.
- **Branch protection rules** — configured in GitHub UI, not in this repo.
- **Lighthouse CI gate** (architecture §1.2 NFR accessibility) — deferred to a UI-focused story; infrastructure for it is not blocked by this scaffold.
- **Codecov / external coverage service** — this story uploads an artifact only; external integration is a follow-up.
- **Coverage threshold gate in CI** — architecture delegates that enforcement to `/aped-review`, not to CI. Do not add `coverageThreshold` here.

### Dependencies

| Action | Version | Why |
|---|---|---|
| `actions/checkout@v4` | v4 | Current stable, supports partial clone |
| `actions/setup-node@v4` | v4 | Native pnpm cache support |
| `pnpm/action-setup@v4` | v4 | Reads `packageManager` from `package.json` |
| `actions/upload-artifact@v4` | v4 | v3 deprecated end-of-life late 2026 |
| `aws-actions/configure-aws-credentials@v4` | v4 | OIDC support, latest stable |
| `rhysd/actionlint@v1` | v1 | Static check for workflow syntax |

No new repository dependencies. No `package.json` changes expected beyond an optional dev-dep on `actionlint-bin` if we prefer a locally pinned binary — skip for now, use the action.

### Testing strategy

- **Local** — `npx -y actionlint .github/workflows/ci.yml .github/workflows/deploy.yml .github/actions/setup-monorepo/action.yml` must return clean.
- **Repo-level smoke** — after merge, the next PR must turn the CI check green. Because no CI has ever run against this repo, validation is end-to-end by observation on a throwaway PR before landing dependent stories (e.g. 2-1).
- **No unit tests** — YAML workflows are declarative; `actionlint` is the test.

### Ticket integration

- **Commit prefix:** `feat(KON-89): <short description>`
- **Magic words:** `Part of KON-89` in intermediate commits, `Fixes KON-89` in the final commit.
- **PR:** `feat(KON-89): Story 1-8 — GitHub Actions CI + OIDC deploy scaffold` with body `Fixes KON-89`.

### Files to create

- `.github/actions/setup-monorepo/action.yml`
- `.github/workflows/ci.yml` (currently empty — overwrite)
- `.github/workflows/deploy.yml` (currently empty — overwrite)

### Files to modify

- `README.md` — add a CI/CD section listing required secrets (`TURBO_TOKEN`, `TURBO_TEAM`, `AWS_ROLE_TO_ASSUME`) and the OIDC-only policy.

## Dev Agent Record

- **Model:** claude-opus-4-7 (Claude Code)
- **Started:** 2026-04-18
- **Completed:** 2026-04-18

### Debug Log

- **YAML colon parse error in deploy.yml** — initial `run: echo "TODO: ..."` was interpreted as a nested mapping because YAML plain-scalars cannot contain `: ` (colon + whitespace). Fixed by switching to a literal block scalar (`run: |`) and removing the inner colon from the stub text.
- **actionlint rejects `needs: []`** — AC9 asks for literal `needs: []` on each deploy job. actionlint 1.7.12 flags an empty `needs` array as a syntax error. Resolved by omitting the `needs:` key entirely (semantically identical — no `needs` = parallel by default). Added an inline comment in `deploy.yml` explaining the choice.
- **Composite action bootstrap** — local composite actions referenced via `./.github/actions/...` require the repo to be checked out in the workflow *before* the action can be loaded. The workflow therefore runs `actions/checkout@v4` first; the composite also runs `actions/checkout@v4` as its first step (per AC12) so it stays self-contained for future callers. The inner checkout is a ~2s idempotent refresh — acceptable tradeoff for portability.
- **actionlint CLI scope** — actionlint 1.7.12 does not lint composite action (`action.yml`) schema; it only lints workflow files. The composite action YAML is validated via `python3 -c "import yaml; yaml.safe_load(...)"`. The `rhysd/actionlint@v1` action in `ci.yml` lints the two workflow files on every PR, which is what AC11 requires.

### Completion Notes

- All 13 ACs met. `actionlint` passes cleanly on `ci.yml` and `deploy.yml`. `grep -RE "AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY" .github/` returns zero matches (AC8).
- Deploy stubs explicitly reference their follow-up tickets: `deploy-infra` → KON-88 (1-7), `deploy-lambda` → KON-109 (4-5), `deploy-api` → future epic-1 story (Fargate deploy, TBD).
- No real AWS calls or deploys happen yet. Until the OIDC role + provider are bootstrapped (tracked in KON-88), the `configure-aws-credentials@v4` step will fail on a real run — this is expected and acceptable for a scaffold story. The README documents this gap.
- Documented four repository secrets in README: `AWS_ROLE_TO_ASSUME` (required), `TURBO_TOKEN`/`TURBO_TEAM` (optional), `VERCEL_TOKEN` (future).
- No `package.json` changes, no new dependencies added.
- The ci.yml `verify` job relies on `pnpm install --frozen-lockfile` to detect lockfile drift (fails the job if `pnpm-lock.yaml` is out of sync).
- **React Grab / visual verification:** N/A — this is a pure DevOps story with zero frontend code.

### File List

**Created:**
- `.github/actions/setup-monorepo/action.yml`
- `.github/workflows/ci.yml` (was empty, now populated)
- `.github/workflows/deploy.yml` (was empty, now populated)

**Modified:**
- `README.md` — added `## ⚙️ CI/CD` section (workflows list, required secrets table, OIDC-only policy)
- `docs/aped/state.yaml` — story `1-8-github-actions-ci-cd` status: `pending` → `in-progress` → `review`
- `docs/aped/stories/1-8-github-actions-ci-cd.md` — status, tasks checked, Dev Agent Record filled
- `.aped/WORKTREE` — created (worktree marker for APED engine)
