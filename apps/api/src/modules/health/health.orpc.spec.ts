import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { HealthOrpcHandler } from './health.orpc.js';
import type { HealthService } from './health.service.js';

describe('HealthOrpcHandler', () => {
  let healthService: { check: jest.MockedFunction<HealthService['check']> };
  let handler: HealthOrpcHandler;

  beforeEach(() => {
    healthService = { check: jest.fn<HealthService['check']>() };
    handler = new HealthOrpcHandler(healthService as unknown as HealthService);
  });

  it('returns the {database, storage} payload when not degraded', async () => {
    healthService.check.mockResolvedValue({
      database: 'ok',
      storage: 'ok',
      degraded: false,
    });

    const result = await handler.handleCheck();

    expect(result).toEqual({ database: 'ok', storage: 'ok' });
  });

  it('throws an ORPCError with status 503 and code SERVICE_UNAVAILABLE when degraded', async () => {
    healthService.check.mockResolvedValue({
      database: 'error',
      storage: 'ok',
      degraded: true,
    });

    await expect(handler.handleCheck()).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      status: 503,
      data: { database: 'error', storage: 'ok' },
    });
  });

  it('preserves the storage failure in the ORPCError data when only storage is down', async () => {
    healthService.check.mockResolvedValue({
      database: 'ok',
      storage: 'error',
      degraded: true,
    });

    await expect(handler.handleCheck()).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      status: 503,
      data: { database: 'ok', storage: 'error' },
    });
  });
});
