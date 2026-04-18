import { APP_FILTER } from '@nestjs/core';
import { type INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { ORPCModule } from '@orpc/nest';
import {
  experimental_RethrowHandlerPlugin as RethrowHandlerPlugin,
} from '@orpc/server/plugins';
import request from 'supertest';
import type { App } from 'supertest/types';

import { OrpcErrorFilter } from '../src/orpc/orpc-error.filter';
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
      plugins: [
        new RethrowHandlerPlugin({
          filter: (error) => {
            const candidate = error as { defined?: unknown } | null;
            return !(candidate?.defined === true);
          },
        }),
      ],
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

  it('does not require an Authorization header across repeated hits (public + SkipThrottle intent)', async () => {
    // Repeated sequential hits without any auth header — simulates an uptime
    // robot. Full throttler behaviour is not exercised here (the harness
    // intentionally omits ThrottlerModule), but this confirms the handler
    // is reachable with no credential and is stable under repeated access.
    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      expect(res.body).toEqual({ database: 'ok', storage: 'ok' });
    }
  });
});
