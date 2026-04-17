# CloudVault — Epics & Story List

**Generated:** 2026-04-16
**Source PRD:** `docs/aped/prd.md` (46 FRs)
**Source Architecture:** `docs/aped/architecture.md` (LAW)
**Project type:** Brownfield — monorepo scaffold exists, legacy auth module in place

## Legend

- 🆕 **New** — Story builds something that does not exist yet
- 🔄 **Refactor** — Story migrates or reshapes existing code to match the target architecture
- 🔁 **Complete** — Story finishes partially-built functionality

## Epic Overview

| # | Epic | FRs | Stories |
|---|---|---|---|
| 1 | Platform Foundation & Contract Layer | FR45, FR46 | 8 |
| 2 | Users can register and authenticate securely | FR1–FR10 | 10 |
| 3 | Users have a navigable app shell with profile management | FR11, FR12, FR41–FR44 | 5 |
| 4 | Users can upload files with automatic thumbnail generation | FR13–FR26 | 6 |
| 5 | Users can browse and manage their file library | FR27–FR36 | 4 |
| 6 | Users can monitor their storage via dashboard | FR37–FR40 | 2 |

**Total:** 6 epics · 35 stories · 46 FRs mapped

---

## Epic 1 — Platform Foundation & Contract Layer

**Goal:** Scaffold the missing technical foundation that unblocks every subsequent epic. Create workspace packages, migrate the NestJS transport layer from REST/Swagger to oRPC, refactor the Prisma schema to the Prisma 7 folder layout, harden security (helmet, throttler), wire structured logging, and stand up IaC + CI/CD.

**Why first:** The audit showed that `@cloudvault/contract`, `@cloudvault/validators`, `@cloudvault/zod` do not exist, `apps/api/main.ts` still mounts Swagger and REST controllers, and the Prisma schema is monolithic. Any feature work would build on a divergent base. Front-loading the refactor prevents compound drift.

### Stories

#### 1-1-zod-validators-packages 🆕 (S)
**Ticket:** [KON-82](https://linear.app/koni/issue/KON-82)
**Summary:** Create `@cloudvault/zod` (version-locked re-export) and `@cloudvault/validators` (shared Zod schemas per feature). Configure ESLint `no-restricted-imports` to forbid direct `zod` imports elsewhere.
**FRs covered:** —
**Depends on:** none
**AC:**
- Given the monorepo, when `pnpm install` runs, then both new packages resolve and expose their types.
- Given any file outside `@cloudvault/zod`, when it imports `zod` directly, then ESLint reports an error.

#### 1-2-contract-package-scaffold 🆕 (M)
**Ticket:** [KON-83](https://linear.app/koni/issue/KON-83)
**Summary:** Create `@cloudvault/contract` with the oRPC contract tree (auth, files, profile, dashboard, health, webhooks). Contracts are stubs — no handlers yet — but input/output Zod schemas are defined using `@cloudvault/validators`.
**FRs covered:** —
**Depends on:** 1-1-zod-validators-packages
**AC:**
- Given the contract package, when imported from `apps/api` or `apps/web`, then the full contract tree is type-safe.
- Given any contract endpoint, when introspected, then its input and output schemas are Zod schemas from `@cloudvault/validators`.

#### 1-3-orpc-nest-adapter 🔄 (L)
**Ticket:** [KON-84](https://linear.app/koni/issue/KON-84)
**Summary:** Migrate `apps/api/src/main.ts` from Swagger/REST to oRPC. Remove `@nestjs/swagger` and `class-validator`. Wire `@orpc/server/nest` adapter, Scalar UI at `/api/docs`, global `OrpcErrorFilter`, `helmet`, `@nestjs/throttler` (100 req/min/IP).
**FRs covered:** —
**Depends on:** 1-2-contract-package-scaffold
**AC:**
- Given the API starts, when `GET /api/docs` is called, then Scalar UI renders the generated OpenAPI 3.0 document.
- Given any oRPC handler throws an `ORPCError`, when the filter intercepts it, then the response contains a typed `ApiErrorCode`.
- Given 101 requests from the same IP within 60 seconds, when the 101st arrives, then the API responds with 429.
- Given any response, when inspected, then it contains `Content-Security-Policy`, `X-Content-Type-Options`, and `Strict-Transport-Security` headers.

#### 1-4-prisma-schema-folder-refactor 🔄 (S)
**Ticket:** [KON-85](https://linear.app/koni/issue/KON-85)
**Summary:** Split the monolithic `schema.prisma` into the Prisma 7 folder layout: `prisma/schema/schema.prisma` (datasource + generator) + one file per model (`user.prisma`, `file.prisma`, `refresh-token.prisma`).
**FRs covered:** —
**Depends on:** none
**AC:**
- Given the refactor, when `pnpm db:generate` runs, then the Prisma client is generated without error.
- Given existing migrations, when `pnpm db:migrate` runs against a fresh database, then it applies cleanly.

#### 1-5-logging-and-request-id 🆕 (S)
**Ticket:** [KON-86](https://linear.app/koni/issue/KON-86)
**Summary:** Wire `nestjs-pino` (JSON in prod, pretty in dev). Add an `X-Request-Id` correlation middleware that propagates the id through logs and the response header.
**FRs covered:** —
**Depends on:** none
**AC:**
- Given a request without `X-Request-Id`, when it arrives, then the middleware generates one and adds it to the response header and all logs for that request.
- Given a request with `X-Request-Id: abc`, when it arrives, then logs for that request include `requestId: "abc"`.

#### 1-6-health-endpoint 🆕 (S)
**Ticket:** [KON-87](https://linear.app/koni/issue/KON-87)
**Summary:** Implement `/health` oRPC endpoint that reports database connectivity and S3 availability. Ensure all API errors return a structured `ApiErrorCode` response.
**FRs covered:** FR45, FR46
**Depends on:** 1-3-orpc-nest-adapter
**AC:**
- Given the API is running, when `GET /health` is called, then the response contains `{ database: "ok", storage: "ok" }`.
- Given the database is unreachable, when `GET /health` is called, then the response contains `database: "error"` with HTTP 503.
- Given any handler throws, when the client receives the response, then the body matches the `ApiErrorCode` shape with no stack trace.

#### 1-7-aws-cdk-stacks 🆕 (L)
**Ticket:** [KON-88](https://linear.app/koni/issue/KON-88)
**Summary:** Scaffold `infra/cdk/` with TypeScript CDK stacks: `storage-stack` (S3 bucket, lifecycle, CORS), `lambda-stack` (thumbnail generator + orphan reconciler), `api-stack` (ECS Fargate + ALB + auto-scaling), `params-stack` (SSM Parameter Store).
**FRs covered:** —
**Depends on:** none
**AC:**
- Given the CDK app, when `cdk synth` runs, then it produces valid CloudFormation for all stacks without errors.
- Given the storage stack, when synthesized, then the S3 bucket has SSE-S3 encryption, CORS for the web origin, and a lifecycle rule for abandoned uploads.

#### 1-8-github-actions-ci-cd 🆕 (M)
**Ticket:** [KON-89](https://linear.app/koni/issue/KON-89)
**Summary:** Scaffold `.github/workflows/ci.yml` (lint → typecheck → test → build, Turborepo cache) and `.github/workflows/deploy.yml` (CDK deploy + Vercel deploy via OIDC).
**FRs covered:** —
**Depends on:** none
**AC:**
- Given a PR, when pushed, then `ci.yml` runs and enforces `pnpm lint`, `pnpm test`, `pnpm build`.
- Given a push to `main`, when it succeeds CI, then `deploy.yml` is triggered and authenticates via OIDC (no static AWS keys).

---

## Epic 2 — Users can register and authenticate securely

**Goal:** Migrate the existing REST auth module to oRPC contract-first, swap bcrypt for `@node-rs/argon2` (argon2id), complete the web auth stack (oRPC client, TanStack Form, zapaction), and deliver the full auth user journey: email/password, Google OAuth, token refresh, logout, route protection.

**Why:** The audit showed the NestJS auth module is ~60% reusable (JWT strategies, refresh DB tracking, Google OAuth strategy, guards, decorators all in place) but sits behind REST controllers with `class-validator` DTOs. The transport layer must migrate. The web forms use `zsa` + `react-hook-form` and must migrate to `zapaction` + `@tanstack/react-form`.

### Stories

#### 2-1-auth-orpc-migration 🔄 (L)
**Ticket:** [KON-90](https://linear.app/koni/issue/KON-90)
**Summary:** Migrate `auth.controller.ts` REST endpoints to `auth.orpc.ts` handlers. Bind to `@cloudvault/contract` auth contract. Remove `class-validator` DTOs — inputs validated by contract Zod schemas. Services, strategies, and guards preserved.
**FRs covered:** —
**Depends on:** 1-3-orpc-nest-adapter
**AC:**
- Given a valid login input, when sent through the oRPC contract, then it is typed end-to-end and the response matches the contract output schema.
- Given `auth.controller.ts` was removed, when the API starts, then no REST auth routes are registered.

#### 2-1b-argon2-password-hashing 🔄 (S)
**Ticket:** [KON-91](https://linear.app/koni/issue/KON-91)
**Summary:** Swap `bcrypt` for `@node-rs/argon2` (argon2id variant) in `auth.service.ts`. Use OWASP-recommended defaults (memoryCost ≥19 MiB, timeCost ≥2, parallelism 1). Remove `bcrypt` from `package.json`. Add one-time re-hash migration script for existing users (dev DB only at this stage).
**FRs covered:** —
**Depends on:** none
**AC:**
- Given a new user registers, when the password is persisted, then it is hashed with argon2id (prefix `$argon2id$`).
- Given a login with correct credentials, when `verify()` runs, then it succeeds.
- Given `bcrypt` was removed, when `pnpm install` runs, then it is absent from the lockfile.

#### 2-2-registration-email-password 🔁 (S)
**Ticket:** [KON-92](https://linear.app/koni/issue/KON-92)
**Summary:** Complete the register flow via oRPC: email uniqueness check, argon2id hashing, min 8-char validation.
**FRs covered:** FR1, FR3, FR4
**Depends on:** 2-1-auth-orpc-migration, 2-1b-argon2-password-hashing
**AC:**
- Given a new email and valid password, when registering, then a User row is created and argon2id hash is stored.
- Given a duplicate email, when registering, then the response is `ApiErrorCode: EMAIL_ALREADY_EXISTS`.
- Given a password of 7 chars, when registering, then the contract validation rejects it.

#### 2-3-login-email-password 🔁 (S)
**Ticket:** [KON-93](https://linear.app/koni/issue/KON-93)
**Summary:** Complete the login flow via oRPC: verify password with argon2id, issue 15-min access token + 7-day refresh token.
**FRs covered:** FR5, FR7
**Depends on:** 2-1-auth-orpc-migration, 2-1b-argon2-password-hashing
**AC:**
- Given valid credentials, when logging in, then the response contains `{ accessToken, refreshToken, user }`.
- Given invalid credentials, when logging in, then the response is `ApiErrorCode: INVALID_CREDENTIALS`.

#### 2-4-token-refresh-flow 🔁 (M)
**Ticket:** [KON-94](https://linear.app/koni/issue/KON-94)
**Summary:** Implement refresh token rotation: exchange a valid refresh token for a new access + refresh pair, revoke the old one.
**FRs covered:** FR8
**Depends on:** 2-1-auth-orpc-migration
**AC:**
- Given a valid refresh token, when `/auth/refresh` is called, then a new pair is issued and the old refresh is marked revoked in DB.
- Given a revoked refresh token, when reused, then the response is `ApiErrorCode: INVALID_REFRESH_TOKEN`.

#### 2-5-google-oauth 🔄 (M)
**Ticket:** [KON-95](https://linear.app/koni/issue/KON-95)
**Summary:** Migrate Google OAuth callback to oRPC. Account linking (existing email → link Google provider). Existing Google strategy reused.
**FRs covered:** FR2, FR6
**Depends on:** 2-1-auth-orpc-migration
**AC:**
- Given a new Google user, when the callback fires, then a User row is created with `authProvider: GOOGLE`.
- Given an existing email that matches a Google profile, when the callback fires, then the existing account gets a linked Google provider.

#### 2-6-logout 🔁 (S)
**Ticket:** [KON-96](https://linear.app/koni/issue/KON-96)
**Summary:** Logout via oRPC: invalidate the current refresh token, clear cookies via `zapaction`.
**FRs covered:** FR9
**Depends on:** 2-1-auth-orpc-migration
**AC:**
- Given an authenticated user, when logout is called, then the refresh token is marked revoked and auth cookies are cleared.

#### 2-7-web-orpc-client-setup 🆕 (M)
**Ticket:** [KON-97](https://linear.app/koni/issue/KON-97)
**Summary:** Create `apps/web/core/orpc/client.ts` (typed oRPC client), `core/providers/` (QueryClientProvider, Theme), `core/ui/skeletons/` primitives. Wire `@orpc/tanstack-query` for type-safe React Query hooks.
**FRs covered:** —
**Depends on:** 1-2-contract-package-scaffold
**AC:**
- Given any component, when using `orpcQuery.auth.login.useMutation()`, then the call is fully typed from contract to response.
- Given the providers, when wrapping `app/layout.tsx`, then TanStack Query devtools are available in dev.

#### 2-8-web-auth-forms-migration 🔄 (L)
**Ticket:** [KON-98](https://linear.app/koni/issue/KON-98)
**Summary:** Migrate `app/(auth)/login` and `app/(auth)/register` forms from `react-hook-form` → `@tanstack/react-form` and from `zsa` actions → `zapaction`. Use custom hooks (`useLoginForm`, `useRegisterForm`) per the Encapsulation Rule. Remove `react-hook-form` and `zsa` from `package.json`.
**FRs covered:** —
**Depends on:** 2-7-web-orpc-client-setup, 2-2-registration-email-password, 2-3-login-email-password
**AC:**
- Given the login page, when submitted, then it uses TanStack Form and calls an oRPC mutation through a custom hook.
- Given ESLint runs, when a `.tsx` component imports from `core/orpc/client` or `_actions/`, then it reports an error.

#### 2-9-route-protection 🔄 (M)
**Ticket:** [KON-99](https://linear.app/koni/issue/KON-99)
**Summary:** Update `proxy.ts` (Next.js 16 edge proxy) and `<AuthGuard>` component to use the new cookie names and oRPC refresh endpoint. On 401/403 from oRPC, redirect to `/auth/login?session=expired`.
**FRs covered:** FR10
**Depends on:** 2-7-web-orpc-client-setup, 2-4-token-refresh-flow
**AC:**
- Given an unauthenticated user, when visiting `/dashboard`, then `proxy.ts` redirects to `/auth/login`.
- Given an expired access token, when a request fires, then the client attempts refresh; on failure, redirects to `/auth/login?session=expired`.

---

## Epic 3 — Users have a navigable app shell with profile management

**Goal:** Deliver the authenticated app shell (layout, nav, logout, dark mode, responsive breakpoints) and the profile view/edit flow.

**Why:** After auth, users need a navigable container before any feature page makes sense. Profile is the simplest authenticated CRUD and validates the full oRPC + TanStack Form + zapaction stack end-to-end.

### Stories

#### 3-1-profile-module-backend 🆕 (S)
**Ticket:** [KON-100](https://linear.app/koni/issue/KON-100)
**Summary:** NestJS `profile/` module: oRPC handler + service, `get` and `updateDisplayName` endpoints.
**FRs covered:** —
**Depends on:** 1-3-orpc-nest-adapter
**AC:**
- Given an authenticated user, when calling `profile.get`, then the response contains `{ id, email, displayName, createdAt }`.
- Given a display name update, when called, then the User row is updated and returned.

#### 3-2-profile-page-web 🆕 (M)
**Ticket:** [KON-101](https://linear.app/koni/issue/KON-101)
**Summary:** Profile page with view and edit mode. TanStack Form for display name. Custom hooks `useProfile` (query) and `useUpdateProfile` (mutation). Four-state rule applied.
**FRs covered:** FR11, FR12
**Depends on:** 2-7-web-orpc-client-setup, 3-1-profile-module-backend
**AC:**
- Given the profile page, when loading, then it shows a skeleton, then the form with current values.
- Given an edit submission, when successful, then a sonner toast confirms and the query is invalidated.

#### 3-3-app-shell-layout 🆕 (M)
**Ticket:** [KON-102](https://linear.app/koni/issue/KON-102)
**Summary:** `AppLayout` in route group `(app)/layout.tsx`. Sidebar nav (Dashboard / Files / Profile). Logout button accessible from any authenticated page (via user menu).
**FRs covered:** FR41, FR44
**Depends on:** 2-7-web-orpc-client-setup, 2-6-logout
**AC:**
- Given any page in `(app)/`, when rendered, then the nav shows the active route.
- Given the logout button, when clicked, then it calls `useLogout` which triggers the logout zapaction and redirects.

#### 3-4-dark-mode-toggle 🆕 (S)
**Ticket:** [KON-103](https://linear.app/koni/issue/KON-103)
**Summary:** Theme toggle (light / dark / system) in the user menu. Persisted via `next-themes` or equivalent, SSR-safe.
**FRs covered:** FR42
**Depends on:** 3-3-app-shell-layout
**AC:**
- Given the toggle, when clicked, then the theme changes and persists across reloads.
- Given SSR, when the page loads, then there is no flash of unstyled content.

#### 3-5-responsive-layouts 🆕 (S)
**Ticket:** [KON-104](https://linear.app/koni/issue/KON-104)
**Summary:** Tailwind breakpoints for mobile (<768px), tablet (768–1024px), desktop (>1024px). Sidebar collapses to drawer on mobile.
**FRs covered:** FR43
**Depends on:** 3-3-app-shell-layout
**AC:**
- Given mobile viewport, when rendered, then the sidebar is a drawer triggered by a hamburger.
- Given desktop viewport, when rendered, then the sidebar is fixed.

---

## Epic 4 — Users can upload files with automatic thumbnail generation

**Goal:** Deliver the full upload vertical: backend files module, pre-signed POST, web drag/drop UI, metadata persistence with magic-bytes check, refactored Lambda thumbnail generator, and thumbnail webhook.

**Why:** Upload is the core value. Thumbnails are coupled — the same story list delivers both because the user outcome is "upload a file and see a preview". The Lambda already exists but uses an incorrect S3 key structure and lacks the webhook callback.

### Stories

#### 4-1-files-module-backend 🆕 (S)
**Ticket:** [KON-105](https://linear.app/koni/issue/KON-105)
**Summary:** NestJS `files/` module skeleton: module, service (empty), oRPC handler (stubs for upload-intent, list, delete). Wired to `PrismaService` and `S3Service` (new, wraps AWS SDK v3).
**FRs covered:** —
**Depends on:** 1-3-orpc-nest-adapter
**AC:**
- Given the module, when the API starts, then the `files` oRPC routes are mounted under `/files`.
- Given `S3Service`, when injected, then it exposes `createPresignedPost`, `deleteObject`, `getHeadObject`.

#### 4-2-upload-intent-endpoint 🆕 (L)
**Ticket:** [KON-106](https://linear.app/koni/issue/KON-106)
**Summary:** oRPC `files.createUploadIntent` — generates a pre-signed POST policy with size (≤10 MB) and MIME (JPG/PNG/PDF/WEBP) conditions. Checks the user's storage quota before issuing. 15-minute expiry. Key structure: `users/{userId}/originals/{uuid}.{ext}`.
**FRs covered:** FR15, FR16, FR17, FR21
**Depends on:** 4-1-files-module-backend
**AC:**
- Given a valid intent request, when called, then the response contains the POST URL, fields, and a file id.
- Given a 11 MB file intent, when called, then the response is `ApiErrorCode: FILE_TOO_LARGE`.
- Given an unsupported MIME, when called, then the response is `ApiErrorCode: UNSUPPORTED_FILE_TYPE`.
- Given a user at 100% quota, when called, then the response is `ApiErrorCode: QUOTA_EXCEEDED`.

#### 4-3-upload-ui-dropzone 🆕 (M)
**Ticket:** [KON-107](https://linear.app/koni/issue/KON-107)
**Summary:** `app/(app)/files/_components/upload-dropzone.tsx` — drag/drop + file picker, progress bar. Custom hook `useUploadFile` orchestrates intent → S3 POST → confirm.
**FRs covered:** FR13, FR14, FR18, FR19
**Depends on:** 4-2-upload-intent-endpoint, 2-7-web-orpc-client-setup
**AC:**
- Given a file dropped on the zone, when uploaded, then a progress bar shows 0→100%.
- Given the upload completes, then a sonner toast confirms and the file list query is invalidated.

#### 4-4-persist-file-metadata 🆕 (M)
**Ticket:** [KON-108](https://linear.app/koni/issue/KON-108)
**Summary:** oRPC `files.confirmUpload` — runs a HEAD on S3, verifies magic bytes via `file-type`, persists `File` row with `status: PROCESSING`.
**FRs covered:** FR20
**Depends on:** 4-1-files-module-backend, 4-2-upload-intent-endpoint
**AC:**
- Given a confirmed upload, when called, then a `File` row is created with `{ originalName, generatedName, mimeType, size, storageKey, status: PROCESSING }`.
- Given a file whose magic bytes don't match the declared MIME, when confirmed, then the S3 object is deleted and the response is `ApiErrorCode: MIME_MISMATCH`.

#### 4-5-thumbnail-lambda-refactor 🔄 (M)
**Ticket:** [KON-109](https://linear.app/koni/issue/KON-109)
**Summary:** Refactor `lambdas/thumbnail-generator/handler.py`: parse `userId` from the S3 event key pattern `users/{userId}/originals/{uuid}.{ext}`, write thumbnail to `users/{userId}/thumbnails/{uuid}.webp`, POST to the API webhook with the shared secret header. SQS DLQ for failures. Add CDK binding in `1-7-aws-cdk-stacks` output.
**FRs covered:** FR22, FR23, FR24
**Depends on:** 1-7-aws-cdk-stacks, 4-1-files-module-backend
**AC:**
- Given an original uploaded to `users/u1/originals/abc.jpg`, when the Lambda fires, then a 200×200 WebP is written to `users/u1/thumbnails/abc.webp`.
- Given the Lambda finishes, when successful, then it POSTs to `/webhooks/thumbnail-ready` with `X-Shared-Secret`.
- Given Lambda fails, when the retry budget is exhausted, then the message lands in the DLQ.

#### 4-6-thumbnail-webhook 🆕 (M)
**Ticket:** [KON-110](https://linear.app/koni/issue/KON-110)
**Summary:** NestJS `webhooks/` module: `POST /webhooks/thumbnail-ready` guarded by shared-secret header. Updates `File.status: READY` and `File.thumbnailKey`. On failure path, sets `status: FAILED`.
**FRs covered:** FR25, FR26
**Depends on:** 4-4-persist-file-metadata, 4-5-thumbnail-lambda-refactor
**AC:**
- Given a valid webhook with the correct secret, when received, then the File row is updated.
- Given a webhook with a wrong or missing secret, when received, then the response is 401.
- Given the Lambda DLQ triggers a failure webhook, when received, then `File.status = FAILED`.

---

## Epic 5 — Users can browse and manage their file library

**Goal:** Paginated file list with thumbnails + deletion with ownership guard and cascade cleanup.

### Stories

#### 5-1-files-list-endpoint 🆕 (M)
**Ticket:** [KON-111](https://linear.app/koni/issue/KON-111)
**Summary:** oRPC `files.list` — offset pagination `{ page, pageSize: 20 }`. Returns file metadata + signed thumbnail URL.
**FRs covered:** FR27
**Depends on:** 4-1-files-module-backend, 4-4-persist-file-metadata
**AC:**
- Given an authenticated user with 25 files, when calling `list({page:1, pageSize:20})`, then the response contains 20 files and `total: 25`.
- Given `list({page:2})`, when called, then the response contains the remaining 5 files.

#### 5-2-files-grid-ui 🆕 (M)
**Ticket:** [KON-112](https://linear.app/koni/issue/KON-112)
**Summary:** `app/(app)/files/page.tsx` — grid of file cards with thumbnails (or PDF placeholder icon), pagination controls. Four-state rule applied.
**FRs covered:** FR28, FR29, FR30, FR31
**Depends on:** 5-1-files-list-endpoint, 3-3-app-shell-layout
**AC:**
- Given the files page, when loading, then it shows a skeleton grid, then the populated grid.
- Given a PDF file, when rendered, then a PDF placeholder icon is shown instead of a thumbnail.
- Given 25 files, when the page is rendered, then pagination shows 2 pages and clicking page 2 navigates.

#### 5-3-delete-file-endpoint 🆕 (M)
**Ticket:** [KON-113](https://linear.app/koni/issue/KON-113)
**Summary:** oRPC `files.delete` — ownership guard (user id vs `File.userId`). Deletes S3 original + thumbnail + DB row in a transaction.
**FRs covered:** FR32, FR34, FR35, FR36
**Depends on:** 4-1-files-module-backend, 4-4-persist-file-metadata
**AC:**
- Given a user deletes their own file, when called, then S3 original, S3 thumbnail, and DB row are all removed.
- Given a user tries to delete a file owned by another user, when called, then the response is `ApiErrorCode: FORBIDDEN`.

#### 5-4-delete-confirm-ui 🆕 (S)
**Ticket:** [KON-114](https://linear.app/koni/issue/KON-114)
**Summary:** shadcn Dialog confirmation before delete. Custom hook `useDeleteFile`.
**FRs covered:** FR33
**Depends on:** 5-3-delete-file-endpoint, 5-2-files-grid-ui
**AC:**
- Given a delete button click, when pressed, then a confirmation dialog appears.
- Given the user confirms, when submitted, then the delete mutation fires and the list query is invalidated.

---

## Epic 6 — Users can monitor their storage via dashboard

**Goal:** Dashboard landing view with storage stats, recent uploads, and the upload entry point.

### Stories

#### 6-1-dashboard-stats-endpoint 🆕 (M)
**Ticket:** [KON-115](https://linear.app/koni/issue/KON-115)
**Summary:** NestJS `dashboard/` module: oRPC `dashboard.getStats` returns `{ fileCount, bytesUsed, bytesTotal, lastUploadAt }`. Format bytes in human-readable units client-side.
**FRs covered:** FR40
**Depends on:** 4-1-files-module-backend, 4-4-persist-file-metadata
**AC:**
- Given a user with 3 files totaling 4.5 MB, when calling `getStats`, then the response contains `fileCount: 3, bytesUsed: 4718592`.
- Given the client, when rendering, then it formats `bytesUsed` as `4.5 MB`.

#### 6-2-dashboard-ui 🆕 (M)
**Ticket:** [KON-116](https://linear.app/koni/issue/KON-116)
**Summary:** `app/(app)/dashboard/page.tsx` — stats cards, 5 most recent files (reuses `files.list` with pageSize 5), upload CTA. Four-state rule applied.
**FRs covered:** FR37, FR38, FR39
**Depends on:** 6-1-dashboard-stats-endpoint, 5-1-files-list-endpoint, 3-3-app-shell-layout
**AC:**
- Given the dashboard loads, when authenticated, then it shows file count, storage used, last upload date, 5 recent files, and an upload button.
- Given the user has zero files, when loaded, then the empty state shows a welcome message and the upload CTA is prominent.

---

## FR Coverage Map (46/46 ✓)

| FR | Story | Epic |
|---|---|---|
| FR1 | 2-2-registration-email-password | 2 |
| FR2 | 2-5-google-oauth | 2 |
| FR3 | 2-2-registration-email-password | 2 |
| FR4 | 2-2-registration-email-password | 2 |
| FR5 | 2-3-login-email-password | 2 |
| FR6 | 2-5-google-oauth | 2 |
| FR7 | 2-3-login-email-password | 2 |
| FR8 | 2-4-token-refresh-flow | 2 |
| FR9 | 2-6-logout | 2 |
| FR10 | 2-9-route-protection | 2 |
| FR11 | 3-2-profile-page-web | 3 |
| FR12 | 3-2-profile-page-web | 3 |
| FR13 | 4-3-upload-ui-dropzone | 4 |
| FR14 | 4-3-upload-ui-dropzone | 4 |
| FR15 | 4-2-upload-intent-endpoint | 4 |
| FR16 | 4-2-upload-intent-endpoint | 4 |
| FR17 | 4-2-upload-intent-endpoint | 4 |
| FR18 | 4-3-upload-ui-dropzone | 4 |
| FR19 | 4-3-upload-ui-dropzone | 4 |
| FR20 | 4-4-persist-file-metadata | 4 |
| FR21 | 4-2-upload-intent-endpoint | 4 |
| FR22 | 4-5-thumbnail-lambda-refactor | 4 |
| FR23 | 4-5-thumbnail-lambda-refactor | 4 |
| FR24 | 4-5-thumbnail-lambda-refactor | 4 |
| FR25 | 4-6-thumbnail-webhook | 4 |
| FR26 | 4-6-thumbnail-webhook | 4 |
| FR27 | 5-1-files-list-endpoint | 5 |
| FR28 | 5-2-files-grid-ui | 5 |
| FR29 | 5-2-files-grid-ui | 5 |
| FR30 | 5-2-files-grid-ui | 5 |
| FR31 | 5-2-files-grid-ui | 5 |
| FR32 | 5-3-delete-file-endpoint | 5 |
| FR33 | 5-4-delete-confirm-ui | 5 |
| FR34 | 5-3-delete-file-endpoint | 5 |
| FR35 | 5-3-delete-file-endpoint | 5 |
| FR36 | 5-3-delete-file-endpoint | 5 |
| FR37 | 6-2-dashboard-ui | 6 |
| FR38 | 6-2-dashboard-ui | 6 |
| FR39 | 6-2-dashboard-ui | 6 |
| FR40 | 6-1-dashboard-stats-endpoint | 6 |
| FR41 | 3-3-app-shell-layout | 3 |
| FR42 | 3-4-dark-mode-toggle | 3 |
| FR43 | 3-5-responsive-layouts | 3 |
| FR44 | 3-3-app-shell-layout | 3 |
| FR45 | 1-6-health-endpoint | 1 |
| FR46 | 1-6-health-endpoint | 1 |

**Coverage:** 46 / 46 FRs mapped · 0 orphans · 0 phantoms

## Technical Decisions Embedded

- **Password hashing:** `@node-rs/argon2` (argon2id) — NOT bcrypt. Applied in stories 2-1b, 2-2, 2-3.
- **Transport:** oRPC contract-first. All REST/Swagger legacy removed in story 1-3.
- **Validation:** Zod-only via `@cloudvault/zod` + `@cloudvault/validators`. `class-validator` removed.
- **Frontend forms:** `@tanstack/react-form` + `zapaction`. `react-hook-form` + `zsa` removed.
- **Prisma:** Folder layout (Prisma 7). Refactored in story 1-4.
- **Storage:** S3 pre-signed POST with server-enforced policy conditions, 15-min expiry, user-prefixed keys.

## Next Step

Run `/aped-story` to create the first story file (`1-1-zod-validators-packages`), then `/aped-dev` to implement it.

**Do NOT auto-chain.** The user decides when to proceed.
