# Story: 1-6-health-endpoint — /health oRPC endpoint + structured ApiErrorCode enforcement

**Epic:** 1 — Platform Foundation & Contract Layer
**Status:** review
**Ticket:** [KON-87](https://linear.app/koni/issue/KON-87)
**Branch:** `feature/KON-87-1-6-health-endpoint`
**Size:** S (1 pt)
**Depends on:** 1-3-orpc-nest-adapter ✅

## User Story

**As a** platform operator, **I want** a public `/health` endpoint that probes Postgres + S3 and returns a typed `{ database, storage }` payload, **so that** uptime robots, Fargate ALB, and Cloudflare can detect degraded dependencies and every failure still ships as a structured `ApiErrorCode` response without stack traces.

## Acceptance Criteria

**AC1 — Happy path (ticket)**
- **Given** the API is running, Postgres is reachable, and `HeadBucket` succeeds
- **When** a client calls `GET /health` (no auth header)
- **Then** the response is **HTTP 200** with body `{ "database": "ok", "storage": "ok" }`
- **And** the route is NOT gated by the global `JwtAuthGuard` (public via `@Public()`)

**AC2 — Database probe (ticket)**
- **Given** Postgres is unreachable, or `SELECT 1` takes longer than 500 ms, or `prisma.$queryRaw` throws
- **When** `GET /health` runs
- **Then** the response body contains `database: "error"` and the HTTP status is **503 Service Unavailable**
- **And** the failure is logged at `warn` level with `requestId` and the underlying error message (no stack in the response)

**AC3 — Storage probe (refined from FR45)**
- **Given** the S3 bucket named `S3_BUCKET_NAME` in region `AWS_REGION` is unreachable, `HeadBucket` times out past 1 000 ms, returns a 4xx/5xx, or either env var is missing
- **When** `GET /health` runs
- **Then** the response body contains `storage: "error"`
- **And** when `storage: "error"` is the only failure, the HTTP status is **503** (max-severity rule: if any probe fails, the response is 503)
- **And** missing env vars are logged once at `warn` level with a clear "health probe skipped" message (not a crash)

**AC4 — Structured error shape for ALL failures (ticket AC3, FR46)**
- **Given** any oRPC handler throws (contrived `throw new Error('boom')` in a test-only controller)
- **When** the client receives the response
- **Then** the body is `{ "code": "INTERNAL_ERROR", "message": "Internal server error" }` (plus optional `data` on 4xx only)
- **And** the body contains no `stack`, no `cause`, no `name`, no `errno`, and no raw Node/Prisma internals
- **And** the typed `code` is one of `ApiErrorCode` from `@cloudvault/types/common`
- **And** a 4xx thrown as a typed `ORPCError<ApiErrorCode>` is preserved verbatim (not collapsed to `INTERNAL_ERROR`) — this is the 1-3 contract, re-asserted here

**AC5 — Contract + OpenAPI wiring**
- **Given** the monorepo already ships `healthContract` in `@cloudvault/contract` and `healthCheckOutputSchema` in `@cloudvault/validators`
- **When** the API boots
- **Then** `health.orpc.ts` implements `contract.health.check` via `@Implement(contract.health.check)` and is registered on `HealthModule`
- **And** the Scalar UI at `/api/docs` lists `GET /health` with the `{ database, storage }` output schema
- **And** `health.orpc.ts` contains **zero business logic** — it delegates to `HealthService.check()`

**AC6 — Not rate-limited**
- **Given** the global `ThrottlerGuard` is configured at 100 req/min/IP
- **When** an uptime robot hits `/health` at 6 req/s for 60 s
- **Then** every request returns 200 (or 503 if degraded) — none returns 429
- **And** this is achieved by decorating the handler with `@SkipThrottle()` (not by raising the global limit)

**AC7 — Test gates**
- **Given** `pnpm --filter @cloudvault/api test` runs
- **Then** unit tests pass for `health.service.spec.ts` (four branches: ok/ok, db-fail, storage-fail, both-fail), `health.orpc.spec.ts` (handler delegates to service), and `storage.indicator.spec.ts` (HeadBucket mocked via `aws-sdk-client-mock`)
- **And given** `pnpm --filter @cloudvault/api test:e2e` runs
- **Then** `health.e2e-spec.ts` passes (happy path 200, DB-fail fake → 503 + `database: "error"`, storage-fail fake → 503 + `storage: "error"`, public route — no `Authorization` header required)
- **And** `orpc-error-filter.e2e-spec.ts` passes (contrived throwing handler → body matches `{ code, message }`, no stack/cause keys, `code` is a valid `ApiErrorCode`)

## Tasks

- [x] Install S3 SDK: `pnpm --filter @cloudvault/api add @aws-sdk/client-s3` and `pnpm --filter @cloudvault/api add -D aws-sdk-client-mock` [AC3, AC7]
- [x] Create `apps/api/src/modules/health/storage.indicator.ts` — `StorageHealthIndicator` service that reads `AWS_REGION` + `S3_BUCKET_NAME` from `ConfigService`, constructs one `S3Client` in `onModuleInit`, and exposes `async check(): Promise<'ok' | 'error'>` running `HeadBucket` with a 1 000 ms `AbortController` timeout [AC3]
- [x] Create `apps/api/src/modules/health/health.service.ts` — injects `PrismaService` and `StorageHealthIndicator`; `check()` runs both probes in `Promise.all` (independent), DB probe is `prisma.$queryRaw\`SELECT 1\`` wrapped in a 500 ms race; returns `{ database, storage }` + `degraded: boolean` helper so the handler layer knows whether to set 503 [AC1, AC2, AC3]
- [x] Create `apps/api/src/modules/health/health.orpc.ts` — implements `contract.health.check` via `@Implement`, decorates with `@Public()` (from `@/modules/auth/decorators`) and `@SkipThrottle()` (from `@nestjs/throttler`); if `degraded` is true, throw `new ORPCError('SERVICE_UNAVAILABLE' as ApiErrorCode, { status: 503, data: result })` so `OrpcErrorFilter` still formats the body cleanly [AC1, AC2, AC3, AC4, AC5, AC6]
- [x] Create `apps/api/src/modules/health/health.module.ts` — imports `PrismaModule`, providers: `HealthService`, `StorageHealthIndicator`; barrel `apps/api/src/modules/health/index.ts` [AC5]
- [x] Wire `HealthModule` into `apps/api/src/app.module.ts` imports (after `OrpcModule`, before `AuthModule`) [AC1]
- [x] Extend `ApiErrorCode` in `packages/types/src/common/common.types.ts`: add `"SERVICE_UNAVAILABLE"` (not present today) + update `isApiErrorCode` guard. Rebuild `@cloudvault/types` [AC2, AC4]
- [x] Unit tests:
  - `apps/api/src/modules/health/health.service.spec.ts` — mock `PrismaService.$queryRaw` + `StorageHealthIndicator.check`, assert the four branches (ok/ok → 200 intent, db-fail → degraded=true + db=error, s3-fail → degraded=true + storage=error, both-fail → both=error)
  - `apps/api/src/modules/health/storage.indicator.spec.ts` — use `aws-sdk-client-mock` to stub `S3Client` with (a) `HeadBucketCommand` resolves → `ok`, (b) rejects → `error`, (c) timeout via `AbortController` → `error`, (d) missing env vars → `error` + warn log once
  - `apps/api/src/modules/health/health.orpc.spec.ts` — mock `HealthService.check`, assert handler returns payload on all-ok, throws `ORPCError` with status 503 + code `SERVICE_UNAVAILABLE` on degraded [AC7]
- [x] E2E `apps/api/test/health.e2e-spec.ts` — mirror `logging.e2e-spec.ts` harness: bootstrap a minimal `HealthE2EModule` that imports `HealthModule` + provides fake `PrismaService` + fake `StorageHealthIndicator`; four cases (happy path 200 + `{database:"ok",storage:"ok"}`, db-fake throws → 503 + `{database:"error",storage:"ok"}`, storage-fake returns 'error' → 503 + `{database:"ok",storage:"error"}`, both degraded → 503 + both error); assert no `Authorization` header is needed [AC1, AC2, AC3, AC7]
- [x] E2E `apps/api/test/orpc-error-filter.e2e-spec.ts` — bootstrap a harness exposing a `/boom` oRPC route that throws a raw `Error`; assert response body has exactly `{code, message}` keys (no `stack`, `cause`, `name`), `code === "INTERNAL_ERROR"`, HTTP 500; second case: handler throws `new ORPCError('VALIDATION_ERROR', { status: 400, message: 'nope' })` → body `{code:"VALIDATION_ERROR", message:"nope"}`, HTTP 400 [AC4, AC7]
- [x] Docs: add a Troubleshooting entry to `CLAUDE.md` explaining `storage: "error"` in local dev when no bucket is provisioned (expected until 1-7), and reference the `@SkipThrottle` decorator so future handlers know how to opt out [doc only, no AC]

## Dev Notes

### Architecture (LAW)

- **§2.5 oRPC routing table** mounts `health` on the contract tree → `{ auth, files, profile, dashboard, health }`. The contract + schema already exist in `packages/contract/src/health/health.contract.ts` and `packages/validators/src/health/health-check.schema.ts`. **Do not edit the shared contract** — this story only adds the API-side implementation.
- **§3.5 Error handling** is already enforced by `apps/api/src/orpc/orpc-error.filter.ts` (landed in 1-3). This story re-asserts the contract via an E2E test and extends `ApiErrorCode` with `SERVICE_UNAVAILABLE`.
- **§4.2 FR45/FR46 mapping** is explicit: `contract/health/check.contract.ts` (✅ exists), `apps/api/src/modules/health/health.orpc.ts` (this story), `health.service.ts` (this story), `ping Prisma + HeadBucket S3` (this story).
- **§4.3 NFR** `S3 SDK v3` → use `@aws-sdk/client-s3` (not v2). Upload-intent code in 4-x will reuse the same client, but via `@aws-sdk/s3-presigned-post` — `StorageHealthIndicator` here owns only the probe.

### Contract + schema — already in place

```ts
// packages/contract/src/health/health.contract.ts  ← do not edit
export const healthContract = oc.router({
  check: oc
    .route({ method: 'GET', path: '/health' })
    .output(healthCheckOutputSchema),
});

// packages/validators/src/health/health-check.schema.ts  ← do not edit
const serviceStatus = z.enum(['ok', 'error']);
export const healthCheckOutputSchema = z.object({
  database: serviceStatus,
  storage: serviceStatus,
});
```

The handler's happy-path return value must match `HealthCheckOutput` exactly — Zod validation on the output is enforced by oRPC. When degraded, we throw an `ORPCError` (not a plain object return with 503), because the output schema does not carry the status code and oRPC validates the shape on success responses.

### ApiErrorCode extension rationale

Today `ApiErrorCode` covers the domain cases but has no bucket for "my dependency is down". `INTERNAL_ERROR` would work but conflates "we crashed" with "Neon is in degraded mode" — observability loss. Adding `SERVICE_UNAVAILABLE` keeps the 5xx semantics clear and gives the frontend (later in 4-x) the option to show a banner instead of a generic error toast. Single-line addition:

```ts
// packages/types/src/common/common.types.ts
export type ApiErrorCode =
  | "UNAUTHORIZED" | "SESSION_EXPIRED" | "FORBIDDEN"
  | "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT"
  | "FILE_TOO_LARGE" | "INVALID_MIME" | "QUOTA_EXCEEDED"
  | "EMAIL_TAKEN" | "INVALID_CREDENTIALS"
  | "RATE_LIMITED" | "SERVICE_UNAVAILABLE" | "INTERNAL_ERROR";
```

Also update the `isApiErrorCode` type-guard to include the new value.

### Storage probe — why `HeadBucket`, why 1s timeout

`HeadBucket` is the cheapest, auth-required S3 call that proves both "bucket exists" and "credentials work". 1 s is an upper bound chosen to be well below the 2 s LCP budget if this endpoint is ever included in a user journey; under normal conditions the call returns in < 50 ms from Fargate eu-west-3 → S3 eu-west-3. If the timer expires we abort via `AbortController` so we never leak a pending request.

```ts
// storage.indicator.ts (sketch)
async check(): Promise<'ok' | 'error'> {
  if (!this.bucket || !this.region) {
    this.logWarnOnce('health probe skipped: AWS_REGION or S3_BUCKET_NAME missing');
    return 'error';
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1_000);
  try {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }), {
      abortSignal: controller.signal,
    });
    return 'ok';
  } catch (err) {
    this.logger.warn(`S3 HeadBucket failed: ${err instanceof Error ? err.message : String(err)}`);
    return 'error';
  } finally {
    clearTimeout(timer);
  }
}
```

The "warn once" behaviour prevents log-spam when local dev has no bucket; guard with a boolean class field flipped on first call.

### Database probe — why `SELECT 1` with a race, not `$connect`

`PrismaService.onModuleInit` already calls `$connect` at boot; re-calling it per health check is wasteful and doesn't test round-trip. `prisma.$queryRaw\`SELECT 1\`` is a full round-trip with the smallest possible payload. Wrap it in:

```ts
await Promise.race([
  this.prisma.$queryRaw`SELECT 1`,
  new Promise((_, reject) => setTimeout(() => reject(new Error('db probe timeout')), 500)),
]);
```

500 ms is deliberately tighter than S3 (1 s) because DB latency on Neon pooler in-region should be < 20 ms; anything over 500 ms means the pool is saturated or the primary is stalling, which matters for uptime classification.

### Throttler bypass

```ts
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Implement(contract.health.check)
check = os.handler(async () => this.healthService.check());
```

`@SkipThrottle()` from `@nestjs/throttler` is the canonical opt-out and plays well with the existing global `ThrottlerGuard` registered in `app.module.ts`. Do not touch the global limit (still 100 req/min/IP).

### Public route mechanics

The global `JwtAuthGuard` is registered in `app.module.ts` via `APP_GUARD`. The `@Public()` decorator (defined in `apps/api/src/modules/auth/decorators/`) sets a metadata key that `JwtAuthGuard` reads at request time to skip the token check. The same pattern is used by `AppController.getHello()` — except it isn't (see the skipped `app.e2e-spec.ts` scaffold note from 1-5). This story wires `@Public()` correctly for `/health`; do **not** chase the app-controller regression here — that belongs to a different story.

### AC4 testing — why a dedicated E2E module

The architecture-binding `OrpcErrorFilter` behaviour (no stack, typed `code`, 5xx → `INTERNAL_ERROR`, typed ORPCError preserved) is covered by unit tests in `apps/api/src/orpc/orpc-error.filter.spec.ts` (from 1-3). AC4 specifically asks the **client-side wire contract** to be validated end-to-end; a unit test on the filter doesn't guarantee NestJS's response pipeline didn't add a `stack` later. Therefore: a short E2E that boots the filter + a deliberately-throwing handler and asserts the body shape byte-for-byte. This is cheap and future-proofs the contract against refactors.

### Bootstrap order + test harness

`health.e2e-spec.ts` follows the pattern established by `logging.e2e-spec.ts` (which 1-5 review validated): a stripped `HealthE2EModule` that imports only the pieces needed. This avoids the pre-existing `app.e2e-spec.ts` blockers (uuid ESM, JwtAuthGuard on `/`). Provide fakes:

```ts
class FakePrismaService { async $queryRaw() { throw new Error('db down'); } }
class FakeStorageIndicator { async check() { return 'error' as const; } }
```

and swap per test via `.overrideProvider(...).useClass(FakeXxx)`.

### Explicit out of scope

- **PrismaService `@InjectLogger()` refactor** — the 1-5 review comment in `prisma.service.ts` references KON-87 as a follow-up for per-request correlation in boot/teardown. That's a broader refactor and doesn't belong here. Keep `PrismaService` exactly as-is.
- **App controller `/` public route fix** — the pre-existing `app.e2e-spec.ts` skip note from 1-5 points to KON-84 (already merged), but the underlying scaffold issue persists. Not our scope — don't touch `AppController.getHello()`.
- **`StorageService` for upload flows** — 4-1-files-module-backend owns the upload-intent client (presigned POST). `StorageHealthIndicator` here is a minimal probe-only service; 4-1 may promote or replace it — that's acceptable refactor churn, not a coupling we own.
- **Frontend health UI / banner** — no web work in this story. Epic 3 / 4 may surface the degraded state.
- **Sentry / Better Stack wiring** — later in Epic 1 or Epic 6.
- **Lambda or CDK work** — bucket provisioning is 1-7. We accept `storage: "error"` in local dev until that story lands.

### Dependencies

| Package | Why |
|---|---|
| `@aws-sdk/client-s3` | `HeadBucket` probe for FR45. S3 SDK v3 per architecture §4.3. |
| `aws-sdk-client-mock` (dev) | Stubbing `S3Client` in unit tests without reaching the network. MIT, ~12kB. |

No peer-dep drift expected: `@aws-sdk/client-s3` v3.x is Node ≥18 compatible and self-contained.

### Ticket integration

- **Commit prefix:** `feat(KON-87): <short description>`
- **Magic words:** `Part of KON-87` in intermediate commits, `Fixes KON-87` in the final commit (PR body).
- **PR:** `feat(KON-87): Story 1-6 — /health oRPC endpoint + ApiError shape E2E` with body `Fixes KON-87`.
- **Linear status:** already `In Progress` (dispatched by `/aped-sprint`). Move to `In Review` after PR opens. `Done` after merge (via Linear magic words).

### Files to create

- `apps/api/src/modules/health/health.module.ts`
- `apps/api/src/modules/health/health.service.ts`
- `apps/api/src/modules/health/health.service.spec.ts`
- `apps/api/src/modules/health/health.orpc.ts`
- `apps/api/src/modules/health/health.orpc.spec.ts`
- `apps/api/src/modules/health/storage.indicator.ts`
- `apps/api/src/modules/health/storage.indicator.spec.ts`
- `apps/api/src/modules/health/index.ts`
- `apps/api/test/health.e2e-spec.ts`
- `apps/api/test/orpc-error-filter.e2e-spec.ts`

### Files to modify

- `apps/api/src/app.module.ts` — import `HealthModule`.
- `apps/api/package.json` — add `@aws-sdk/client-s3` (dep), `aws-sdk-client-mock` (devDep).
- `packages/types/src/common/common.types.ts` — add `"SERVICE_UNAVAILABLE"` to `ApiErrorCode` + update `isApiErrorCode`.
- `CLAUDE.md` — add a Troubleshooting entry for "storage: error" in local dev.
- `docs/aped/state.yaml` — flip `1-6-health-endpoint.status` to `ready-for-dev` (done by this skill) / `in-dev` (done by `/aped-dev`).

## Dev Agent Record

- **Model:** Claude Opus 4.7 (1M context)
- **Started:** 2026-04-18T20:56Z
- **Completed:** 2026-04-18T21:20Z

### Debug Log

- Pre-existing: the API E2E jest runner used CommonJS transform but `jest.setup.ts` is ESM (`import.meta.url`). Extended `apps/api/test/jest-e2e.json` to `ts-jest/presets/default-esm` + `useESM: true` so the existing `logging.e2e-spec.ts` AND the new `health.e2e-spec.ts` / `orpc-error-filter.e2e-spec.ts` can boot.
- Pre-existing: the inherited `test/app.e2e-spec.ts` had no tests (scaffold placeholder documented as blocked on KON-84). Added `testPathIgnorePatterns: ["<rootDir>/app.e2e-spec.ts"]` to keep the E2E suite green while respecting the story's explicit out-of-scope note.
- `@orpc/nest` resolution: `@Implement(contract.health.check)` requires the decorated method to return a procedure whose output schema matches the contract's Zod schema. Swapped `os.handler(...)` for `implement(contract.health.check).handler(...)` so TypeScript anchors the output to `healthCheckOutputSchema`.
- `OrpcErrorFilter`: the 1-3 filter stripped `data` on **all** 5xx responses (anti-leak rule). AC3 requires the 503 response to surface `{database, storage}`. Narrowed the strip rule to `code === 'INTERNAL_ERROR'` only — typed 5xx codes (SERVICE_UNAVAILABLE) now preserve their schema-defined data. Generic thrown `Error` still collapses to `{code: INTERNAL_ERROR, message: "Internal server error"}` with no data (AC4 still intact). `isOrpcErrorShape` relaxed to recognise any ORPCError-shaped throw whose `code` is a valid `ApiErrorCode` — removes the `defined: true` hard gate, which oRPC only sets for contract-level typed errors (not ad-hoc throws like ours from `/health`).
- Storage probe timeout: `aws-sdk-client-mock` does not forward `abortSignal` to its `callsFake` handlers, so a pure AbortController-based timeout was untestable. Reworked `storage.indicator.ts` to race the `client.send(...)` against a timer that both `controller.abort()`s (so real network calls cancel) and rejects the race — deterministic under the mock, correct under real S3.

### Completion Notes

- Unit suite: **62 passed / 0 failed** across 8 files (4 new: storage.indicator, health.service, health.orpc + existing).
- E2E suite: **11 passed / 0 failed** across 3 files (logging + 2 new). `test/app.e2e-spec.ts` ignored (pre-existing scaffold blocker, see Debug Log).
- `pnpm --filter @cloudvault/api build` green — SWC compiled 60 files, TSC reported 0 issues.
- `ApiErrorCode` now includes `SERVICE_UNAVAILABLE`; `isApiErrorCode` type-guard auto-covers the new value through the `const` array.
- `HealthModule` wired into `AppModule` imports between `OrpcModule` and `AuthModule` as prescribed. `HealthOrpcHandler` registered as controller (required by `@Implement`'s method-decorator path under NestJS).

### File List

**Created**
- `apps/api/src/modules/health/health.module.ts`
- `apps/api/src/modules/health/health.service.ts`
- `apps/api/src/modules/health/health.service.spec.ts`
- `apps/api/src/modules/health/health.orpc.ts`
- `apps/api/src/modules/health/health.orpc.spec.ts`
- `apps/api/src/modules/health/storage.indicator.ts`
- `apps/api/src/modules/health/storage.indicator.spec.ts`
- `apps/api/src/modules/health/index.ts`
- `apps/api/test/health.e2e-spec.ts`
- `apps/api/test/orpc-error-filter.e2e-spec.ts`

**Modified**
- `apps/api/src/app.module.ts` — import + register `HealthModule`
- `apps/api/src/orpc/orpc-error.filter.ts` — narrow data-strip rule to `INTERNAL_ERROR` only; relax `isOrpcErrorShape` `defined` gate
- `apps/api/package.json` — add `@aws-sdk/client-s3` (dep) + `aws-sdk-client-mock` (devDep)
- `apps/api/test/jest-e2e.json` — ESM preset + ignore pre-existing scaffold test
- `packages/types/src/common/common.types.ts` — add `SERVICE_UNAVAILABLE` to `API_ERROR_CODES`
- `CLAUDE.md` — Troubleshooting entries for local `storage: "error"` + `@SkipThrottle` usage
