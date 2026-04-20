import { Injectable, Logger } from '@nestjs/common';
import type { HealthCheckOutput } from '@cloudvault/validators';

import { PrismaService } from '@/prisma/index.js';
import { StorageHealthIndicator } from './storage.indicator.js';

export interface HealthCheckResult extends HealthCheckOutput {
  degraded: boolean;
}

// DB probe budget — tighter than S3 (1s) because Neon pooler latency in-region
// is < 20 ms; anything over this means the pool is saturated.
const DB_PROBE_TIMEOUT_MS = 500;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageHealthIndicator,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const [database, storage] = await Promise.all([
      this.probeDatabase(),
      this.storage.check(),
    ]);
    return {
      database,
      storage,
      degraded: database === 'error' || storage === 'error',
    };
  }

  private async probeDatabase(): Promise<'ok' | 'error'> {
    // Mirror StorageHealthIndicator's try/finally + clearTimeout pattern so
    // the loser timer never fires a dangling unhandled rejection on success.
    // nestjs-pino auto-injects `requestId` into the Logger context, so the
    // warn below correlates to the originating /health request.
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('db probe timeout')),
            DB_PROBE_TIMEOUT_MS,
          );
        }),
      ]);
      return 'ok';
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`DB probe failed: ${message}`);
      return 'error';
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
