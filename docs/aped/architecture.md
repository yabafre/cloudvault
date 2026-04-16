# CloudVault — Technical Architecture

**Author:** Alex
**Date:** 2026-04-16
**Version:** 1.0.0
**Status:** APPROVED — LAW for `/aped-dev`, `/aped-story`, `/aped-review`

---

## Executive Summary

CloudVault is a privacy-first cloud file storage platform built as a TypeScript monorepo (Turborepo + pnpm), with a NestJS backend and a Next.js 16 frontend, communicating through a contract-first, end-to-end type-safe RPC layer (**oRPC**). Data is stored in PostgreSQL (Neon, EU region) via Prisma 7, files in AWS S3 (eu-west-3) with direct-to-S3 uploads via pre-signed POST policies, and asynchronous thumbnail generation through a Python Lambda. Infrastructure is codified with AWS CDK and deployed via GitHub Actions.

This document captures the architectural decisions, conventions, and implementation patterns that MUST be followed by all downstream development. Each decision includes its rationale; deviations require a new `/aped-arch` session.

---

## 1. Project Context Analysis

### 1.1 Brownfield state

CloudVault is a brownfield project with ~40% of the stack already implemented:

- **Implemented:** Monorepo structure (Turborepo, pnpm), NestJS auth module (JWT + refresh + Google OAuth), PrismaModule global, shared types/config packages, Next.js 16 app shell with auth pages (login/register/callback), Zustand auth store, shadcn/ui primitives, UX preview app with full screen inventory.
- **Not implemented:** Files module (backend), S3 integration, Lambda deployment, dashboard UI, files page UI, profile page UI, CI/CD pipelines, IaC, monitoring stack.
- **To migrate:** Existing auth endpoints (REST + Swagger) → oRPC contract-first. Existing `zsa`/`react-hook-form` usage → `zapaction`/`@tanstack/react-form`.

### 1.2 Architectural drivers (from PRD)

| Driver | Source | Architectural implication |
|---|---|---|
| Direct-to-S3 uploads via pre-signed URL | FR17–FR21 | AWS SDK v3, pre-signed POST policy (not PUT) for server-enforced size/MIME limits |
| Async thumbnail generation | FR22–FR26 | Lambda with S3 ObjectCreated trigger, dedicated prefix `users/*/thumbnails/` |
| Paginated file listing (20/page) | FR27–FR31 | Offset-based pagination, composite index `(user_id, created_at DESC)` |
| Atomic S3 + DB deletion | FR34–FR35 | DB-first delete + weekly S3 orphan reconciler Lambda |
| Responsive design (mobile/tablet/desktop) | FR43 | Tailwind CSS 4 breakpoints, already configured |
| p95 < 200ms @ 100 concurrent users | NFR performance | Neon pooled connection, TanStack Query stale cache, Fargate min 1 task warm |
| AES-256 at rest, TLS 1.2+ in transit | NFR security | S3 SSE-S3, Cloudflare + ALB TLS config |
| Rate limit 100 req/min/IP | NFR security | Defense-in-depth: Cloudflare WAF edge + `@nestjs/throttler` app-level |
| CSP, HSTS, X-Content-Type-Options | NFR security | `helmet` (NestJS) + `headers()` config (Next.js) |
| WCAG 2.1 AA | NFR accessibility | Radix primitives + Lighthouse CI in pipeline |
| GDPR + EU data residency | Domain | All data/compute in EU regions; hard delete + PITR 7 days |
| Right to erasure | Domain | DB hard delete + best-effort S3 + weekly orphan reconciler |
| OpenAPI 3.0 spec | NFR integration | oRPC auto-generates via `@orpc/openapi` |

### 1.3 Tension resolutions

| Tension | Resolution |
|---|---|
| Neon cold start vs p95 200ms | Neon pooler + TanStack Query `staleTime: 30s` — reassess with Prisma Accelerate if metrics degrade |
| Right to erasure vs backups | Hard delete DB + S3 immediate; Neon PITR reduced to 7 days (documented in privacy policy) |
| Rate limit double-layer | Cloudflare WAF (edge) + `@nestjs/throttler` (app), stricter on `/auth/login` (5/15min) and `/files/upload-intent` (10/min) |
| Pre-signed POST vs PUT | POST with policy conditions for server-enforced `Content-Length-Range` + `Content-Type` whitelist |
| S3 + DB atomicity | DB-first delete, S3 best-effort, weekly EventBridge cron Lambda reconciles orphans (age > 24h) |
| zapaction vs oRPC overlap | oRPC for all Web ↔ API calls (read + write). zapaction only for Next.js-only server actions (cookies, redirects, revalidation) |
| Auth migration to oRPC | Full migration — consistency over effort, endpoints are few |

---

## 2. Technology Decisions

### 2.1 Languages & Runtimes

| Layer | Choice | Version | Rationale |
|---|---|---|---|
| Backend | TypeScript | 5.x | Type safety, shared types with frontend |
| Frontend | TypeScript | 5.x | Same |
| Lambda | Python | 3.12 | Pillow ecosystem for image processing |
| Node runtime | Node.js | ≥ 20 | LTS, Next.js 16 minimum |
| Package manager | pnpm | ≥ 9 | Workspaces, disk efficiency, strict |
| Monorepo | Turborepo | 2.x | Task caching, remote cache via Vercel |

### 2.2 Data Layer

| Decision | Choice | Rationale |
|---|---|---|
| Database | PostgreSQL 16 via **Neon** (EU region) | Serverless, free tier, EU residency |
| ORM | **Prisma 7.7.0** | Multi-file schema (`prismaSchemaFolder` GA in v7), strong TS typing |
| Pooling | **Neon native pooler** (transaction mode) + `directUrl` for migrations | Zero ops, sufficient for 100 concurrent users |
| Caching | **None for MVP** — TanStack Query `staleTime: 30s` on client | Boring tech for MVP, add Redis later if needed |
| Schema layout | One `.prisma` file per model in `apps/api/prisma/schema/` | Readability at 3+ models |

**Prisma schema folder layout:**
```
apps/api/prisma/schema/
├── schema.prisma              # datasource + generator
├── user.prisma
├── file.prisma
└── refresh-token.prisma
```

### 2.3 Authentication & Security

| Decision | Choice | Rationale |
|---|---|---|
| Auth strategy | JWT (15min access) + Refresh token (7 days, DB-tracked, revocable) | FR7, FR8, FR9 |
| Password hashing | argon2id via `@node-rs/argon2` (OWASP defaults: memoryCost ≥ 19 MiB, timeCost ≥ 2, parallelism 1) | OWASP-recommended algorithm; memory-hard, GPU/ASIC-resistant; native Rust binding outperforms bcrypt |
| OAuth | Google (passport-google-oauth20) | FR2, FR6 |
| Cookie policy | httpOnly, Secure, SameSite=Lax | XSS protection, CSRF mitigation |
| CORS | Strict origin (frontend only) + credentials | NFR |
| Rate limit | 2 layers: Cloudflare WAF edge + `@nestjs/throttler` | Defense-in-depth |
| Security headers | `helmet` (NestJS) + `next.config.ts headers()` | CSP, HSTS, X-CTO, Referrer-Policy, Permissions-Policy |
| Input validation | Zod at oRPC boundary (automatic via contract) | NFR sanitization |
| Secrets management (dev) | Root `.env` via `dotenv-cli` | Existing pattern |
| Secrets management (CI) | GitHub Actions Secrets | Native |
| Secrets management (prod) | **AWS SSM Parameter Store** (SecureString, KMS-encrypted) | Free tier, no Secrets Manager surcharge |
| Config validation | Zod schema at NestJS boot — API refuses to start if env invalid | Fail-fast |

### 2.4 File Upload & Storage

| Decision | Choice | Rationale |
|---|---|---|
| Storage | AWS S3 eu-west-3 (Paris) | GDPR data residency |
| Encryption at rest | **SSE-S3 (AES-256)** | NFR, no KMS surcharge for MVP |
| Upload method | **Pre-signed POST** with policy conditions | Server-enforced size (FR16) + MIME (FR15) before upload touches S3 |
| URL expiry | 15 minutes | NFR |
| Key structure | `users/{userId}/originals/{uuid}.{ext}` and `users/{userId}/thumbnails/{uuid}.webp` | User isolation, prefix-based IAM policies |
| MIME validation | Zod schema + magic bytes check post-upload via `file-type` package | FR21 |
| User storage quota | **`User.storageQuotaBytes` in DB** (default 5 GB), checked in `files.service.ts#createUploadIntent` | Prepares Phase 2 monetization, prevents runaway S3 costs |
| Thumbnail generation | Python Lambda (Pillow), S3 ObjectCreated trigger on `users/*/originals/*` | Async, FR22–FR26 |
| Thumbnail → API sync | Lambda calls NestJS webhook (`POST /webhooks/thumbnail-ready`) with shared-secret header | Updates `File.status` and `File.thumbnailKey` |
| Failure handling | SQS DLQ on Lambda, `File.status = FAILED` after retries exhausted | FR26 |
| Orphan reconciler | EventBridge cron Lambda, weekly (`rate(7 days)`), deletes S3 objects without DB row (age > 24h) | Resolves S3+DB atomicity (T5) |

### 2.5 API Design — oRPC (Contract-First)

| Decision | Choice | Rationale |
|---|---|---|
| Style | **oRPC** (contract-first, type-safe end-to-end, OpenAPI 3.0 compliant) | User directive + NFR integration |
| NestJS integration | `@orpc/server/nest` — each module implements contract | Native pattern, keeps NestJS DI |
| OpenAPI generation | `@orpc/openapi` exposed at `/api/docs` via Scalar UI | NFR OpenAPI 3.0 |
| Error format | `ORPCError<ApiErrorCode>` with typed codes (see §3.3) | Type-safe error handling |
| Pagination | Offset-based: `{ page, pageSize: 20 }` → `{ items, total, page, totalPages }` | Sufficient for 100k files/user scale |
| Versioning | None for MVP — breaking changes detected at compile time | Reassess if public API (Phase 3) |

**Contract layout (`@cloudvault/contract`):**
```
src/
├── auth/ (login, register, refresh, logout, google)
├── files/ (upload-intent, list, delete)
├── profile/ (me, update)
├── dashboard/ (stats, recent-files)
├── health/ (check)
└── index.ts  → export const contract = { auth, files, profile, dashboard, health }
```

### 2.6 Frontend

| Decision | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 16** App Router + React 19 | Existing + RSC, edge-ready |
| Rendering strategy | Landing SSG / Auth SSR / `(app)/*` SSR + oRPC hydration | LCP optimization per-page |
| State management | **Zustand 5** (auth) + **TanStack Query** (server state via oRPC) | Existing + oRPC native integration |
| Client-side RPC | **oRPC client** + `@orpc/tanstack-query` | Type-safe, query invalidation |
| Server actions | **zapaction** (`@zapaction/core`, `@zapaction/query`) for cookies/redirects/revalidation only | User directive, complement oRPC |
| Forms | **TanStack Form** (`@tanstack/react-form` + `@tanstack/react-form-nextjs`) | User directive, Zod integration, SSR-friendly |
| Validation | Shared schemas from `@cloudvault/validators` (client + server) | Single source of truth |
| UI primitives | shadcn/ui (Radix + Tailwind CSS 4) | Existing + WCAG compliance |
| Theming | `next-themes` (light/dark) | FR42 |
| Toasts | `sonner` | Existing |
| Icons | `lucide-react` | Existing |
| Route protection | `proxy.ts` middleware (server-side) + `AuthGuard` component (client backup) | Defense-in-depth, no content flash |
| Route groups | `(auth)` + `(app)` for layout and error boundary factoring | Cleaner structure |

### 2.7 Shared Packages

| Package | Purpose | Key constraint |
|---|---|---|
| `@cloudvault/types` | Shared TypeScript types organized by feature | `src/<feature>/<feature>.types.ts` + barrel |
| `@cloudvault/validators` | Zod schemas organized by feature and action | `src/<feature>/<action>.schema.ts` + barrel — imports `@cloudvault/zod` |
| `@cloudvault/zod` | Version-locked Zod re-export + shared refinements + i18n error map | Only package that imports `zod` directly; enforced via ESLint `no-restricted-imports` |
| `@cloudvault/contract` | oRPC contract definitions | Imports validators + types, exports `contract` tree |
| `@cloudvault/eslint-config` | Shared ESLint configs | Existing |
| `@cloudvault/typescript-config` | Shared tsconfig | Existing |

### 2.8 Infrastructure

| Component | Choice | Region | Rationale |
|---|---|---|---|
| Web hosting | **Vercel** | EU (fra1/cdg1) | Zero config, edge CDN, preview envs |
| API hosting | **AWS Fargate** (ECS) | eu-west-3 | Long-running NestJS, portfolio narrative, no cold-start |
| Lambda hosting | **AWS Lambda** | eu-west-3 | Event-driven, thumbnail async |
| Database | **Neon** | EU region | Serverless PG, GDPR-compliant |
| Storage | **AWS S3** | eu-west-3 | GDPR, SDK v3, pre-signed URLs |
| CDN/WAF/DNS | **Cloudflare** | Global + DPA | Edge security, R2 migration path |
| IaC | **AWS CDK (TypeScript)** | — | Same language as stack, CloudFormation output |
| CI/CD | **GitHub Actions** + OIDC to AWS | — | Existing placeholders, no long-lived keys |
| Monitoring — errors | **Sentry** (NestJS + Next.js SDKs) | — | Free tier 5k errors/mo |
| Monitoring — infra | **CloudWatch** | — | Native AWS |
| Monitoring — logs | **Better Stack Logs** | — | Free tier aggregation |
| Alerting | Better Stack → email + Discord webhook | — | Simple |

**CDK stack layout:**
```
infra/cdk/lib/
├── storage-stack.ts      # S3 bucket, lifecycle, CORS
├── lambda-stack.ts       # thumbnail-generator + orphan-reconciler
├── api-stack.ts          # ECS Fargate cluster, service, ALB, auto-scaling
└── params-stack.ts       # SSM Parameter Store entries
```

**Environments:** `dev` (local) → `prod` (Vercel + Fargate). No staging for MVP.

---

## 3. Implementation Patterns & Conventions

### 3.1 Naming Conventions

#### Files & directories
| Type | Convention | Example |
|---|---|---|
| TypeScript files | `kebab-case.ts` | `auth.service.ts`, `use-delete-file.ts` |
| React files | `kebab-case.tsx` | `login-form.tsx`, `files-grid.tsx` |
| Prisma files | `kebab-case.prisma`, one per model | `user.prisma`, `refresh-token.prisma` |
| Directories | `kebab-case` | `core/auth/` |
| Next.js private folders | `_kebab-case` | `_hooks/`, `_actions/`, `_components/` |
| File suffixes | `.service.ts`, `.controller.ts`, `.module.ts`, `.dto.ts`, `.guard.ts`, `.strategy.ts`, `.decorator.ts`, `.schema.ts`, `.types.ts`, `.contract.ts`, `.action.ts`, `.orpc.ts`, `.spec.ts`, `.e2e-spec.ts` | — |
| Barrel exports | `index.ts` in each exported folder | — |

#### Code identifiers
| Type | Convention | Example |
|---|---|---|
| React components | `PascalCase` | `LoginForm`, `FileCard` |
| Hooks | `camelCase` with `use` prefix | `useLogin`, `useFilesList` |
| Functions / variables | `camelCase` | `generateUploadUrl` |
| Types / interfaces | `PascalCase` | `FileMetadata` |
| Enums | `PascalCase` + `SCREAMING_SNAKE_CASE` values | `FileStatus.PENDING` |
| Module constants | `SCREAMING_SNAKE_CASE` | `MAX_FILE_SIZE_BYTES` |
| Zod schemas | `camelCase` with `Schema` suffix | `loginSchema`, `uploadIntentSchema` |
| oRPC contracts | `camelCase` with `Contract` suffix | `loginContract` |
| zapactions | `camelCase` with `Action` suffix | `loginAction`, `deleteFileAction` |
| NestJS classes | `PascalCase` with role suffix | `AuthService`, `JwtAuthGuard` |

#### Database
| Type | Convention | Example |
|---|---|---|
| Tables (`@@map`) | `snake_case` plural | `users`, `files`, `refresh_tokens` |
| Columns (`@map`) | `snake_case` | `created_at`, `storage_key` |
| Prisma fields (TS) | `camelCase` | `createdAt`, `storageKey` |
| Indexes | `idx_<table>_<cols>` | `idx_files_user_id_created_at` |
| Foreign keys | `fk_<table>_<ref>` | `fk_files_user_id` |
| Enums | `PascalCase` + `SCREAMING_SNAKE_CASE` | `FileStatus { PENDING, READY, FAILED }` |

#### oRPC routes
- kebab-case, resource-oriented, plural
- Verbs in contract method, not URL
- Non-CRUD actions: explicit kebab verb (`/auth/refresh`, `/files/upload-intent`)

### 3.2 Encapsulation rule (CRITICAL)

> **A component or page NEVER imports an action or an oRPC client directly. It ALWAYS goes through a custom hook.**

- Actions and oRPC calls are implementation details
- Custom hooks are the public API (exposing `isPending`, `error`, `mutate`, `data`)
- Enforced by ESLint `no-restricted-imports`:
  - `_actions/*` and `core/**/actions/*` cannot be imported from `.tsx` files
  - `core/orpc/client` cannot be imported from `.tsx` files
  - Exception: files inside `_hooks/` and `core/**/hooks/`

**Hook naming conventions:**
| Type | Convention | Example |
|---|---|---|
| Query (read) | `use<Feature><Resource>` | `useFilesList`, `useProfile` |
| Mutation (write) | `use<Verb><Resource>` | `useDeleteFile`, `useUploadFile` |
| Form orchestrator | `use<Feature>Form` | `useLoginForm`, `useUpdateProfileForm` |

### 3.3 Local vs Global code split

| Scope | Location | Rule |
|---|---|---|
| **Global** | `apps/web/core/<feature>/` | Used by ≥ 2 pages OR cross-cutting concern |
| **Local** | `app/<route>/_components/`, `_hooks/`, `_actions/` | Used by 1 page only |
| **UI primitives** | `apps/web/components/ui/` | shadcn/ui only, no business logic |

**Promotion rule:** components/hooks/actions start local. Promoted to `core/` only when a 2nd usage appears. Avoid premature abstraction.

### 3.4 Loading / Error / Skeleton strategy

Every page that fetches data or depends on user state MUST have `loading.tsx` + `error.tsx`. Pure static pages (Landing) and pure-form pages (Login, Register) don't.

| Route | `loading.tsx` | `error.tsx` | `not-found.tsx` |
|---|:---:|:---:|:---:|
| `/` Landing | ❌ | ❌ | — |
| `/auth/login` | ❌ | ❌ | — |
| `/auth/register` | ❌ | ❌ | — |
| `/auth/callback` | ✅ | ✅ | — |
| `/dashboard` | ✅ | ✅ | — |
| `/files` | ✅ | ✅ | ✅ |
| `/profile` | ✅ | ✅ | — |
| `*` | — | — | ✅ (root) |

**Skeleton layers:**
1. **Global reusable** → `apps/web/core/ui/skeletons/` (CardSkeleton, FormSkeleton, TextSkeleton) built on shadcn `Skeleton` primitive.
2. **Page-composed** → `app/<route>/_components/skeletons/` — match the real component layout exactly (no CLS, LCP < 2s).

**Three loading levels:**
| Level | When | Mechanism |
|---|---|---|
| Route transition | Navigation between pages | Next.js `loading.tsx` (automatic) |
| Data fetching | `useQuery` after mount | `isPending` → inline skeleton |
| Mutation / form | Form submit, destructive action | `isSubmitting` (TanStack Form) + `isPending` (zapaction) → disabled button + spinner + sonner toast |

**Four-state rule (MANDATORY, enforced by `/aped-review`):**
Every data-dependent component must handle: `loading → error → empty → data`.

### 3.5 Error handling & propagation

**Unified format (`@cloudvault/types/common/common.types.ts`):**
```ts
export type ApiErrorCode =
  | "UNAUTHORIZED" | "SESSION_EXPIRED" | "FORBIDDEN"
  | "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT"
  | "FILE_TOO_LARGE" | "INVALID_MIME" | "QUOTA_EXCEEDED"
  | "EMAIL_TAKEN" | "INVALID_CREDENTIALS"
  | "RATE_LIMITED" | "INTERNAL_ERROR";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  data?: Record<string, unknown>;
}
```

**Error flow:**
```
Prisma error / Business rule
  → Service throws NestException OR ORPCError
  → Global OrpcErrorFilter normalizes → ORPCError<ApiErrorCode>
  → oRPC client receives typed via isDefinedError()
  → Custom hook catches and exposes { error } with type
  → Component: switch(error.code) → UI specific OR error boundary
```

**Rules:**
- User-facing messages are localized (no hardcoded strings in services)
- No stack trace in client response — Sentry only
- 5xx errors always mapped to `INTERNAL_ERROR` client-side
- Auth errors (401/403) intercepted by oRPC client → redirect `/auth/login?session=expired`

### 3.6 Backend layer boundaries

| Layer | Responsibility | Rule |
|---|---|---|
| `*.orpc.ts` | Implements oRPC contract, calls service | **Zero business logic**, translation only |
| `*.service.ts` | Business logic, orchestration | Calls Prisma + other services, never HTTP raw |
| `prisma` | Data access | Injected via global `PrismaService` |
| `s3/*`, `google/*` | External integrations | Wrapped in dedicated services, mockable |

**Forbidden:**
- Controller/orpc handler calling Prisma directly
- Service calling another controller
- Business rules in contract definitions

### 3.7 Logging

**Backend (NestJS Logger via `nestjs-pino`):**
| Level | Usage |
|---|---|
| `error` | Non-business exceptions (DB down, S3 fail) — sent to Sentry |
| `warn` | Business rule violations, failed auth, rate limit hits |
| `log` | Important business events (user created, file uploaded) |
| `debug` | Dev only, disabled in prod |

Structured JSON logs in prod, pretty in dev. Every log includes: `timestamp, level, context, requestId, userId?, message, meta`.

**Correlation ID:** middleware generates `X-Request-Id` if absent, propagates through all logs and response headers.

**Frontend:**
- Sentry SDK captures React errors + untyped oRPC errors
- No `console.log` in prod (ESLint `no-console: ["error", { allow: ["warn", "error"] }]`)

### 3.8 Testing

**Coverage targets:**
| Zone | Target | Mandatory |
|---|---|---|
| Backend services (`*.service.ts`) | **80%** | ✅ (NFR) |
| Backend orpc handlers (`*.orpc.ts`) | 60% | ✅ |
| Backend guards/strategies | 70% | ✅ |
| Frontend custom hooks | 70% | ✅ |
| Frontend components | Smoke tests (rendering) | Recommended |
| E2E (3 PRD User Journeys) | 100% | ✅ |

**Stack:**
- Backend: Jest 29 + ts-jest + `@nestjs/testing` (existing)
- Frontend unit: Vitest + Testing Library (existing)
- Frontend E2E: **Playwright** (to add)
- **Integration tests: Testcontainers Postgres** (no Prisma mocking, real DB)

**Co-location:**
- Unit: `*.spec.ts` next to source
- Backend E2E: `apps/api/test/*.e2e-spec.ts`
- Frontend E2E: `apps/web/test/e2e/`

**`/aped-review` auto-rejects PRs that:**
1. Drop backend coverage below 80%
2. Add a service without `*.spec.ts`
3. Add a custom hook without test
4. Modify a User Journey without updating its e2e

### 3.9 Git & process

**Branches (trunk-based):**
```
main
└── feat/<story-id>-short-description
└── fix/<story-id>-short-description
└── chore/<short-description>
└── refactor/<short-description>
```

**Commits (Conventional Commits strict):**
```
<type>(<scope>): <description>

[body explaining WHY]

[footer: Refs: CV-42, BREAKING CHANGE: ..., Co-Authored-By: ...]
```
- **types:** `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `build`, `ci`
- **scopes:** `api`, `web`, `contract`, `types`, `validators`, `zod`, `lambda`, `infra`, `deps`, or precise module (`api/files`, `web/dashboard`)
- Enforced via `commitlint` + husky `commit-msg` hook

**Pull Requests:**

Required checklist:
- [ ] Story linked (`Closes CV-XX`)
- [ ] Tests added/updated, coverage maintained
- [ ] Contract updated if API touched
- [ ] Types/validators updated if schema touched
- [ ] `pnpm lint && pnpm typecheck && pnpm test` passes locally
- [ ] No residual `console.log`
- [ ] UI screenshots if visual change

CI gates (branch protection on `main`):
1. `lint` ✅
2. `typecheck` ✅
3. `test` ✅
4. `build` ✅
5. 1 review approved

**Squash merge** mandatory (linear history, 1 commit = 1 story).

### 3.10 Import conventions

**Order (`import/order`):**
1. Node built-ins
2. External packages
3. Workspace packages (`@cloudvault/*`)
4. Internal absolute (`@/...`)
5. Relative parents
6. Relative siblings
7. Styles

Blank line between groups.

**Strict rules (ESLint enforced):**
- ❌ Direct `zod` import → use `@cloudvault/zod`
- ❌ `*.action.ts` import from `.tsx` → use custom hook
- ❌ `orpc` client import from `.tsx` → use custom hook
- ❌ Import across pages' `_components/` → promote to `core/`
- ❌ Prisma import from non-service files
- ✅ Barrel `index.ts` mandatory in each `src/<feature>/`

### 3.11 Config management

- Single root `.env`, loaded via `dotenv-cli` (turbo) and `@nestjs/config`
- `.env.example` versioned, exhaustive, with commented explanations
- No hardcoded secret fallbacks (never `process.env.JWT_SECRET ?? "dev-secret"`)
- **Zod validation at NestJS boot** via `@cloudvault/zod` — API refuses to start if env invalid
- `NEXT_PUBLIC_*` prefix for frontend-exposed vars only

---

## 4. Project Structure & FR Mapping

### 4.1 Full directory layout

```
cloudvault/
├── apps/
│   ├── api/                                    # NestJS (port 4000)
│   │   ├── prisma/schema/
│   │   │   ├── schema.prisma                   # datasource + generator
│   │   │   ├── user.prisma
│   │   │   ├── file.prisma
│   │   │   └── refresh-token.prisma
│   │   ├── src/
│   │   │   ├── main.ts                         # bootstrap + helmet + orpc
│   │   │   ├── app.module.ts
│   │   │   ├── prisma/                         # global PrismaModule
│   │   │   ├── orpc/
│   │   │   │   ├── orpc.module.ts
│   │   │   │   ├── orpc.handler.ts             # implement(contract)
│   │   │   │   └── orpc-error.filter.ts        # NestException → ORPCError
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.orpc.ts
│   │   │   │   │   ├── strategies/             # jwt, local, google
│   │   │   │   │   ├── guards/
│   │   │   │   │   ├── decorators/
│   │   │   │   │   └── auth.service.spec.ts
│   │   │   │   ├── files/
│   │   │   │   │   ├── files.module.ts
│   │   │   │   │   ├── files.service.ts
│   │   │   │   │   ├── files.orpc.ts
│   │   │   │   │   ├── s3/
│   │   │   │   │   │   ├── s3.service.ts       # AWS SDK v3 wrapper
│   │   │   │   │   │   └── presigned-post.ts
│   │   │   │   │   ├── webhooks/
│   │   │   │   │   │   └── thumbnail-webhook.ts
│   │   │   │   │   └── files.service.spec.ts
│   │   │   │   ├── profile/
│   │   │   │   ├── dashboard/
│   │   │   │   └── health/
│   │   │   └── common/
│   │   │       ├── filters/
│   │   │       ├── interceptors/
│   │   │       └── middleware/
│   │   └── test/                               # E2E
│   │
│   └── web/                                    # Next.js 16 (port 3000)
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── error.tsx
│       │   ├── not-found.tsx
│       │   ├── page.tsx                        # Landing (SSG)
│       │   ├── (auth)/
│       │   │   ├── layout.tsx                  # AuthLayout
│       │   │   ├── login/
│       │   │   │   ├── _hooks/use-login-form.ts
│       │   │   │   ├── _actions/login.action.ts
│       │   │   │   ├── _components/login-form.tsx
│       │   │   │   └── page.tsx
│       │   │   ├── register/
│       │   │   └── callback/
│       │   │       ├── _components/
│       │   │       ├── loading.tsx
│       │   │       ├── error.tsx
│       │   │       └── page.tsx
│       │   └── (app)/
│       │       ├── layout.tsx                  # AppLayout + AuthGuard
│       │       ├── error.tsx
│       │       ├── dashboard/
│       │       │   ├── _hooks/
│       │       │   │   ├── use-storage-stats.ts
│       │       │   │   └── use-recent-files.ts
│       │       │   ├── _components/
│       │       │   │   ├── storage-stats-card.tsx
│       │       │   │   ├── recent-files-grid.tsx
│       │       │   │   └── skeletons/
│       │       │   ├── loading.tsx
│       │       │   ├── error.tsx
│       │       │   └── page.tsx
│       │       ├── files/
│       │       │   ├── _hooks/
│       │       │   │   ├── use-files-list.ts
│       │       │   │   ├── use-delete-file.ts
│       │       │   │   └── use-upload-file.ts
│       │       │   ├── _actions/
│       │       │   │   ├── delete-file.action.ts
│       │       │   │   └── upload-intent.action.ts
│       │       │   ├── _components/
│       │       │   │   ├── files-grid.tsx
│       │       │   │   ├── file-card.tsx
│       │       │   │   ├── file-delete-dialog.tsx
│       │       │   │   ├── files-pagination.tsx
│       │       │   │   └── skeletons/
│       │       │   ├── loading.tsx
│       │       │   ├── error.tsx
│       │       │   ├── not-found.tsx
│       │       │   └── page.tsx
│       │       └── profile/
│       │           ├── _hooks/use-update-profile-form.ts
│       │           ├── _actions/update-profile.action.ts
│       │           ├── _components/
│       │           ├── loading.tsx
│       │           ├── error.tsx
│       │           └── page.tsx
│       ├── core/
│       │   ├── auth/
│       │   │   ├── hooks/                      # useAuth, useLogout, useProfile
│       │   │   ├── stores/                     # Zustand
│       │   │   └── components/                 # AuthGuard
│       │   ├── orpc/
│       │   │   ├── client.ts
│       │   │   ├── server.ts                   # server-only
│       │   │   └── hydration.tsx
│       │   ├── query/
│       │   │   ├── client.ts
│       │   │   ├── serializer.ts
│       │   │   └── provider.tsx
│       │   ├── providers/
│       │   │   └── index.tsx
│       │   ├── files/
│       │   │   └── components/upload-zone.tsx  # promoted (dashboard + files)
│       │   ├── i18n/
│       │   │   └── messages/
│       │   └── ui/
│       │       ├── skeletons/
│       │       ├── empty-state.tsx
│       │       ├── error-state.tsx
│       │       ├── format/format-bytes.ts
│       │       ├── nav/
│       │       └── theme-toggle.tsx
│       ├── components/ui/                      # shadcn primitives
│       ├── proxy.ts                            # Next.js 16 middleware
│       └── test/
│           ├── setup.ts
│           └── e2e/                            # Playwright
│
├── packages/
│   ├── types/                                  # @cloudvault/types
│   │   └── src/
│   │       ├── auth/auth.types.ts
│   │       ├── files/files.types.ts
│   │       ├── profile/profile.types.ts
│   │       ├── dashboard/dashboard.types.ts
│   │       ├── common/common.types.ts
│   │       └── index.ts
│   ├── validators/                             # @cloudvault/validators
│   │   └── src/
│   │       ├── auth/
│   │       │   ├── login.schema.ts
│   │       │   ├── register.schema.ts
│   │       │   ├── refresh.schema.ts
│   │       │   └── index.ts
│   │       ├── files/
│   │       │   ├── upload-intent.schema.ts
│   │       │   ├── list-files.schema.ts
│   │       │   ├── delete-file.schema.ts
│   │       │   └── index.ts
│   │       ├── profile/
│   │       │   ├── update-profile.schema.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   ├── zod/                                    # @cloudvault/zod
│   │   └── src/
│   │       ├── index.ts                        # re-export zod
│   │       ├── error-map.ts
│   │       ├── refinements/
│   │       │   ├── password.ts
│   │       │   ├── mime-whitelist.ts
│   │       │   ├── file-size.ts
│   │       │   ├── email.ts
│   │       │   └── uuid.ts
│   │       └── index.ts
│   ├── contract/                               # @cloudvault/contract
│   │   └── src/
│   │       ├── auth/
│   │       ├── files/
│   │       ├── profile/
│   │       ├── dashboard/
│   │       ├── health/
│   │       └── index.ts
│   ├── eslint-config/
│   └── typescript-config/
│
├── lambdas/
│   ├── thumbnail-generator/
│   │   ├── handler.py
│   │   ├── requirements.txt
│   │   └── tests/
│   └── orphan-reconciler/
│       ├── handler.py
│       └── requirements.txt
│
├── infra/
│   └── cdk/
│       ├── bin/cloudvault.ts
│       ├── lib/
│       │   ├── storage-stack.ts
│       │   ├── lambda-stack.ts
│       │   ├── api-stack.ts
│       │   └── params-stack.ts
│       └── cdk.json
│
├── .github/workflows/
│   ├── ci.yml
│   ├── deploy-api.yml
│   ├── deploy-lambda.yml
│   └── deploy-infra.yml
├── turbo.json
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

### 4.2 FR → file mapping

**Authentication (FR1–FR10)**
| FR | Files |
|---|---|
| FR1 | `packages/contract/src/auth/register.contract.ts`, `packages/validators/src/auth/register.schema.ts`, `apps/api/src/modules/auth/auth.orpc.ts#register`, `auth.service.ts#register`, `app/(auth)/register/_hooks/use-register-form.ts`, `_actions/register.action.ts`, `_components/register-form.tsx` |
| FR2 | `contract/auth/google.contract.ts`, `auth.service.ts#validateGoogleUser`, `strategies/google.strategy.ts`, `app/(auth)/callback/_components/callback-content.tsx` |
| FR3 | `validators/auth/register.schema.ts`, `auth.service.ts` (Prisma unique → `ORPCError<"EMAIL_TAKEN">`) |
| FR4 | `@cloudvault/zod/refinements/password.ts` |
| FR5 | `contract/auth/login.contract.ts`, `auth.orpc.ts#login`, `auth.service.ts#login`, `app/(auth)/login/_hooks/use-login-form.ts` |
| FR6 | `auth.orpc.ts#googleCallback`, `strategies/google.strategy.ts`, `guards/google-auth.guard.ts` |
| FR7 | `auth.service.ts#issueTokens`, `strategies/jwt.strategy.ts`, `refresh-token.prisma` |
| FR8 | `core/orpc/client.ts` (401 interceptor), `auth.orpc.ts#refresh`, `auth.service.ts#refresh` |
| FR9 | `auth.orpc.ts#logout`, `auth.service.ts#logout`, `core/auth/hooks/use-logout.ts` |
| FR10 | `apps/web/proxy.ts`, `core/auth/components/auth-guard.tsx`, `core/orpc/client.ts` (401 → redirect) |

**User Profile (FR11–FR12)**
| FR | Files |
|---|---|
| FR11 | `contract/profile/me.contract.ts`, `profile.orpc.ts#me`, `profile.service.ts#findMe`, `core/auth/hooks/use-profile.ts`, `_components/profile-info-card.tsx` |
| FR12 | `contract/profile/update.contract.ts`, `validators/profile/update-profile.schema.ts`, `profile.orpc.ts#update`, `profile.service.ts#updateName`, `_hooks/use-update-profile-form.ts`, `_actions/update-profile.action.ts`, `_components/update-name-form.tsx` |

**File Upload (FR13–FR21)**
| FR | Files |
|---|---|
| FR13 | `core/files/components/upload-zone.tsx` (input file), `_hooks/use-upload-file.ts` |
| FR14 | `core/files/components/upload-zone.tsx` (drop handlers) |
| FR15 | `@cloudvault/zod/refinements/mime-whitelist.ts`, `validators/files/upload-intent.schema.ts`, `files.service.ts#validateMime` (`file-type` package) |
| FR16 | `@cloudvault/zod/refinements/file-size.ts`, `files/s3/presigned-post.ts` (`Content-Length-Range` condition) |
| FR17 | `files.service.ts#createUploadIntent`, `files/s3/presigned-post.ts`, key `users/{userId}/originals/{uuid}.{ext}` |
| FR18 | `_hooks/use-upload-file.ts` (direct fetch to S3) |
| FR19 | `_hooks/use-upload-file.ts` (`XMLHttpRequest` for upload progress) |
| FR20 | `files.service.ts#createUploadIntent` (insert `File` with `status: PENDING`) |
| FR21 | `files.service.ts` + Lambda post-upload (magic bytes double-check) |

**Thumbnail Generation (FR22–FR26)**
| FR | Files |
|---|---|
| FR22 | `lambdas/thumbnail-generator/handler.py` (Pillow) |
| FR23 | Lambda S3 trigger on `users/*/originals/*`, non-blocking |
| FR24 | Lambda writes to `users/{userId}/thumbnails/{uuid}.webp` |
| FR25 | Lambda → NestJS webhook `POST /webhooks/thumbnail-ready` → `File.thumbnailKey` + `status: READY` |
| FR26 | Lambda try/except + SQS DLQ, `File.status: FAILED` after retry exhaustion |

**File Listing (FR27–FR31)**
| FR | Files |
|---|---|
| FR27 | `contract/files/list.contract.ts`, `validators/files/list-files.schema.ts`, `files.orpc.ts#list`, `files.service.ts#list` (Prisma offset pagination) |
| FR28 | `_components/file-card.tsx`, `_hooks/use-files-list.ts` |
| FR29 | `_components/files-pagination.tsx` |
| FR30 | `_components/file-card.tsx` + `files.service.ts#signThumbnailUrl` |
| FR31 | `_components/file-icon.tsx` (lucide-react) |

**File Deletion (FR32–FR36)**
| FR | Files |
|---|---|
| FR32 | `contract/files/delete.contract.ts`, `files.orpc.ts#delete`, `files.service.ts#delete`, `_hooks/use-delete-file.ts` |
| FR33 | `_components/file-delete-dialog.tsx` (shadcn AlertDialog) |
| FR34 | `files.service.ts#delete` (DB first, S3 best-effort) + `lambdas/orphan-reconciler/` |
| FR35 | `files.service.ts#delete` (delete both `storageKey` and `thumbnailKey`) |
| FR36 | `files.service.ts#delete` (where clause `userId`), `ORPCError<"NOT_FOUND">` (avoid existence leak) |

**Dashboard (FR37–FR40)**
| FR | Files |
|---|---|
| FR37 | `contract/dashboard/stats.contract.ts`, `dashboard.orpc.ts#stats`, `dashboard.service.ts#getStats`, `_hooks/use-storage-stats.ts`, `_components/storage-stats-card.tsx` |
| FR38 | `core/files/components/upload-zone.tsx` (promoted shared component) |
| FR39 | `contract/dashboard/recent-files.contract.ts`, `dashboard.service.ts#getRecentFiles`, `_hooks/use-recent-files.ts`, `_components/recent-files-grid.tsx` |
| FR40 | `core/ui/format/format-bytes.ts` (pure utility) |

**Navigation & Layout (FR41–FR44)**
| FR | Files |
|---|---|
| FR41 | `app/(app)/layout.tsx` (Sidebar), `core/ui/nav/app-sidebar.tsx` |
| FR42 | `core/ui/theme-toggle.tsx`, `core/providers/theme-provider.tsx` |
| FR43 | Tailwind 4 `tailwind.config.ts` breakpoints |
| FR44 | `core/ui/nav/user-menu.tsx` (dropdown with `useLogout`) |

**Health & Monitoring (FR45–FR46)**
| FR | Files |
|---|---|
| FR45 | `contract/health/check.contract.ts`, `apps/api/src/modules/health/health.orpc.ts`, `health.service.ts` (ping Prisma + `HeadBucket` S3) |
| FR46 | `apps/api/src/common/filters/orpc-error.filter.ts` (global, §3.5) |

### 4.3 NFR → implementation

| NFR | Implementation |
|---|---|
| p95 < 200ms | Neon pooler + TanStack `staleTime` + composite index `(user_id, created_at DESC)` |
| Upload 5MB < 10s | Direct-to-S3 (no API proxy) |
| Thumbnail < 5s | Lambda 1024MB memory |
| LCP < 2s | Next.js SSR + `prefetchQuery` + matching skeletons (no CLS) |
| argon2id password hashing | `auth.service.ts` uses `@node-rs/argon2` with OWASP defaults (memoryCost ≥ 19 MiB, timeCost ≥ 2, parallelism 1) |
| TLS 1.2+ | Cloudflare + ALB |
| AES-256 at rest | S3 SSE-S3 |
| CORS strict | `main.ts enableCors({ origin: WEB_ORIGIN, credentials: true })` |
| URL expiry 15 min | `s3/presigned-post.ts Expires: 900` |
| Rate limit 100 req/min/IP | Cloudflare WAF + `@nestjs/throttler` |
| Input sanitization | oRPC Zod validation at boundary |
| CSP/HSTS/X-CTO | `helmet` + `next.config.ts` |
| 100 concurrent users | Fargate auto-scaling (min 1, max 3 tasks) |
| 100k files/user | Composite index + offset pagination |
| Horizontal scaling | Fargate ECS + ALB + stateless JWT |
| WCAG 2.1 AA | Radix + Lighthouse CI |
| OpenAPI 3.0 | `@orpc/openapi` auto-generation |
| OAuth 2.0 Google | `passport-google-oauth20` |
| S3 SDK v3 | `@aws-sdk/client-s3`, `@aws-sdk/s3-presigned-post` |
| PostgreSQL 16 | Neon |

### 4.4 Shared code inventory

**`@cloudvault/types`:**
- `auth/` — `User`, `Session`, `Tokens`, `OAuthProvider`, `AuthContext`
- `files/` — `FileMetadata`, `FileStatus`, `UploadIntent`, `PresignedPost`, `ThumbnailInfo`
- `profile/` — `Profile`, `UpdateProfileInput`
- `dashboard/` — `StorageStats`, `RecentFile`
- `common/` — `Pagination<T>`, `ApiError`, `ApiErrorCode`, `ISODateString`, `Uuid`

**`@cloudvault/validators`:**
- `auth/` — `loginSchema`, `registerSchema`, `refreshSchema`
- `files/` — `uploadIntentSchema`, `listFilesSchema`, `deleteFileSchema`
- `profile/` — `updateProfileSchema`

**`@cloudvault/zod`:**
- `refinements/` — `password`, `mimeWhitelist`, `fileSize`, `email`, `uuid`
- `error-map.ts` (i18n)
- `index.ts` — re-export `zod`

**`@cloudvault/contract`:**
- Per-feature contract files importing validators + types
- Root `contract` tree consumed by both NestJS (`@orpc/server/nest`) and Next.js (`@orpc/client`)

**`apps/web/core/` (promoted):**
- `auth/`, `orpc/`, `query/`, `providers/`, `ui/`, `files/components/upload-zone.tsx`, `i18n/`

### 4.5 Integration boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                       Cloudflare                            │
│              (WAF, CDN, rate-limit edge)                    │
└──────────┬───────────────────────────────────┬──────────────┘
           │                                   │
           ▼                                   ▼
┌────────────────────────┐         ┌──────────────────────────┐
│   Next.js (Vercel EU)  │  oRPC   │   NestJS (Fargate EU)    │
│   - SSR + hydration    │ ◄─────► │   - /api/rpc/* handler   │
│   - proxy.ts middleware│         │   - throttler            │
│   - zapaction          │         │   - helmet + CORS        │
└────────┬───────────────┘         └─────┬────────────────────┘
         │                               │
         │ HTTPS direct upload           │
         ▼                               ▼
┌────────────────────────┐         ┌────────────────────┐
│   S3 eu-west-3         │         │   Neon PostgreSQL  │
│   (SSE-S3)             │         │   (EU region)      │
│   users/*/originals/   │         │   + pooler         │
│   users/*/thumbnails/  │         └────────────────────┘
└────────┬───────────────┘
         │ ObjectCreated trigger
         ▼
┌────────────────────────┐
│  Lambda thumbnail      │
│  (Python + Pillow)     │
│  writes to S3 +        │
│  calls NestJS webhook  │
└────────────────────────┘

┌────────────────────────┐
│  Lambda orphan-cleaner │  ◄── EventBridge rate(7 days)
│  (Python + boto3)      │
└────────────────────────┘
```

**External contracts:**
| Boundary | Protocol | Auth | Wrapper |
|---|---|---|---|
| Web → API | HTTPS/oRPC | JWT Bearer (httpOnly cookies) | `core/orpc/client.ts` |
| API → Neon | PG/SSL | Connection string | `PrismaService` |
| API → S3 | HTTPS/SDK v3 | Fargate task IAM role | `files/s3/s3.service.ts` |
| API → Google OAuth | HTTPS/OAuth2 | Client ID/Secret | `strategies/google.strategy.ts` |
| Lambda → S3 | HTTPS/boto3 | Lambda IAM role | `handler.py` |
| Lambda → API webhook | HTTPS | Shared secret header (SSM) | `files/webhooks/thumbnail-webhook.ts` |
| CI → AWS | OIDC → IAM role | GitHub Actions OIDC | `.github/workflows/` |

---

## 5. Validation Results

### 5.1 Coherence checklist

| # | Check | Status |
|---|---|:---:|
| C1 | Technology decisions are compatible (no conflict) | ✅ |
| C2 | Every FR has a clear implementation path (46/46) | ✅ |
| C3 | Every NFR has a concrete strategy (22/22) | ✅ |
| C4 | GDPR/data residency constraints respected | ✅ |
| C5 | Security constraints (NFR) all covered | ✅ |
| C6 | Target scale (100 users / 100k files/user) supported | ✅ |
| C7 | No orphan decisions (each choice maps to a requirement) | ✅ |
| C8 | Each external boundary has a testable wrapper | ✅ |
| C9 | `component → hook → action/orpc` rule enforced (ESLint) | ✅ |
| C10 | 4-state UI rule (loading/error/empty/data) formalized | ✅ |
| C11 | `@cloudvault/zod` single-version enforcement (ESLint) | ✅ |
| C12 | oRPC contract shared (no type duplication) | ✅ |
| C13 | Test coverage targets aligned with NFR "80% backend" | ✅ |
| C14 | CI/CD blocking gates defined | ✅ |

### 5.2 Known gaps (mitigation planned)

| # | Gap | Mitigation |
|---|---|---|
| G1 | OpenAPI docs UI | `/api/docs` route with Scalar UI via `@orpc/openapi` |
| G2 | 80% backend coverage from 2 existing specs | TDD per story, not big-bang |
| G3 | Lambda webhook secret rotation | SSM Parameter Store, manual rotation MVP → automated v2 |
| G4 | Fargate cold start | `min_capacity: 1` (always 1 warm task) |
| G5 | User storage quota | **`User.storageQuotaBytes` in DB (default 5 GB)**, checked in `files.service.ts#createUploadIntent` → `ORPCError<"QUOTA_EXCEEDED">`. Prepares Phase 2 monetization. |
| G6 | Upload status READY sync | TanStack Query `refetchInterval` conditional on `status === PENDING` |
| G7 | i18n dictionary | `core/i18n/messages/{fr,en}.ts` — MVP: French hardcoded in Zod error map |

### 5.3 Residual risks (documented, non-blocking)

| Risk | P | Impact | Mitigation |
|---|---|---|---|
| Neon cold start degrades p95 > 200ms | M | M | CloudWatch alert → migrate to Prisma Accelerate |
| Cloudflare WAF blocks legitimate uploads | L | M | Progressive WAF tuning, observable logs |
| Fargate cost overrun | M | L | AWS Budget + alert at 80% |
| CDK deploy breaks prod (no staging) | M | H | `cdk diff` mandatory + manual approval in `workflow_dispatch` |
| Playwright e2e flaky | M | L | Scope to 3 PRD User Journeys only |

---

## 6. Next Steps

Architecture is approved and locked. Proceed with:

1. `/aped-epics` — Generate epic structure from this architecture + PRD
2. `/aped-story` — Break down epics into story files
3. `/aped-dev` — Implement stories with TDD (red-green-refactor)
4. `/aped-review` — Adversarial review enforcing the rules in this document

**Rules enforced by `/aped-dev` and `/aped-review`:**
- Encapsulation rule (§3.2) — component never imports action/orpc directly
- Local/Global split rule (§3.3) — promote only on 2nd usage
- 4-state UI rule (§3.4) — all data components handle loading/error/empty/data
- Backend layer boundaries (§3.6) — orpc delegates to service, service owns business logic
- Coverage targets (§3.8) — 80% backend services, no mock Prisma (Testcontainers)
- Conventional Commits + Squash merge (§3.9)
- Import rules (§3.10) — ESLint `no-restricted-imports` for zod/actions/orpc

Deviations from this document require a new `/aped-arch` session.
