import { Controller, type INestApplication, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { Implement, ORPCError } from '@orpc/nest';
import { ORPCModule } from '@orpc/nest';
import {
  experimental_RethrowHandlerPlugin as RethrowHandlerPlugin,
} from '@orpc/server/plugins';
import { oc } from '@orpc/contract';
import { os } from '@orpc/server';
import { z } from '@cloudvault/zod';
import request from 'supertest';
import type { App } from 'supertest/types';

import { OrpcErrorFilter } from '../src/orpc/orpc-error.filter';
import { rethrowAdHocErrors } from '../src/orpc/rethrow-ad-hoc-filter';

const boomContract = oc.router({
  raw: oc.route({ method: 'GET', path: '/boom-raw' }).output(z.object({ ok: z.boolean() })),
  typed: oc
    .route({ method: 'GET', path: '/boom-typed' })
    .output(z.object({ ok: z.boolean() })),
});

@Controller()
class BoomController {
  @Implement(boomContract.raw)
  boomRaw() {
    return os.handler(() => {
      throw new Error('secret internals');
    });
  }

  @Implement(boomContract.typed)
  boomTyped() {
    return os.handler(() => {
      throw new ORPCError('VALIDATION_ERROR', {
        status: 400,
        message: 'nope',
        data: { field: 'email' },
      });
    });
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    ORPCModule.forRoot({
      interceptors: [],
      plugins: [new RethrowHandlerPlugin({ filter: rethrowAdHocErrors })],
    }),
  ],
  controllers: [BoomController],
  providers: [{ provide: APP_FILTER, useClass: OrpcErrorFilter }],
})
class BoomE2EModule {}

describe('OrpcErrorFilter wire contract (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BoomE2EModule],
    }).compile();
    app = moduleFixture.createNestApplication({ bufferLogs: true });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('maps a raw thrown Error to 500 + {code:"INTERNAL_ERROR", message:"Internal server error"} with no stack/cause/name', async () => {
    const res = await request(app.getHttpServer()).get('/boom-raw').expect(500);

    expect(res.body).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
    expect(res.body).not.toHaveProperty('stack');
    expect(res.body).not.toHaveProperty('cause');
    expect(res.body).not.toHaveProperty('name');
    expect(res.body).not.toHaveProperty('errno');
    expect(JSON.stringify(res.body)).not.toContain('secret internals');
  });

  it('preserves a typed ORPCError verbatim: 400 + {code:"VALIDATION_ERROR", message:"nope", data} with no stack/cause/name/errno', async () => {
    const res = await request(app.getHttpServer()).get('/boom-typed').expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('nope');
    expect(res.body.data).toEqual({ field: 'email' });
    expect(res.body).not.toHaveProperty('stack');
    expect(res.body).not.toHaveProperty('cause');
    expect(res.body).not.toHaveProperty('name');
    expect(res.body).not.toHaveProperty('errno');
  });
});
