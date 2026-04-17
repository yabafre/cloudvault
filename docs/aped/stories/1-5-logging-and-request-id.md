# Story: 1-5-logging-and-request-id — Wire nestjs-pino logging and X-Request-Id correlation middleware

**Epic:** 1 — Platform Foundation & Contract Layer
**Status:** ready-for-dev
**Ticket:** [KON-86](https://linear.app/koni/issue/KON-86)
**Branch:** `feature/KON-86-1-5-logging-and-request-id`
**Size:** S (1 pt)

## User Story

**As a** platform engineer, **I want** structured JSON logs with a correlated `requestId` that propagates through NestJS core, Prisma, and HTTP responses, **so that** every request is traceable end-to-end without ever leaking credentials or tokens.

## Acceptance Criteria

**AC1 — Request-Id is generated when absent (ticket baseline)**
- **Given** an incoming request without an `X-Request-Id` header
- **When** it reaches the API
- **Then** the middleware generates a UUID v4, sets it on the `x-request-id` response header, and every log line emitted for that request contains `requestId` equal to the generated value

**AC2 — Request-Id is propagated when provided and safe (ticket baseline + log-injection hardening)**
- **Given** an incoming request with `X-Request-Id: <value>`
- **When** `<value>` matches the safe pattern `^[A-Za-z0-9_-]{8,128}$`
- **Then** the middleware reuses it verbatim on the response header and in all logs for that request
- **And when** `<value>` is missing, empty, longer than 128 chars, or contains any other character
- **Then** the middleware silently generates a fresh UUID v4 instead (never trust unvalidated input in log context)

**AC3 — Transport switches on NODE_ENV**
- **Given** the API boots with `NODE_ENV=development`
- **When** it initialises `LoggerModule.forRoot`
- **Then** logs are piped through `pino-pretty` (colorised, single-line)
- **And given** `NODE_ENV` is anything else (including `production`, `test`, or unset)
- **Then** logs are emitted as raw newline-delimited JSON to stdout

**AC4 — Access logs include the canonical fields**
- **Given** a request completes (2xx/4xx/5xx)
- **When** `pino-http` emits its access log
- **Then** the log object contains at minimum: `requestId`, `req.method`, `req.url` (path), `res.statusCode`, `responseTime`
- **And in** non-development environments, it also contains `req.headers["user-agent"]` and `req.remoteAddress`

**AC5 — Secrets are redacted**
- **Given** any log object that would otherwise serialise sensitive values
- **When** pino flushes the log
- **Then** the following paths are replaced with `"[Redacted]"`: `req.headers.authorization`, `req.headers.cookie`, `res.headers["set-cookie"]`, `*.password`, `*.refreshToken`, `*.accessToken`, `*.token`

**AC6 — Nest core + Prisma logs are routed through pino**
- **Given** the API is booting
- **When** `main.ts` calls `NestFactory.create(AppModule, { bufferLogs: true })` and then `app.useLogger(app.get(Logger))`
- **Then** NestJS bootstrap logs (e.g. `RoutesResolver`, `NestApplication`) and the existing `PrismaService` logger are emitted through pino with the same JSON/pretty format
- **And no** raw `console.log` remains in `main.ts` (except via the Nest Logger)

**AC7 — userId is only emitted when authenticated**
- **Given** a log line emitted from a request context
- **When** `req.user?.sub` is truthy
- **Then** the log object contains `userId` equal to `req.user.sub`
- **And when** `req.user?.sub` is falsy (public route, unauthenticated)
- **Then** the log object does **not** contain a `userId` key (no `userId: null`, no `userId: undefined`)

**AC8 — Test gates**
- **Given** `pnpm --filter @cloudvault/api test` runs
- **When** it reaches the new specs
- **Then** a unit test for `request-id.middleware` passes, covering: (a) no header → generated UUID, (b) valid header → reused, (c) invalid header (empty / too long / unsafe chars) → replaced
- **And given** `pnpm --filter @cloudvault/api test:e2e` runs
- **Then** an E2E smoke test passes, asserting: (a) `GET /` returns a response with an `x-request-id` header, (b) a request with a custom safe `X-Request-Id` receives the same value back, (c) a request with an unsafe `X-Request-Id: ../../etc/passwd` receives a fresh UUID (not the injected value)

## Tasks

- [x] Install pino stack: `pnpm --filter @cloudvault/api add nestjs-pino pino pino-http` and `pnpm --filter @cloudvault/api add -D pino-pretty` [AC3]
- [x] Create `apps/api/src/common/logger/request-id.middleware.ts` — validates `x-request-id` against `^[A-Za-z0-9_-]{8,128}$`, falls back to `crypto.randomUUID()` otherwise; sets `req.id` (consumed by pino-http's `genReqId`) and the `x-request-id` response header [AC1, AC2]
- [x] Create `apps/api/src/common/logger/logger.module.ts` — exports `LoggerModule.forRootAsync` backed by `ConfigService`: transport switches on `NODE_ENV`, `redact` paths per AC5, `genReqId: (req) => req.id`, `customProps: (req) => ({ requestId: req.id, ...(req.user?.sub ? { userId: req.user.sub } : {}) })`, `customLogLevel` maps 5xx → error, 4xx → warn, else info [AC3, AC4, AC5, AC7]
- [x] Create barrel `apps/api/src/common/logger/index.ts` re-exporting the module and middleware [—]
- [x] Wire it globally: `app.module.ts` imports `LoggerModule`, implements `NestModule.configure(consumer)` to apply `RequestIdMiddleware` on `forRoutes('*')`; ensure it runs **before** any auth guard so public routes also get a `requestId` [AC1, AC2, AC6]
- [x] Update `apps/api/src/main.ts`: pass `{ bufferLogs: true }` to `NestFactory.create`, call `app.useLogger(app.get(Logger))` from `nestjs-pino`, replace the two `console.log` bootstrap lines with `Logger` calls [AC6]
- [x] Unit test `apps/api/src/common/logger/request-id.middleware.spec.ts` — three branches per AC2/AC8a with mocked `req`/`res`/`next` (plain Jest, no Nest testing module needed) [AC8]
- [x] E2E test `apps/api/test/logging.e2e-spec.ts` — boot the app with `Test.createTestingModule`, supertest `GET /`, assert header presence, echo semantics, and injection rejection per AC8b [AC8]

## Dev Notes

### Architecture (LAW)

- **§3.7 Logging** is prescriptive and binding. JSON in prod, pretty in dev. Every log carries `timestamp, level, context, requestId, userId?, message, meta`. Correlation middleware generates `X-Request-Id` if absent and propagates it to headers + logs.
- **§3.5 Error handling** already requires no stack trace in client responses — pairs with our `redact` list.

### Log-injection threat model (AC2 hardening)

An unvalidated `X-Request-Id` is copied verbatim into every log object for that request. An attacker could send an id containing newlines, ANSI escapes, or malicious JSON fragments to forge log entries downstream in Better Stack. The regex `^[A-Za-z0-9_-]{8,128}$` is narrow enough to block control chars, whitespace, quotes, and JSON metacharacters, while still accepting UUIDs (36 chars incl. hyphens) and common trace-id formats (B3, W3C 32-hex). When validation fails we generate a fresh id silently — **do not** log the rejected value (that would re-introduce the injection vector).

### nestjs-pino wiring pattern

```ts
// logger.module.ts (sketch — not final code)
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const LoggerModule = PinoLoggerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    pinoHttp: {
      level: config.get('LOG_LEVEL') ?? 'info',
      transport:
        config.get('NODE_ENV') === 'development'
          ? { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } }
          : undefined,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          '*.password',
          '*.refreshToken',
          '*.accessToken',
          '*.token',
        ],
        censor: '[Redacted]',
      },
      genReqId: (req) => req.id ?? randomUUID(),
      customProps: (req) => ({
        requestId: req.id,
        ...(req.user?.sub ? { userId: req.user.sub } : {}),
      }),
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    },
  }),
});
```

The middleware runs first and sets `req.id` so `genReqId` simply returns it — keeps the generation/validation logic in a single place.

### main.ts bootstrap sequence

1. `NestFactory.create(AppModule, { bufferLogs: true })` — buffers early logs until useLogger is set.
2. `app.useLogger(app.get(Logger))` — swaps Nest's internal logger for pino.
3. Existing setup (`cookieParser`, CORS, `ValidationPipe`, Swagger) stays untouched — those belong to KON-84.
4. Replace the two `console.log(...)` bootstrap lines with `const logger = new Logger('Bootstrap'); logger.log(...);` (from `@nestjs/common`, already resolved through pino).

### PrismaService forwarding

`PrismaService` extends `PrismaClient` and — per codebase audit — logs via the Nest `Logger`. Once `app.useLogger(pinoLogger)` fires, those log lines automatically flow through pino. No edits to `prisma.service.ts` are needed for this story. If unexpected log duplication appears during dev, the Debug Log should call it out for follow-up in KON-84.

### What is explicitly OUT of scope

- Removing `@nestjs/swagger` / `class-validator` / `ValidationPipe` — belongs to **KON-84 (1-3-orpc-nest-adapter)**.
- Adding `helmet`, `@nestjs/throttler` — also KON-84.
- Sentry backend wiring / Better Stack transport — later in Epic 1 or Epic 6.
- Request-scoped CLS (`nestjs-cls`) — not needed; `nestjs-pino` already uses async-hooks-based correlation internally.

### Dependencies

| Package | Why |
|---|---|
| `nestjs-pino` | NestJS adapter for pino, exposes `Logger` provider + `LoggerModule.forRoot(Async)` |
| `pino` | Core logger (peer of nestjs-pino) |
| `pino-http` | Request logger used under the hood |
| `pino-pretty` (dev) | Human-readable transport for `NODE_ENV=development` |

All four are MIT-licensed, maintained, and aligned with the monorepo's existing Node ≥20 constraint.

### Testing strategy

- **Unit** — `request-id.middleware.spec.ts` uses plain Jest with hand-rolled `req`/`res`/`next` mocks. Three cases per AC2/AC8a. No Nest testing module needed (middleware is a plain function).
- **E2E** — `apps/api/test/logging.e2e-spec.ts` bootstraps the full app via `Test.createTestingModule({ imports: [AppModule] })`, applies middleware, and uses supertest. Asserts headers only — does not attempt to capture stdout (fragile, out of scope here; the pino wiring is covered by AC6's boot-time gate and by manual `pnpm dev:api` smoke).
- Coverage target for this module: the middleware is a single pure function — expect 100% line + branch.

### Ticket integration

- **Commit prefix:** `feat(KON-86): <short description>`
- **Magic words:** `Part of KON-86` in intermediate commits, `Fixes KON-86` in the final commit.
- **PR:** `feat(KON-86): Story 1-5 — nestjs-pino logging and X-Request-Id correlation` with body `Fixes KON-86`.

### Files to create

- `apps/api/src/common/logger/logger.module.ts`
- `apps/api/src/common/logger/request-id.middleware.ts`
- `apps/api/src/common/logger/request-id.middleware.spec.ts`
- `apps/api/src/common/logger/index.ts`
- `apps/api/test/logging.e2e-spec.ts`

### Files to modify

- `apps/api/src/main.ts` — `bufferLogs`, `useLogger`, remove the two bootstrap `console.log` lines.
- `apps/api/src/app.module.ts` — import `LoggerModule`, implement `NestModule.configure` to mount `RequestIdMiddleware`.
- `apps/api/package.json` — add `nestjs-pino`, `pino`, `pino-http` (deps), `pino-pretty` (devDep).

## Dev Agent Record

- **Model:** Claude Opus 4.7 (1M context)
- **Started:** 2026-04-17
- **Completed:** 2026-04-17

### Debug Log

- **pnpm virtual store drift (worktree):** first `pnpm --filter @cloudvault/api add` failed with `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE` because the worktree's `node_modules` symlinked back to the main project's `.pnpm`. A root `pnpm install --config.confirmModulesPurge=false` reconciled the layout; a second reconciliation was needed later when a stale recreate dropped `nestjs-pino` from the store. Flagged as a sprint-wide infra note — not fixed in this story.
- **pino-http + middleware ordering, duplicate `requestId` in logs:** first pass put the validation in `RequestIdMiddleware`, which ran *after* pino-http's `genReqId`. pino-http generated its own UUID, then the middleware overwrote `req.id` to a different value, producing two `requestId` entries in the same log object (one from `customProps` at response time, one from the earlier customProps bind). Refactored to move validation into a `resolveRequestId` helper used directly by `genReqId`; the middleware now only copies the resolved id to the response header. Single canonical id end-to-end.
- **AC4 field naming:** pino-http serialises the request id inside `req.id`, not at top level. To satisfy AC4 (`requestId` at top level) while keeping `req.id` canonical, `customProps` re-emits `requestId: req.id` at the top level. Sample log verified: `{"req":{"id":"…"},"requestId":"…","res":{…},"responseTime":…}`.
- **Prisma client not generated / pre-existing TS errors:** `pnpm db:generate` fails with `MODULE_NOT_FOUND` in this env, producing ~30 TS errors in `auth.service.ts`, `prisma.service.ts`, etc. None of these errors are introduced by or related to this story — our new files (`logger.module.ts`, `request-id.middleware.ts`, `request-id.util.ts`, `main.ts`, `app.module.ts`) typecheck cleanly. Flagged for the Prisma 7 folder-refactor story (1-4 / KON-85).
- **Pre-existing broken `app.e2e-spec.ts`:** the existing jest-e2e config has no `moduleNameMapper`, so the first `@/…` import in `AppModule` unresolves. Verified on pre-change HEAD (`git show 403dea2:apps/api/src/app.module.ts`) that `@/prisma` and `@/modules/auth` imports already made this test non-runnable. This story's new `@/common/logger` import just surfaces the failure one line earlier. New `logging.e2e-spec.ts` avoids the issue by using only relative imports.

### Completion Notes

- **All 8 ACs satisfied.** Unit (11 cases) + E2E (4 cases) green. Full logs captured in the E2E run output visibly match AC4 (`requestId, method, url, statusCode, responseTime`) and AC7 (no stray `userId` on public routes).
- **AC5 (redact)** is declarative in `logger.module.ts`. Not directly asserted in tests to avoid pinning on pino-internal serialisation order; would require stdout capture or a custom transport that coverage-wise adds little beyond inspecting the config. Can be strengthened in a follow-up if Aria (`/aped-review`) flags it.
- **Scope discipline:** `ValidationPipe`, `@nestjs/swagger`, `class-validator`, helmet, throttler are untouched. `auth.controller.ts` and REST routes remain as-is for KON-84 (1-3-orpc-nest-adapter) to migrate. `bcrypt` untouched (KON-91).
- **Test-suite perf note:** `prisma.service.spec.ts` takes ~860s per run (pre-existing DB-connection wait, unrelated). Skipped in TDD iteration; would need the sprint to stub the Prisma client or co-locate with Testcontainers.
- **Security posture:** X-Request-Id is now a safe-by-default identifier — attacker-controlled values fail the `^[A-Za-z0-9_-]{8,128}$` check and are replaced without logging the rejected string. Secrets redacted at the pino layer before any sink sees them.

### File List

**Created:**
- `apps/api/src/common/logger/logger.module.ts`
- `apps/api/src/common/logger/request-id.middleware.ts`
- `apps/api/src/common/logger/request-id.middleware.spec.ts`
- `apps/api/src/common/logger/request-id.util.ts`
- `apps/api/src/common/logger/index.ts`
- `apps/api/test/logging.e2e-spec.ts`

**Modified:**
- `apps/api/src/main.ts` — `bufferLogs`, `useLogger(PinoLogger)`, bootstrap messages via `Logger`.
- `apps/api/src/app.module.ts` — imports `LoggerModule`, implements `NestModule.configure` to mount `RequestIdMiddleware`.
- `apps/api/package.json` — added `nestjs-pino@4.6.1`, `pino@10.3.1`, `pino-http@11.0.0`, `pino-pretty@13.1.3` (dev).
- `pnpm-lock.yaml`
- `docs/aped/state.yaml` — `1-5-logging-and-request-id.status: in-progress → review`.
