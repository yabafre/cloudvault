# Project Context: CloudVault

## Tech Stack

- **Language:** TypeScript 5.x (primary), Python 3.x (Lambda)
- **Runtime:** Node.js ≥20.0.0
- **Backend Framework:** NestJS 11 (Express platform)
- **Frontend Framework:** Next.js 16 (App Router) + React 19
- **Database:** PostgreSQL (Neon) via Prisma ORM 6
- **CSS:** Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **State Management:** Zustand 5 (localStorage persistence)
- **API Client:** ky (frontend HTTP client)
- **Forms:** react-hook-form 7 + Zod 4 validation
- **Server Actions:** zsa + zsa-react + zsa-react-query
- **Package Manager:** pnpm 9.15.0
- **Monorepo Tool:** Turborepo 2.x
- **Test Frameworks:** Jest 29 (backend), Vitest 2 (frontend)
- **Lambda Runtime:** Python (Pillow, boto3)

## Architecture

- **Pattern:** Monorepo with Turborepo — module-based backend (NestJS), feature-based frontend (Next.js App Router)
- **Entry Points:**
  - API: `apps/api/src/main.ts` (port 4000)
  - Web: `apps/web/app/layout.tsx` (port 3000)
  - Lambda: `lambdas/thumbnail-generator/handler.py`
- **Key Modules:**
  - `apps/api/src/modules/auth/` — Authentication (JWT + Refresh tokens + Google OAuth)
  - `apps/api/src/prisma/` — Global PrismaModule (database access)
  - `apps/web/core/auth/` — Frontend auth (stores, hooks, actions, components)
  - `apps/web/core/providers/` — App providers (ReactQuery, Theme, Auth, Toaster)
  - `packages/types/` — Shared TypeScript types (User, File, Auth, API responses)
  - `packages/eslint-config/` — Shared ESLint configs (base, nest, next, library)
  - `packages/typescript-config/` — Shared TSConfig (base, nestjs, nextjs)

### Data Flow

```
Client (Next.js) → ky HTTP client → NestJS API (port 4000) → Prisma ORM → PostgreSQL (Neon)
                                         ↓
                            JWT validation (global guard)
                                         ↓
                            Module controllers → Services → PrismaService
```

### Authentication Flow

```
Registration/Login:
  Client form → zsa server action → NestJS /auth/* → bcrypt validation → JWT + Refresh token → httpOnly cookie

Google OAuth:
  Client → /auth/google → Google consent → /auth/google/callback → JWT tokens → redirect to frontend /auth/callback

Token Refresh:
  ky interceptor (401) → /auth/refresh → new JWT + revoke old refresh token → retry request

Route Protection:
  Server-side: proxy.ts middleware (checks refreshToken cookie)
  Client-side: AuthGuard component (checks Zustand auth state)
```

### Database Models

| Model | Purpose | Relations |
|-------|---------|-----------|
| User | Platform user with email/OAuth | Has many Files, RefreshTokens |
| File | S3 file metadata | Belongs to User |
| RefreshToken | JWT refresh token tracking | Belongs to User |

### External Integrations

| Service | Purpose | Protocol | Status |
|---------|---------|----------|--------|
| PostgreSQL (Neon) | Primary database | TCP/SSL | Active |
| Google OAuth | Social authentication | HTTPS/OAuth2 | Active |
| AWS S3 | File storage | HTTPS (SDK v3) | Planned |
| AWS Lambda | Thumbnail generation | S3 trigger | Ready (not deployed) |
| Cloudflare | CDN/WAF/DNS | HTTPS | Planned |
| Swagger | API documentation | HTTP (/api/docs) | Active |

## Conventions

### File Naming
- **TypeScript files:** kebab-case (`auth.service.ts`, `jwt-auth.guard.ts`, `use-login.ts`)
- **React components:** kebab-case files, PascalCase exports (`login-form.tsx` → `LoginForm`)
- **Directories:** kebab-case (`core/auth/`, `_components/`, `_hooks/`)
- **Next.js private folders:** underscore prefix (`_hooks/`, `_components/`, `_actions/`) — prevents route creation
- **Barrel exports:** `index.ts` in every module/directory

### Code Organization
- **Backend:** Module-based (NestJS pattern) — each feature has its own module, controller, service, DTOs, guards, strategies
- **Frontend shared code:** `core/` directory organized by feature (`core/auth/`, `core/providers/`)
- **Frontend page-specific code:** Co-located with pages using `_hooks/`, `_components/`, `_actions/` folders
- **Shared types:** Centralized in `packages/types/src/index.ts`

### Code Style
- **Linter:** ESLint 9 with `@vercel/style-guide` base, `@typescript-eslint`, `prettier` plugin
- **Formatter:** Prettier (single quotes)
- **Path aliases:** `@/*` → `src/*` (API), `@/*` → root (Web)
- **Imports:** Barrel exports preferred via `index.ts`
- **Backend decorators:** `@Public()` to bypass global JWT guard, `@CurrentUser()` for user extraction
- **Frontend state:** Zustand stores with selector hooks pattern for performance

### Error Handling
- **Backend:** NestJS built-in exceptions (`ConflictException`, `UnauthorizedException`, `BadRequestException`)
- **Validation:** Global `ValidationPipe` with whitelist + forbidNonWhitelisted + transform
- **Frontend:** zsa server actions with error handling, sonner toast notifications

### Logging
- **Backend:** NestJS `Logger` class (structured per-service logging)
- **Prisma:** Query logging in development, error-only in production

### Config Management
- Single `.env` file at monorepo root (loaded via `dotenv-cli` for scripts, `@nestjs/config` for API)
- `NEXT_PUBLIC_` prefix for frontend-exposed variables
- No `.env` files in individual apps

## Dependencies

### Backend (apps/api) — 19 production deps

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| @nestjs/common | ^11.0.1 | Core NestJS framework | Minor update available |
| @nestjs/config | ^4.0.2 | Environment configuration | OK |
| @nestjs/core | ^11.0.1 | NestJS core | Minor update available |
| @nestjs/jwt | ^11.0.2 | JWT token management | OK |
| @nestjs/passport | ^11.0.5 | Authentication strategies | OK |
| @nestjs/platform-express | ^11.0.1 | Express HTTP adapter | Minor update available |
| @nestjs/swagger | ^11.2.3 | API documentation | Minor update available |
| @prisma/client | ^6.0.0 | Database ORM client | OK |
| bcrypt | ^6.0.0 | Password hashing | OK |
| class-transformer | ^0.5.1 | DTO transformation | OK |
| class-validator | ^0.14.3 | DTO validation | OK |
| cookie-parser | ^1.4.7 | Cookie middleware | OK |
| passport | ^0.7.0 | Auth framework | OK |
| passport-google-oauth20 | ^2.0.0 | Google OAuth strategy | OK |
| passport-jwt | ^4.0.1 | JWT strategy | OK |
| passport-local | ^1.0.0 | Local auth strategy | OK |
| reflect-metadata | ^0.2.2 | Decorator metadata | OK |
| rxjs | ^7.8.1 | Reactive extensions | OK |
| uuid | ^13.0.0 | UUID generation | OK |

### Frontend (apps/web) — 42 production deps

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| next | latest | React framework | Update available (16.1→16.2) |
| react / react-dom | latest | UI library | Minor update available |
| zustand | ^5.0.9 | State management | Minor update available |
| ky | ^1.14.2 | HTTP client | OK |
| react-hook-form | ^7.70.0 | Form management | Minor update available |
| @hookform/resolvers | ^5.2.2 | Form validation resolvers | OK |
| zod | ^4.3.4 | Schema validation | Minor update available |
| zsa / zsa-react / zsa-react-query | ^0.6.0 | Server actions | OK |
| @tanstack/react-query | ^5.90.16 | Server state management | Minor update available |
| tailwind-merge | ^3.4.0 | Tailwind class merging | OK |
| class-variance-authority | ^0.7.1 | Component variants | OK |
| lucide-react | ^0.562.0 | Icon library | OK |
| next-themes | ^0.4.6 | Theme toggling | OK |
| sonner | ^2.0.7 | Toast notifications | OK |
| recharts | 2.15.4 | Charts library | OK |
| @radix-ui/* | various | UI primitives (17 packages) | OK |
| cmdk | ^1.1.1 | Command palette | OK |
| embla-carousel-react | ^8.6.0 | Carousel component | OK |
| date-fns | ^4.1.0 | Date utilities | OK |
| vaul | ^1.1.2 | Drawer component | OK |

### Deprecated Packages
- `@types/uuid` — Deprecated (uuid v13+ ships its own types)

### Security Advisories (65 total)
- **1 critical:** handlebars 4.7.8 (via ts-jest) — JS injection via AST type confusion
- **30 high:** Includes Next.js HTTP deserialization DoS
- **28 moderate**
- **6 low:** Includes handlebars property access bypass

> Note: Most vulnerabilities are in transitive dev dependencies. The critical handlebars issue is only in the test toolchain (ts-jest), not in production code.

## Testing

### Backend (Jest)
- **Framework:** Jest 29 + ts-jest
- **Test files:** Co-located with source (`*.spec.ts`)
- **Existing tests:** 2 spec files (`app.controller.spec.ts`, `prisma.service.spec.ts`)
- **Coverage:** Minimal — only boilerplate tests exist
- **E2E setup:** Directory exists (`apps/api/test/`) but empty (jest-e2e.json configured)

### Frontend (Vitest)
- **Framework:** Vitest 2 + @testing-library/react + jsdom
- **Test setup:** `apps/web/test/setup.ts` (localStorage/sessionStorage mocks, next/navigation mock, sonner mock)
- **Existing tests:** 0 test files — setup infrastructure only
- **Coverage:** @vitest/coverage-v8 configured but no tests to cover

### CI/CD
- **Platform:** GitHub Actions
- **Workflows:** `ci.yml` and `deploy.yml` exist but are **empty placeholder files**
- **No active CI/CD pipeline** — builds and tests must be run manually

## Integration Points

| Service | Purpose | Protocol |
|---------|---------|----------|
| Neon PostgreSQL | Primary data store | PostgreSQL over SSL |
| Google OAuth 2.0 | Social login provider | HTTPS |
| AWS S3 | File storage (planned) | HTTPS/AWS SDK v3 |
| AWS Lambda | Image thumbnail generation | S3 event trigger |
| Cloudflare | CDN, WAF, DNS (planned) | HTTPS |

## Notes for Development

### Current State
- **Authentication is fully implemented** on both backend and frontend (local + Google OAuth)
- **File management module does not exist yet** — only the Prisma File model is defined
- **No S3 integration code** — AWS SDK not yet added as dependency
- **Frontend test infrastructure is set up** but no actual tests written
- **CI/CD pipelines are empty** — no automated testing or deployment
- **Swagger docs are available** at `/api/docs` during development

### Key Patterns to Follow
1. **New backend features:** Create NestJS module → import in `app.module.ts` → use `@Public()` for open endpoints
2. **New frontend pages:** Create page under `app/` → use `_hooks/`, `_components/`, `_actions/` for page-specific code
3. **Shared frontend logic:** Place in `core/<feature>/` with barrel exports
4. **New shared types:** Export from `packages/types/src/index.ts`
5. **Database changes:** Modify `apps/api/prisma/schema.prisma` → run `pnpm db:migrate` from root
6. **Environment variables:** Add to root `.env` + `.env.example`

### Priorities for Next Development
1. File upload module (NestJS + S3 pre-signed URLs)
2. File listing and deletion endpoints
3. Lambda deployment for thumbnail generation
4. User dashboard UI with file management
5. Responsive design implementation
6. CI/CD pipeline activation
7. Address security advisories (especially Next.js update)

### Monorepo Specifics
- All commands run from root with `pnpm` or `dotenv -- turbo`
- Workspace protocol `workspace:*` for internal dependencies
- Turborepo caches build outputs (`.next/**`, `dist/**`)
- `pnpm-lock.yaml` is the lock file (516KB)
