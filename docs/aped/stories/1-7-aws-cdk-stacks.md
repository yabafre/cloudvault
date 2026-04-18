# Story: 1-7-aws-cdk-stacks — Scaffold AWS CDK stacks (storage, lambda, api, params)

**Epic:** 1 — Platform Foundation & Contract Layer
**Status:** ready-for-dev
**Ticket:** [KON-88](https://linear.app/koni/issue/KON-88)
**Branch:** `feature/KON-88-1-7-aws-cdk-stacks`
**Size:** L (3 pts)

## User Story

**As a** platform engineer, **I want** a TypeScript CDK scaffold with four stacks (`storage`, `lambda`, `api`, `params`) that synthesize without errors in `eu-west-3`, **so that** subsequent stories (4-5 thumbnail Lambda, 4-6 webhook, 1-8 CI/CD) can plug their infra in without re-defining the foundation.

## Acceptance Criteria

**AC1 — `cdk synth` is green for every stack, every env (ticket baseline)**
- **Given** the CDK app at `infra/cdk/`
- **When** `pnpm --filter @cloudvault/infra cdk synth -c env=dev` and `… -c env=prod` run
- **Then** CloudFormation is emitted for the 4 stacks with zero errors and no blocking warnings

**AC2 — Storage stack enforces GDPR + abandoned-upload lifecycle (ticket baseline)**
- **Given** the synthesized storage stack
- **Then** the bucket has:
  - `encryption: BucketEncryption.S3_MANAGED` (SSE-S3, AES-256)
  - CORS with `allowedOrigins: [WEB_ORIGIN]`, `allowedMethods: [PUT, POST, GET, HEAD]`, `allowedHeaders: ["*"]`, `maxAge: 3000`
  - lifecycle rule `abortIncompleteMultipartUploadAfter: Duration.days(1)`
  - `blockPublicAccess: BLOCK_ALL`, `publicReadAccess: false`
  - `versioned: false` (MVP)

**AC3 — Region pin + stack naming convention**
- **Given** any stack synthesized
- **Then** `env.region === 'eu-west-3'` and the stack name follows `cloudvault-{env}-{domain}` (e.g. `cloudvault-prod-storage`, `cloudvault-dev-api`, `cloudvault-prod-lambda`, `cloudvault-prod-params`)

**AC4 — Fargate always-warm + auto-scaling**
- **Given** the api stack synthesized
- **Then** the Fargate service has:
  - `desiredCount: 1`
  - `minCapacity: 1, maxCapacity: 3`
  - target-tracking scaling on CPU at 70%
  - ALB public HTTPS listener on port 443 using ACM cert ARN from CDK context `-c acmCertArn=...` (no cert creation in this story)
  - port 80 listener redirects to 443

**AC5 — Lambda triggers & schedule**
- **Given** the lambda stack synthesized
- **Then**:
  - `thumbnail-generator` has an S3 event source bound to the storage bucket, filter `prefix: "users/"` + trigger `s3:ObjectCreated:*`, with an SQS DLQ and `maxReceiveCount: 3`
  - `orphan-reconciler` has an EventBridge rule `schedule: Schedule.rate(Duration.days(7))`
  - both Lambdas run Python 3.12, least-privilege IAM roles scoped to the storage bucket

**AC6 — SSM naming convention, no plaintext secrets**
- **Given** the params stack synthesized
- **Then** it creates `SecureString` parameters at `/cloudvault/{env}/{KEY}` for `JWT_SECRET`, `DATABASE_URL`, `GOOGLE_CLIENT_SECRET`, `THUMBNAIL_WEBHOOK_SECRET`
- **And** no real secret value is committed — each parameter defaults to a placeholder (`"replace-in-console"`) that must be overwritten in AWS Console post-deploy (documented in stack comment)

**AC7 — Test gate**
- **Given** `pnpm --filter @cloudvault/infra test` runs
- **When** Jest executes the stack specs
- **Then** one snapshot-style test per stack passes via `aws-cdk-lib/assertions` (`Template.fromStack`), asserting at minimum:
  - storage stack: `hasResourceProperties("AWS::S3::Bucket", { BucketEncryption: … })` + CORS + lifecycle per AC2
  - api stack: `hasResourceProperties("AWS::ECS::Service", { DesiredCount: 1 })` + auto-scaling policy per AC4
  - lambda stack: DLQ + EventBridge rule per AC5
  - params stack: 4 `AWS::SSM::Parameter` with `Type: SecureString` and name pattern per AC6

## Tasks

- [ ] Extend `pnpm-workspace.yaml` with `- 'infra/*'` so `@cloudvault/infra` is a first-class workspace package [AC1]
- [ ] Create `infra/cdk/package.json` as `@cloudvault/infra` (private, type `module` not required) with deps `aws-cdk-lib@^2`, `constructs@^10`, and devDeps `aws-cdk@^2`, `ts-node`, `jest`, `ts-jest`, `@types/jest`, `@types/node` [AC1]
- [ ] Create `infra/cdk/tsconfig.json` extending `@cloudvault/typescript-config/base.json` (or the closest existing preset) with `outDir: "dist"`, `target: ES2022` [AC1]
- [ ] Create `infra/cdk/cdk.json` with `"app": "npx ts-node --prefer-ts-exts bin/cloudvault.ts"` and CDK feature flags recommended by `aws-cdk-lib` v2 [AC1]
- [ ] Create `infra/cdk/.gitignore` (`cdk.out/`, `*.js`, `*.d.ts`, `node_modules/`) [AC1]
- [ ] Create `infra/cdk/bin/cloudvault.ts` — reads `env` from CDK context (default `dev`), instantiates the 4 stacks with `env: { region: 'eu-west-3' }` and stack names `cloudvault-{env}-{domain}`; passes `storageBucket` from storage stack to lambda stack via cross-stack ref [AC1, AC3]
- [ ] Create `infra/cdk/lib/storage-stack.ts` — `s3.Bucket` with SSE-S3, CORS (origin from context `webOrigin`), lifecycle rule (abort multipart after 1d), block public access, `RemovalPolicy.RETAIN` in prod / `DESTROY` with `autoDeleteObjects` in dev; exposes `bucket: IBucket` on the stack [AC2, AC3]
- [ ] Create `infra/cdk/lib/lambda-stack.ts` — two `lambda.Function` (Python 3.12): thumbnail-generator (S3 event source on `storageBucket`, SQS DLQ, `maxReceiveCount: 3`) and orphan-reconciler (EventBridge `Schedule.rate(Duration.days(7))`); IAM grants scoped to the bucket prefixes [AC3, AC5]
- [ ] Create `infra/cdk/lib/api-stack.ts` — `ec2.Vpc` (2 AZ), `ecs.Cluster`, `ApplicationLoadBalancedFargateService` with HTTPS (ACM cert ARN from context), `desiredCount: 1`, CPU target-tracking 70% with `minCapacity: 1, maxCapacity: 3`, HTTP→HTTPS redirect, placeholder container image (`ContainerImage.fromRegistry("public.ecr.aws/nginx/nginx:latest")` — will be swapped in 1-8) [AC3, AC4]
- [ ] Create `infra/cdk/lib/params-stack.ts` — 4 `ssm.StringParameter` with `type: ParameterType.SECURE_STRING` (or `new CfnParameter` if L2 unsupported), naming `/cloudvault/{env}/{KEY}`, default value `"replace-in-console"`, comment warning operators to overwrite via Console post-deploy [AC3, AC6]
- [ ] Create `lambdas/orphan-reconciler/handler.py` — minimal `def lambda_handler(event, context): return {"ok": True}` stub + empty `requirements.txt` so `lambda-stack` synth resolves the asset [AC1, AC5]
- [ ] Create `infra/cdk/test/storage-stack.test.ts` — `Template.fromStack` assertions per AC2 [AC7]
- [ ] Create `infra/cdk/test/api-stack.test.ts` — assertions per AC4 [AC7]
- [ ] Create `infra/cdk/test/lambda-stack.test.ts` — assertions per AC5 [AC7]
- [ ] Create `infra/cdk/test/params-stack.test.ts` — assertions per AC6 [AC7]
- [ ] Create `infra/cdk/jest.config.ts` (ts-jest preset, `testEnvironment: "node"`) [AC7]
- [ ] Add root `package.json` scripts: `"cdk:synth": "dotenv -- pnpm --filter @cloudvault/infra exec cdk synth"`, `"cdk:diff": "dotenv -- pnpm --filter @cloudvault/infra exec cdk diff"` [AC1]
- [ ] Update `.env.example` with `WEB_ORIGIN=http://localhost:3000`, `ACM_CERT_ARN_PROD=` (empty placeholder, documented as required for prod synth) [AC2, AC4]
- [ ] Run `pnpm install`, then `pnpm --filter @cloudvault/infra cdk synth -c env=dev` and verify green locally [AC1]

## Dev Notes

### Architecture (LAW)

- **§2.8 Infrastructure** fixes the stack layout to `infra/cdk/lib/{storage,lambda,api,params}-stack.ts` — deviations require a new `/aped-arch` session
- **§2.3 table** pins `eu-west-3` for all data/compute (GDPR residency) and **SSE-S3** (no KMS for MVP)
- **§5.2 G4** requires `min_capacity: 1` on Fargate to avoid cold starts (keep p95 < 200ms)
- **§5.3 risk** — no staging environment: `cdk diff` is mandatory in CI (story 1-8 will wire it); this story does not deploy, only synth

### Scope boundaries (DO NOT DO)

- No real deployment (`cdk deploy`) — OIDC auth + GitHub Actions land in story **1-8-github-actions-ci-cd**
- No actual Fargate container image — use `public.ecr.aws/nginx/nginx:latest` as placeholder; real ECR repo + task def env come in 1-8
- No ACM certificate creation — expect `acmCertArn` from CDK context; if absent in `dev`, the ALB HTTPS listener should skip (HTTP-only for dev synth)
- No real SSM secret values — placeholders only, operators overwrite via AWS Console
- No thumbnail Lambda Python logic changes — handler is scaffolded, real logic is story **4-5-thumbnail-lambda-refactor**
- No orphan reconciler logic — stub handler returning `{"ok": True}` is sufficient for synth; real reconciliation is a separate story

### Files

**Create:**
- `pnpm-workspace.yaml` (extend)
- `infra/cdk/package.json`
- `infra/cdk/tsconfig.json`
- `infra/cdk/cdk.json`
- `infra/cdk/.gitignore`
- `infra/cdk/jest.config.ts`
- `infra/cdk/bin/cloudvault.ts`
- `infra/cdk/lib/storage-stack.ts`
- `infra/cdk/lib/lambda-stack.ts`
- `infra/cdk/lib/api-stack.ts`
- `infra/cdk/lib/params-stack.ts`
- `infra/cdk/test/storage-stack.test.ts`
- `infra/cdk/test/api-stack.test.ts`
- `infra/cdk/test/lambda-stack.test.ts`
- `infra/cdk/test/params-stack.test.ts`
- `lambdas/orphan-reconciler/handler.py`
- `lambdas/orphan-reconciler/requirements.txt`

**Modify:**
- `pnpm-workspace.yaml` — add `- 'infra/*'`
- `package.json` (root) — add `cdk:synth`, `cdk:diff` scripts
- `.env.example` — add `WEB_ORIGIN`, `ACM_CERT_ARN_PROD`

### Testing

- **Framework:** Jest 29 with `ts-jest` inside `@cloudvault/infra` (mirrors backend stack)
- **Strategy:** snapshot-style assertions via `aws-cdk-lib/assertions.Template` — prefer targeted `hasResourceProperties` over full `toMatchSnapshot()` to keep diffs meaningful
- **Coverage gate:** 4 test files, one per stack, each asserting the AC-relevant properties (AC2 for storage, AC4 for api, AC5 for lambda, AC6 for params)
- **Not required this story:** E2E deploy tests, LocalStack integration — out of scope

### Dependencies

- `aws-cdk-lib@^2` (peer: `constructs@^10`)
- `aws-cdk@^2` (CLI)
- `ts-node`, `@types/node`, `jest`, `ts-jest`, `@types/jest`
- Node ≥ 20 already enforced by root `engines`

### Commit convention

Per `.aped/aped-dev/references/ticket-git-workflow.md` (Linear + GitHub):
- Commit prefix: `feat(KON-88): …` for new files, `chore(KON-88): …` for workspace/tooling edits
- Every commit body ends with `Part of KON-88`
- Final commit on PR body: `Fixes KON-88`

## Dev Agent Record

- **Model:** {{model used}}
- **Started:** {{timestamp}}
- **Completed:** {{timestamp}}

### Debug Log

### Completion Notes

### File List
