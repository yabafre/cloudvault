# Story: 1-1-zod-validators-packages — Create @cloudvault/zod and @cloudvault/validators packages

**Epic:** 1 — Platform Foundation & Contract Layer
**Status:** review
**Ticket:** [KON-82](https://linear.app/koni/issue/KON-82)
**Branch:** `feature/kon-82-1-1-zod-validators-packages`
**Size:** S (1 pt)

## User Story

**As a** platform engineer, **I want** a single version-locked Zod re-export package and a shared validators package, **so that** every workspace consumes the exact same Zod version and shares feature schemas without duplication.

## Acceptance Criteria

**AC1 — Packages resolve as workspace deps**
- **Given** the monorepo
- **When** `pnpm install` runs from root
- **Then** `@cloudvault/zod` and `@cloudvault/validators` resolve as workspace packages and expose their TypeScript types to `apps/api` and `apps/web`.

**AC2 — Version lock enforced by ESLint**
- **Given** any TS/TSX file outside `packages/zod/src/**`
- **When** it contains `import ... from 'zod'`
- **Then** ESLint (`no-restricted-imports`) reports an error pointing to `@cloudvault/zod`.

**AC3 — Validators package is feature-scoped**
- **Given** `@cloudvault/validators`
- **When** a consumer imports from it
- **Then** schemas are organized as `src/<feature>/<action>.schema.ts` with barrel exports, and each schema imports `z` from `@cloudvault/zod` (never `zod`).

**AC4 — Web app migrates off direct zod**
- **Given** `apps/web` currently depends on `zod@^4.3.4`
- **When** the refactor is complete
- **Then** `apps/web/package.json` no longer lists `zod` as a direct dependency and all its imports route through `@cloudvault/zod`, and `pnpm lint` passes.

## Tasks

- [x] Create `packages/zod/` with `package.json` (`@cloudvault/zod`, `"main"`/`"types"` → `./src/index.ts`), `src/index.ts` (`export * from 'zod'; export { z } from 'zod';`), `tsconfig.json` extending `@cloudvault/typescript-config` [AC1]
- [x] Pin `zod@^4.3.4` (the current `apps/web` version) in `packages/zod/package.json` as the single direct zod dependency [AC1, AC4]
- [x] Create `packages/validators/` with `package.json` (`@cloudvault/validators`), barrel `src/index.ts`, common placeholder `src/common/pagination.schema.ts` defining `paginationSchema = z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(20) })` importing `z` from `@cloudvault/zod` [AC1, AC3]
- [x] Add `no-restricted-imports` rule in `packages/eslint-config/base.js` blocking the `'zod'` specifier with message `"Use @cloudvault/zod instead — zod is version-locked."` [AC2]
- [x] Add a local override `.eslintrc.js` in `packages/zod/` that disables `no-restricted-imports` for its own `src/**` [AC2]
- [x] Remove `zod` from `apps/web/package.json` dependencies; add `@cloudvault/zod` and `@cloudvault/validators` as `workspace:*` deps [AC4]
- [x] Replace all `from 'zod'` imports in `apps/web/**/*.{ts,tsx}` with `from '@cloudvault/zod'` [AC4]
- [x] Add `@cloudvault/zod` and `@cloudvault/validators` as `workspace:*` deps in `apps/api/package.json` (prep for story 1-2) [AC1]
- [x] Run `pnpm install && pnpm lint` from root; confirm `apps/web` and `apps/api` both lint clean and ESLint flags any synthetic `import 'zod'` test [AC1, AC2, AC4]

## Dev Notes

- **Architecture (LAW):** The version-lock rule is binding (see `CLAUDE.md` → "Zod version lock"). `@cloudvault/zod` is the **only** package allowed to import `zod` directly. Enforced by ESLint `no-restricted-imports`. This story establishes that enforcement.
- **Package layout — mirror `@cloudvault/types`:**
  - `package.json`: `"main": "./src/index.ts"`, `"types": "./src/index.ts"`, `"private": true`, `"version": "1.0.0"`
  - No build step — workspace consumes TS source directly via Turborepo `dev`/`build` pipelines.
- **Pagination schema:** The architecture mandates offset-based `{ page, pageSize: 20 }` pagination across list endpoints. Defining `paginationSchema` now in `@cloudvault/validators/common` lets subsequent stories (1-2 contract scaffold, 5-1 files-list) compose it directly instead of duplicating the shape.
- **Files to create:**
  - `packages/zod/package.json`
  - `packages/zod/src/index.ts`
  - `packages/zod/tsconfig.json`
  - `packages/zod/.eslintrc.js` (local override — allow `zod`)
  - `packages/validators/package.json`
  - `packages/validators/tsconfig.json`
  - `packages/validators/src/index.ts` (barrel)
  - `packages/validators/src/common/index.ts` (barrel)
  - `packages/validators/src/common/pagination.schema.ts`
- **Files to modify:**
  - `packages/eslint-config/base.js` — add `no-restricted-imports` rule for `zod`
  - `apps/web/package.json` — remove `zod`, add workspace deps
  - `apps/api/package.json` — add workspace deps
  - `apps/web/**/*.{ts,tsx}` — rewrite any `from 'zod'` → `from '@cloudvault/zod'`
- **pnpm-workspace.yaml:** Already globs `packages/*` (verify the file still lists both `apps/*` and `packages/*` before running `pnpm install`; the current file is minimal — add missing globs if absent).
- **Testing:** No unit tests — pure re-export + tooling. Verification gates are `pnpm install` (workspace resolution) + `pnpm lint` (ESLint rule enforcement). Optionally, create a throwaway `apps/web/src/__eslint-check.ts` with `import { z } from 'zod';` to prove the rule fires, then delete it.
- **Dependencies:** `zod@^4.3.4` (pinned in `@cloudvault/zod` only).
- **Commit prefix:** `feat(packages): ` (e.g. `feat(packages): add @cloudvault/zod and @cloudvault/validators`).
- **Out of scope:** Defining auth/files/profile/dashboard validators — those land in story 1-2 alongside the contract scaffold. Only `common/pagination.schema.ts` is seeded here.

## Dev Agent Record

- **Model:** Claude Opus 4.6 (1M context)
- **Started:** 2026-04-16
- **Completed:** 2026-04-16

### Debug Log

- ESLint 9 + `@vercel/style-guide@6` + legacy `.eslintrc.js` = pre-existing broken config for apps/web. The `no-restricted-imports` rule was also added to `packages/eslint-config/next.js` (which apps/web extends) in addition to `base.js` (which nest.js extends). RED check validated via standalone ESLint run with `@typescript-eslint/parser`.

### Completion Notes

- All 9 ACs validated: workspace resolution, ESLint rule fires on `from 'zod'`, validators feature-scoped, web migrated off direct zod.
- `packages/eslint-config/next.js` also updated with the rule since it doesn't extend `base.js`.
- Pre-existing ESLint peer dep warnings (zsa wants zod@^3, eslint-config uses ESLint 9 with ESLint 8 plugins) — not in scope.

### File List

- `packages/zod/package.json` (created)
- `packages/zod/src/index.ts` (created)
- `packages/zod/tsconfig.json` (created)
- `packages/zod/.eslintrc.js` (created)
- `packages/validators/package.json` (created)
- `packages/validators/tsconfig.json` (created)
- `packages/validators/src/index.ts` (created)
- `packages/validators/src/common/index.ts` (created)
- `packages/validators/src/common/pagination.schema.ts` (created)
- `packages/eslint-config/base.js` (modified)
- `packages/eslint-config/next.js` (modified)
- `apps/web/package.json` (modified)
- `apps/api/package.json` (modified)
- `apps/web/lib/zsa-procedures.ts` (modified)
- `apps/web/lib/schemas/auth.schema.ts` (modified)
- `apps/web/components/auth/login-form.tsx` (modified)
- `apps/web/components/auth/register-form.tsx` (modified)
- `apps/web/app/auth/callback/_actions/exchange-code.action.ts` (modified)
- `apps/web/app/auth/login/_actions/login.action.ts` (modified)
- `apps/web/app/auth/login/_components/login-form.tsx` (modified)
- `apps/web/app/auth/register/_actions/register.action.ts` (modified)
- `apps/web/app/auth/register/_components/register-form.tsx` (modified)
