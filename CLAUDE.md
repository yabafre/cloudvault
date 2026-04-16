# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- APED:START -->
## APED Method — Working Rules

**CloudVault** uses the **APED Method** — a disciplined, user-driven development pipeline.

```
Analyze → PRD → UX → Architecture → Epics → Story → Dev → Review
```

**Project config** (`.aped/config.yaml`):
- Project: `cloudvault`
- User: `Alex`
- Communication language: `french`
- Document output language: `english`
- Ticket system: Linear · Git provider: GitHub

### Working Rules

**1. Plan Mode Default**
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

**2. Subagent Strategy**
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

**3. Self-Improvement Loop**
- After ANY correction from the user: update `docs/aped/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Review lessons at session start

**4. Verification Before Done**
- Never mark a task complete without proving it works
- Run tests, check logs, demonstrate correctness
- Ask: "Would a staff engineer approve this?"

**5. Demand Elegance (Balanced)**
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: implement the elegant solution
- Skip for simple, obvious fixes — don't over-engineer

**6. Autonomous Bug Fixing**
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them

### APED-Specific Rules

**7. Never Auto-Chain Phases** — Each APED skill ends with "Run /aped-X when ready". STOP. Wait for user.

**8. Validate Before Persisting** — Never write artifacts to `docs/aped/` until the user has explicitly validated.

**9. Story-Driven Dev** — Never code without a story file. Use `/aped-story` first. Use the epic context cache.

**10. Frontend = Visual Verification** — Detect frontend stories. Use `mcp__react-grab-mcp__get_element_context` at every GREEN pass.

**11. Architecture is LAW** — `docs/aped/architecture.md` is APPROVED and binding for `/aped-dev`, `/aped-story`, `/aped-review`. Deviations require a new `/aped-arch` session.

### Task Management

1. **Plan First** — TaskCreate with checkable items
2. **Verify Plan** — Check in with user before implementation
3. **Track Progress** — TaskUpdate as you complete items
4. **Document Results** — Update story file's Dev Agent Record
5. **Capture Lessons** — Update `docs/aped/lessons.md` after corrections

### Core Principles

- **Simplicity First** — minimal code impact
- **No Laziness** — root causes, no temporary fixes
- **User Controls Pace** — collaborative, not automated
- **Quality > Speed** — validation gates exist for a reason

### APED Project State

- Engine: `.aped/` (immutable after install)
- Artifacts: `docs/aped/` (evolves during project)
- State machine: `docs/aped/state.yaml`
- Lessons: `docs/aped/lessons.md`
- Project context (brownfield): `docs/aped/project-context.md`
- Product brief: `docs/aped/product-brief.md`
- PRD: `docs/aped/prd.md`
- UX specs: `docs/aped/ux/` — Preview app: `docs/aped/ux-preview/`
- **Architecture (LAW):** `docs/aped/architecture.md`
- Current phase: `architecture` (done) → next: `epics`

### Slash Commands Cheat Sheet

| Pipeline | Utility |
|----------|---------|
| /aped-analyze | /aped-status |
| /aped-prd | /aped-course |
| /aped-ux | /aped-context |
| /aped-arch | /aped-qa |
| /aped-epics | /aped-quick |
| /aped-story | /aped-check |
| /aped-dev | /aped-claude |
| /aped-review | |

<!-- APED:END -->

## Project Overview

**CloudVault** is a privacy-first cloud file storage platform built as a TypeScript monorepo with a NestJS backend and a Next.js 16 frontend, communicating through a **contract-first, end-to-end type-safe RPC layer (oRPC)**. Data in PostgreSQL (Neon EU) via Prisma 7, files in AWS S3 (eu-west-3) via pre-signed POST, async thumbnails via Python Lambda. Infra as AWS CDK, deployed via GitHub Actions OIDC.

**Primary Stack:**
- **Backend:** NestJS 11 + Prisma 7.7.0 (schema folder) + PostgreSQL (Neon EU)
- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui
- **RPC:** oRPC (contract-first, OpenAPI 3.0) via `@cloudvault/contract`
- **Server Actions:** `zapaction` — Next.js-only actions (cookies, redirects, revalidation)
- **Forms:** TanStack Form (`@tanstack/react-form` + `@tanstack/react-form-nextjs`)
- **State:** Zustand 5 (auth) + TanStack Query (server state via `@orpc/tanstack-query`)
- **Validation:** Zod, version-locked via `@cloudvault/zod`, schemas in `@cloudvault/validators`
- **Storage:** AWS S3 eu-west-3 (SSE-S3, pre-signed POST policy)
- **Thumbnails:** Python Lambda (Pillow) + S3 trigger
- **Hosting:** Vercel EU (web) + AWS Fargate eu-west-3 (api)
- **IaC:** AWS CDK (TypeScript)
- **CDN/WAF:** Cloudflare · **Monitoring:** Sentry + CloudWatch + Better Stack Logs
- **Tooling:** Turborepo 2 + pnpm ≥9 + Node ≥20

## Essential Commands

### Development Workflow
```bash
pnpm install          # Install dependencies (pnpm only)
pnpm dev              # Start all services in dev mode
pnpm build            # Build all packages
pnpm test             # Run tests across monorepo
pnpm lint             # Lint code
pnpm format           # Format with Prettier
pnpm clean            # Clean build artifacts and node_modules
```

### Prisma Commands (from root)
```bash
pnpm db:generate      # Generate Prisma client after schema changes
pnpm db:migrate       # Create and apply migrations (dev)
pnpm db:migrate:prod  # Deploy migrations (production)
pnpm db:studio        # GUI database interface
pnpm db:push          # Push schema without migration
pnpm db:reset         # Reset database (deletes all data)
```

**Prisma 7 schema folder layout** (`apps/api/prisma/schema/`):
- `schema.prisma` — datasource + generator
- `user.prisma`, `file.prisma`, `refresh-token.prisma` — one file per model

### App-Specific Commands
```bash
pnpm dev:api          # API dev with watch (port 4000)
pnpm build:api
pnpm test:api

cd apps/web && pnpm dev    # Web dev (port 3000)
```

## Architecture & Structure

### Monorepo Organization

```
apps/
├── api/              # NestJS 11 backend (port 4000)
│   ├── prisma/schema/    # Multi-file Prisma 7 schema
│   └── src/
│       ├── main.ts       # Bootstrap (helmet, CORS, oRPC, Scalar /api/docs)
│       ├── app.module.ts
│       ├── prisma/       # Global PrismaModule + PrismaService
│       ├── orpc/         # Global OrpcErrorFilter, oRPC adapter (@orpc/server/nest)
│       └── modules/
│           ├── auth/     # auth.orpc.ts, auth.service.ts, strategies/, guards/, decorators/
│           ├── files/    # upload-intent, list, delete (to build)
│           ├── profile/, dashboard/, health/, webhooks/
│
└── web/              # Next.js 16 frontend (port 3000)
    ├── core/                 # Shared feature-scoped code
    │   ├── auth/             # api/, stores/, hooks/, components/ (AuthGuard)
    │   ├── orpc/             # oRPC client + TanStack Query integration
    │   ├── ui/skeletons/     # Global reusable skeletons
    │   └── providers/        # Unified providers
    ├── app/
    │   ├── (auth)/           # Route group: auth/login, register, callback
    │   │   └── <route>/_hooks, _components, _actions  (underscore = private)
    │   ├── (app)/            # Route group: dashboard, files, profile
    │   │   └── <route>/_hooks, _components, _actions, loading.tsx, error.tsx
    │   └── layout.tsx
    ├── components/ui/        # shadcn/ui primitives only (no business logic)
    └── proxy.ts              # Next.js 16 edge proxy (server-side route protection)

packages/
├── types/              # @cloudvault/types — src/<feature>/<feature>.types.ts
├── validators/         # @cloudvault/validators — src/<feature>/<action>.schema.ts
├── zod/                # @cloudvault/zod — version-locked Zod re-export (ONLY importer of zod)
├── contract/           # @cloudvault/contract — oRPC contract tree
├── eslint-config/      # Shared ESLint configs
└── typescript-config/  # Shared tsconfig

lambdas/
└── thumbnail-generator/    # Python 3.12 Lambda — S3 trigger → Pillow → thumbnails prefix

infra/
└── cdk/lib/            # AWS CDK TypeScript stacks
    ├── storage-stack.ts    # S3 bucket + lifecycle + CORS
    ├── lambda-stack.ts     # thumbnail-generator + orphan-reconciler
    ├── api-stack.ts        # ECS Fargate + ALB + auto-scaling
    └── params-stack.ts     # SSM Parameter Store
```

### Key Architectural Decisions

**1. Contract-First with oRPC**
- All Web ↔ API calls go through the oRPC contract defined in `@cloudvault/contract`
- Type-safe end-to-end, OpenAPI 3.0 auto-generated at `/api/docs` (Scalar UI)
- `*.orpc.ts` handlers contain **zero business logic** — translation layer only
- Errors: `ORPCError<ApiErrorCode>` with typed codes from `@cloudvault/types`
- Pagination: offset-based `{ page, pageSize: 20 }`
- REST/Swagger from the old auth module is being migrated to oRPC

**2. zapaction vs oRPC (strict split)**
- **oRPC** — all data reads/writes (Web ↔ API)
- **zapaction** — Next.js-only concerns: cookies, redirects, `revalidatePath`, server actions
- Never use zapaction for data fetching; never use oRPC for Next.js-specific effects

**3. Encapsulation Rule (CRITICAL — ESLint-enforced)**
> A component or page NEVER imports an action or an oRPC client directly. It ALWAYS goes through a custom hook.

- `_actions/*`, `core/**/actions/*`, `core/orpc/client` forbidden in `.tsx` files
- Exception: files inside `_hooks/` and `core/**/hooks/`
- Hooks are the public API (exposing `isPending`, `error`, `mutate`, `data`)

**4. Local vs Global split**
- **Local** — `app/<route>/_components/`, `_hooks/`, `_actions/` (used by 1 page only)
- **Global** — `apps/web/core/<feature>/` (used by ≥ 2 pages OR cross-cutting)
- **Promotion rule:** start local, promote to `core/` only on 2nd usage. No premature abstraction.

**5. Four-State Rule (MANDATORY)**
Every data-dependent component must handle: `loading → error → empty → data`. Enforced by `/aped-review`.

**6. Loading / Error strategy**
- `loading.tsx` + `error.tsx` in every route that fetches data or depends on user state
- Skeletons: global primitives in `core/ui/skeletons/`, page-composed in `app/<route>/_components/skeletons/` (match real layout exactly to avoid CLS)
- Three loading levels: route transition (Next.js `loading.tsx`) / data fetching (`isPending` inline skeleton) / mutation (`isSubmitting` + `isPending` → disabled button + spinner + sonner toast)

**7. Backend layer boundaries**
- `*.orpc.ts` → zero logic, calls service
- `*.service.ts` → business logic, calls Prisma + other services
- Controllers/orpc handlers NEVER call Prisma directly
- Services NEVER call another controller
- External integrations (S3, Google OAuth) wrapped in dedicated mockable services

**8. Error handling**
- Unified `ApiErrorCode` type in `@cloudvault/types/common`
- Prisma/business → NestException or ORPCError → `OrpcErrorFilter` normalizes → typed client-side via `isDefinedError()` → custom hook exposes `{ error }` → component switches on `error.code`
- 5xx always mapped to `INTERNAL_ERROR` client-side
- Auth errors (401/403) → oRPC client redirects to `/auth/login?session=expired`
- User-facing messages localized (no hardcoded strings in services)
- No stack traces in client responses — Sentry only

**9. Logging**
- Backend: `nestjs-pino` structured JSON (prod) / pretty (dev), includes `requestId`, `userId?`
- `X-Request-Id` correlation middleware propagates through logs + response headers
- Frontend: Sentry SDK only, `no-console: ["error", { allow: ["warn", "error"] }]`

**10. File Upload (pre-signed POST)**
- Server-enforced size + MIME via S3 POST policy conditions (not PUT)
- 15-minute URL expiry
- Key structure: `users/{userId}/originals/{uuid}.{ext}` and `users/{userId}/thumbnails/{uuid}.webp`
- Magic bytes check post-upload via `file-type`
- `User.storageQuotaBytes` default 5 GB checked in `files.service.ts#createUploadIntent`
- Lambda S3 trigger → Pillow → POST `/webhooks/thumbnail-ready` with shared-secret header → updates `File.status` + `File.thumbnailKey`
- SQS DLQ for failures → `File.status = FAILED`
- Weekly EventBridge orphan reconciler Lambda (objects without DB row, age > 24h)

### Naming Conventions

**Files & directories** — `kebab-case` everywhere
- Suffixes: `.service.ts`, `.controller.ts`, `.module.ts`, `.guard.ts`, `.strategy.ts`, `.schema.ts`, `.types.ts`, `.contract.ts`, `.action.ts`, `.orpc.ts`, `.spec.ts`, `.e2e-spec.ts`
- Next.js private folders: `_hooks/`, `_actions/`, `_components/` (underscore prefix)
- Prisma: one `.prisma` file per model, kebab-case (`refresh-token.prisma`)
- Barrel exports: `index.ts` in each exported folder

**Code identifiers**
| Type | Convention | Example |
|---|---|---|
| React components | `PascalCase` | `LoginForm` |
| Hooks | `camelCase` + `use` prefix | `useFilesList`, `useDeleteFile` |
| Zod schemas | `camelCase` + `Schema` suffix | `loginSchema` |
| oRPC contracts | `camelCase` + `Contract` suffix | `loginContract` |
| zapactions | `camelCase` + `Action` suffix | `deleteFileAction` |
| NestJS classes | `PascalCase` + role suffix | `AuthService`, `JwtAuthGuard` |
| Module constants | `SCREAMING_SNAKE_CASE` | `MAX_FILE_SIZE_BYTES` |

**Hook naming**
- Query (read): `use<Feature><Resource>` → `useFilesList`, `useProfile`
- Mutation (write): `use<Verb><Resource>` → `useDeleteFile`, `useUploadFile`
- Form orchestrator: `use<Feature>Form` → `useLoginForm`

**Database**
- Tables: `snake_case` plural (`users`, `files`, `refresh_tokens`) via `@@map`
- Columns: `snake_case` via `@map`, Prisma fields stay `camelCase`
- Indexes: `idx_<table>_<cols>` · FKs: `fk_<table>_<ref>`
- Enums: `PascalCase` + `SCREAMING_SNAKE_CASE` values

**oRPC routes** — kebab-case, resource-oriented, plural. Verbs in contract method, not URL. Non-CRUD = explicit kebab verb (`/auth/refresh`, `/files/upload-intent`).

## Development Guidelines

### Package Manager
**CRITICAL:** This project uses `pnpm` exclusively. Do not use `npm` or `yarn`.
- pnpm ≥ 9.0.0 · Node ≥ 20.0.0

### Environment Configuration
**Single `.env` file at the root** (Turborepo pattern):
```bash
cp .env.example .env
```
- Root commands load `.env` via `dotenv-cli`
- NestJS uses `@nestjs/config` with `envFilePath: '../../.env'`
- Do NOT create `.env` files in `apps/api/` or `apps/web/`
- Config validated by a Zod schema at NestJS boot — API refuses to start if env invalid
- Prod secrets: AWS SSM Parameter Store (SecureString, KMS-encrypted)

### Adding Dependencies
```bash
pnpm --filter @cloudvault/api add <package>
pnpm --filter @cloudvault/web add <package>
pnpm add -w <package>    # root tooling only
```

**Zod version lock:** Only `@cloudvault/zod` may import `zod` directly. All other packages import Zod via `@cloudvault/zod`. Enforced by ESLint `no-restricted-imports`.

### Testing Strategy

**Coverage targets** (enforced by `/aped-review`):
| Zone | Target |
|---|---|
| Backend services (`*.service.ts`) | **80%** (NFR) |
| Backend orpc handlers (`*.orpc.ts`) | 60% |
| Backend guards/strategies | 70% |
| Frontend custom hooks | 70% |
| Frontend components | Smoke tests |
| E2E (3 PRD User Journeys) | 100% |

**Stack:**
- Backend unit: Jest 29 + ts-jest + `@nestjs/testing`
- Backend integration: **Testcontainers Postgres** (real DB, no Prisma mocking)
- Frontend unit: Vitest + Testing Library
- Frontend E2E: Playwright
- Co-location: `*.spec.ts` next to source · Backend E2E: `apps/api/test/*.e2e-spec.ts` · Frontend E2E: `apps/web/test/e2e/`

**`/aped-review` auto-rejects PRs that:**
1. Drop backend coverage below 80%
2. Add a service without `*.spec.ts`
3. Add a custom hook without test

## AWS Integration Notes

**Target regions:** all data/compute in **EU** (eu-west-3 Paris / Neon EU) for GDPR residency.

- **S3:** AWS SDK v3, SSE-S3, pre-signed POST (15-min expiry), user-prefixed keys
- **Lambda:** Python 3.12, Pillow, S3 trigger on `users/*/originals/*`
- **Fargate:** API hosting, min 1 task warm (p95 < 200ms target)
- **Secrets (prod):** SSM Parameter Store via CDK
- **CI auth:** GitHub Actions OIDC to AWS (no long-lived keys)
- **Cloudflare:** DNS + WAF + CDN edge rate limiting

## CI/CD

GitHub Actions workflows:
- `.github/workflows/ci.yml` — lint, typecheck, test, build
- `.github/workflows/deploy.yml` — CDK deploy + Vercel deploy via OIDC

Both currently placeholders to implement against `pnpm lint`, `pnpm test`, `pnpm build`, `cdk deploy`.

## Important Patterns

### NestJS — Service with Prisma
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
```

### NestJS — oRPC handler (zero logic)
```typescript
// auth.orpc.ts — implements contract, delegates to service
@Injectable()
export class AuthOrpcHandler {
  constructor(private authService: AuthService) {}

  @Implement(contract.auth.login)
  login = os.handler(async ({ input }) => {
    return this.authService.login(input); // zero logic here
  });
}
```

### Frontend — Custom hook wraps oRPC (never direct)
```typescript
// core/files/hooks/use-files-list.ts
import { orpcQuery } from '@/core/orpc/client';

export function useFilesList(page: number) {
  return orpcQuery.files.list.useQuery({ page, pageSize: 20 });
}

// In component: files-grid.tsx
import { useFilesList } from '@/core/files/hooks/use-files-list';
export function FilesGrid() {
  const { data, isPending, error } = useFilesList(1);
  // four-state: loading → error → empty → data
}
```

### Frontend — Auth patterns (unchanged, via core/auth)
```typescript
import { useAuth } from '@/core/auth/hooks/use-auth';
import { useLogout } from '@/core/auth/hooks/use-logout';
import { AuthGuard } from '@/core/auth/components/auth-guard';
```

### Page-specific hooks/components
```
app/(auth)/login/
├── _hooks/use-login-form.ts       # TanStack Form orchestrator
├── _actions/login.action.ts       # zapaction for cookie + redirect
├── _components/login-form.tsx
└── page.tsx
```

### Protecting routes
- `proxy.ts` (Next.js 16) — server-side, primary defense
- `<AuthGuard>` component — client-side fallback, prevents content flash

### Shared types & validators
```typescript
// packages/types/src/files/files.types.ts
export interface FileMetadata { ... }

// packages/validators/src/files/upload-intent.schema.ts
import { z } from '@cloudvault/zod';
export const uploadIntentSchema = z.object({ ... });
```

## Troubleshooting

**"Command not found: turbo"** → `pnpm install` at root

**"Cannot find module '@cloudvault/types'"** → `pnpm install` to link workspace deps

**"Prisma client not found"** → `pnpm db:generate` from root

**"Database connection refused"** → Ensure Postgres running, then `pnpm db:migrate`

**Port conflicts** → API: 4000 (`API_PORT`) · Web: 3000

**ESLint `no-restricted-imports` failing in a component** → You're importing an action or `core/orpc/client` directly. Route it through a custom hook.

**`zod` direct import flagged** → Only `@cloudvault/zod` may import `zod`. Use `import { z } from '@cloudvault/zod';`
