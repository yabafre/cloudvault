import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { HealthService } from './health.service.js';
import type { PrismaService } from '@/prisma/prisma.service.js';
import type { StorageHealthIndicator } from './storage.indicator.js';

type PrismaMock = Pick<PrismaService, '$queryRaw'>;
type StorageMock = Pick<StorageHealthIndicator, 'check'>;

describe('HealthService', () => {
  let prisma: PrismaMock;
  let storage: StorageMock;
  let service: HealthService;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn<PrismaService['$queryRaw']>(),
    } as unknown as PrismaMock;
    storage = {
      check: jest.fn<StorageHealthIndicator['check']>(),
    };
    service = new HealthService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageHealthIndicator,
    );
  });

  it('returns { database: "ok", storage: "ok" } + degraded=false when both probes succeed', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
    (storage.check as jest.Mock).mockResolvedValue('ok');

    const result = await service.check();

    expect(result).toEqual({
      database: 'ok',
      storage: 'ok',
      degraded: false,
    });
  });

  it('returns database=error + degraded=true when Prisma $queryRaw throws', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('db down'));
    (storage.check as jest.Mock).mockResolvedValue('ok');

    const result = await service.check();

    expect(result).toEqual({
      database: 'error',
      storage: 'ok',
      degraded: true,
    });
  });

  it('returns storage=error + degraded=true when storage indicator returns "error"', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
    (storage.check as jest.Mock).mockResolvedValue('error');

    const result = await service.check();

    expect(result).toEqual({
      database: 'ok',
      storage: 'error',
      degraded: true,
    });
  });

  it('returns both=error + degraded=true when both probes fail', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('neon unreachable'));
    (storage.check as jest.Mock).mockResolvedValue('error');

    const result = await service.check();

    expect(result).toEqual({
      database: 'error',
      storage: 'error',
      degraded: true,
    });
  });

  it('treats a Prisma query that never resolves as database=error (500ms timeout race)', async () => {
    (prisma.$queryRaw as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (storage.check as jest.Mock).mockResolvedValue('ok');

    const result = await service.check();

    expect(result.database).toBe('error');
    expect(result.degraded).toBe(true);
  });
});
