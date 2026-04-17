import {
  Controller,
  Get,
  type INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  LoggerModule,
  REQUEST_ID_HEADER,
  RequestIdMiddleware,
} from '../src/common/logger';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller()
class PingController {
  @Get('ping')
  ping() {
    return { ok: true };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    LoggerModule,
  ],
  controllers: [PingController],
})
class LoggingTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

describe('Logging & X-Request-Id (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [LoggingTestModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bufferLogs: true });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('generates and returns an x-request-id header when none is sent', async () => {
    const res = await request(app.getHttpServer()).get('/ping').expect(200);
    const returned = res.headers[REQUEST_ID_HEADER];
    expect(returned).toMatch(UUID_V4_REGEX);
  });

  it('echoes a safe incoming x-request-id verbatim', async () => {
    const safe = 'req_abc123-XYZ';
    const res = await request(app.getHttpServer())
      .get('/ping')
      .set(REQUEST_ID_HEADER, safe)
      .expect(200);
    expect(res.headers[REQUEST_ID_HEADER]).toBe(safe);
  });

  it('replaces an injection-shaped x-request-id with a fresh UUID v4', async () => {
    const evil = '../../etc/passwd';
    const res = await request(app.getHttpServer())
      .get('/ping')
      .set(REQUEST_ID_HEADER, evil)
      .expect(200);
    const returned = res.headers[REQUEST_ID_HEADER];
    expect(returned).toMatch(UUID_V4_REGEX);
    expect(returned).not.toBe(evil);
  });

  it('assigns a distinct x-request-id per request', async () => {
    const [a, b] = await Promise.all([
      request(app.getHttpServer()).get('/ping'),
      request(app.getHttpServer()).get('/ping'),
    ]);
    expect(a.headers[REQUEST_ID_HEADER]).toMatch(UUID_V4_REGEX);
    expect(b.headers[REQUEST_ID_HEADER]).toMatch(UUID_V4_REGEX);
    expect(a.headers[REQUEST_ID_HEADER]).not.toBe(b.headers[REQUEST_ID_HEADER]);
  });
});
