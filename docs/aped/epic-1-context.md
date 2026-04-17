# Epic 1 Context — Platform Foundation & Contract Layer

**Compiled:** 2026-04-16
**Stories:** 8 (1-1 done, 1-2 in-progress, 1-3 through 1-8 pending)

## Goal

Scaffold the missing technical foundation that unblocks every subsequent epic: validation layer, contract layer, API transport, database schema, logging, health checks, IaC, and CI/CD.

## Architecture Decisions (LAW)

### §2.5: oRPC Contract-First

- All Web ↔ API calls use **oRPC** (not REST)
- Contract-first, fully type-safe end-to-end
- NestJS integration via `@orpc/server/nest`
- OpenAPI 3.0 auto-generated at `/api/docs` (Scalar UI)
- Contract structure: `auth/`, `files/`, `profile/`, `dashboard/`, `health/`

### §3.5: Error Handling

```ts
type ApiErrorCode =
  | "UNAUTHORIZED" | "SESSION_EXPIRED" | "FORBIDDEN"
  | "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT"
  | "FILE_TOO_LARGE" | "INVALID_MIME" | "QUOTA_EXCEEDED"
  | "EMAIL_TAKEN" | "INVALID_CREDENTIALS"
  | "RATE_LIMITED" | "INTERNAL_ERROR";
```

Error flow: Service → ORPCError → OrpcErrorFilter → typed client via isDefinedError() → hook → component switch

### §3.6: Backend Layer Boundaries

- `*.orpc.ts` = zero logic, translation only
- `*.service.ts` = business logic
- Controllers never call Prisma directly
- Services never call controllers

## Package Hierarchy

```
@cloudvault/zod        → only package importing 'zod' directly (ESLint enforced)
@cloudvault/validators → feature-scoped Zod schemas (imports from @cloudvault/zod)
@cloudvault/types      → TypeScript types, no Zod
@cloudvault/contract   → oRPC contracts (imports validators + types)
```

## Completed Stories

### 1-1: @cloudvault/zod + @cloudvault/validators (DONE)

- Created `@cloudvault/zod` (version-locked Zod re-export)
- Created `@cloudvault/validators` with `common/pagination.schema.ts`
- ESLint `no-restricted-imports` blocks direct `zod` imports
- Rule added to both `base.js` and `next.js` ESLint configs
- `apps/web` migrated off direct zod dependency

## Key Patterns

- Package layout: `"main": "./src/index.ts"`, `"types": "./src/index.ts"`, no build step
- Schemas: `<action>Schema` for input, `<action>OutputSchema` for output
- Pagination: offset-based `{ page, pageSize: 20 }` → `{ items, total, page, totalPages }`
- oRPC routes: kebab-case, resource-oriented, verbs in method not URL

## Story Sequencing

1. ✅ 1-1: Zod + validators packages
2. 🔄 1-2: Contract package scaffold
3. ⏳ 1-3: oRPC NestJS adapter + Scalar UI + error filter
4. ⏳ 1-4: Prisma 7 schema folder refactor
5. ⏳ 1-5: nestjs-pino + request ID middleware
6. ⏳ 1-6: Health endpoint (FR45, FR46)
7. ⏳ 1-7: AWS CDK stacks
8. ⏳ 1-8: GitHub Actions CI/CD

**Gating:** Epic 2 (auth) blocked until stories 1-1 through 1-6 are done.
