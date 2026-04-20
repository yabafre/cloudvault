import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { type INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { ORPCModule } from '@orpc/nest';
import {
  experimental_RethrowHandlerPlugin as RethrowHandlerPlugin,
} from '@orpc/server/plugins';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';

import { OrpcErrorFilter } from '../src/orpc/orpc-error.filter';
import { rethrowAdHocErrors } from '../src/orpc/rethrow-ad-hoc-filter';
import { HealthOrpcHandler } from '../src/modules/health/health.orpc';
import { HealthService } from '../src/modules/health/health.service';
import { StorageHealthIndicator } from '../src/modules/health/storage.indicator';
import { PrismaService } from '../src/prisma/prisma.service';

type ProbeResult = 'ok' | 'error';

class FakeStorageHealthIndicator {
  private nextResult: ProbeResult = 'ok';
  setNext(result: ProbeResult): void {
    this.nextResult = result;
  }
  onModuleInit(): void {}
  async check(): Promise<ProbeResult> {
    return this.nextResult;
  }
}

class FakePrismaService {
  private mode: 'ok' | 'fail' = 'ok';
  setMode(mode: 'ok' | 'fail'): void {
    this.mode = mode;
  }
  async $queryRaw(): Promise<unknown> {
    if (this.mode === 'fail') {
      throw new Error('fake db down');
    }
    return [{ '?column?': 1 }];
  }
  async onModuleInit(): Promise<void> {}
  async onModuleDestroy(): Promise<void> {}
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    ORPCModule.forRoot({
      interceptors: [],
      plugins: [new RethrowHandlerPlugin({ filter: rethrowAdHocErrors })],
    }),
  ],
  controllers: [HealthOrpcHandler],
  providers: [
    { provide: APP_FILTER, useClass: OrpcErrorFilter },
    HealthService,
    StorageHealthIndicator,
    PrismaService,
  ],
})
class HealthE2EModule {}

// Mirror of HealthE2EModule but with ThrottlerModule wired at a tiny limit so
// we can prove @SkipThrottle() on /health actually bypasses the global guard.
// Keeping this as a second module (not one with overrideProvider) avoids
// perturbing the other suite's request budgets.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 3 }]),
    ORPCModule.forRoot({
      interceptors: [],
      plugins: [new RethrowHandlerPlugin({ filter: rethrowAdHocErrors })],
    }),
  ],
  controllers: [HealthOrpcHandler],
  providers: [
    { provide: APP_FILTER, useClass: OrpcErrorFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    HealthService,
    StorageHealthIndicator,
    PrismaService,
  ],
})
class HealthThrottledE2EModule {}

describe('Health endpoint (e2e)', () => {
  let app: INestApplication<App>;
  let prismaFake: FakePrismaService;
  let storageFake: FakeStorageHealthIndicator;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthE2EModule],
    })
      .overrideProvider(PrismaService)
      .useClass(FakePrismaService)
      .overrideProvider(StorageHealthIndicator)
      .useClass(FakeStorageHealthIndicator)
      .compile();

    app = moduleFixture.createNestApplication({ bufferLogs: true });
    await app.init();

    prismaFake = app.get(PrismaService) as unknown as FakePrismaService;
    storageFake = app.get(
      StorageHealthIndicator,
    ) as unknown as FakeStorageHealthIndicator;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prismaFake.setMode('ok');
    storageFake.setNext('ok');
  });

  it('returns 200 and {database:"ok", storage:"ok"} on happy path without any Authorization header', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toEqual({ database: 'ok', storage: 'ok' });
  });

  it('returns 503 and database:"error" when Prisma $queryRaw throws', async () => {
    prismaFake.setMode('fail');
    storageFake.setNext('ok');

    const res = await request(app.getHttpServer()).get('/health').expect(503);
    expect(res.body.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.data).toEqual({ database: 'error', storage: 'ok' });
  });

  it('returns 503 and storage:"error" when the storage indicator reports error', async () => {
    prismaFake.setMode('ok');
    storageFake.setNext('error');

    const res = await request(app.getHttpServer()).get('/health').expect(503);
    expect(res.body.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.data).toEqual({ database: 'ok', storage: 'error' });
  });

  it('returns 503 with both probes in "error" when both fail', async () => {
    prismaFake.setMode('fail');
    storageFake.setNext('error');

    const res = await request(app.getHttpServer()).get('/health').expect(503);
    expect(res.body.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.data).toEqual({ database: 'error', storage: 'error' });
  });

  it('does not require an Authorization header across repeated hits (public route)', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      expect(res.body).toEqual({ database: 'ok', storage: 'ok' });
    }
  });
});

describe('Health endpoint throttler bypass (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthThrottledE2EModule],
    })
      .overrideProvider(PrismaService)
      .useClass(FakePrismaService)
      .overrideProvider(StorageHealthIndicator)
      .useClass(FakeStorageHealthIndicator)
      .compile();

    app = moduleFixture.createNestApplication({ bufferLogs: true });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('sends more requests than the throttler limit without any 429 — proves @SkipThrottle() actually bypasses ThrottlerGuard', async () => {
    // Limit is 3 per minute; send 10 and assert every one is 200.
    const results: number[] = [];
    for (let i = 0; i < 10; i++) {
      const res = await request(app.getHttpServer()).get('/health');
      results.push(res.status);
    }
    expect(results).toHaveLength(10);
    expect(results.every((s) => s === 200)).toBe(true);
    expect(results.some((s) => s === 429)).toBe(false);
  });
});
