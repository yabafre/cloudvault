import { Controller } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Implement, implement, ORPCError } from '@orpc/nest';
import { contract } from '@cloudvault/contract';
import type { HealthCheckOutput } from '@cloudvault/validators';

import { Public } from '@/modules/auth/decorators/index.js';
import { HealthService } from './health.service.js';

@Controller()
export class HealthOrpcHandler {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @SkipThrottle()
  @Implement(contract.health.check)
  check() {
    return implement(contract.health.check).handler(() => this.handleCheck());
  }

  // Extracted for unit testing: the `check()` method returns a procedure
  // object (invoked by ImplementInterceptor), not a plain callable — so unit
  // tests target handleCheck() directly to exercise the degraded → 503 path.
  async handleCheck(): Promise<HealthCheckOutput> {
    const result = await this.healthService.check();
    const payload: HealthCheckOutput = {
      database: result.database,
      storage: result.storage,
    };
    if (result.degraded) {
      throw new ORPCError('SERVICE_UNAVAILABLE', {
        status: 503,
        data: payload,
      });
    }
    return payload;
  }
}
