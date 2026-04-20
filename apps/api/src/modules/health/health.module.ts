import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/index.js';
import { HealthOrpcHandler } from './health.orpc.js';
import { HealthService } from './health.service.js';
import { StorageHealthIndicator } from './storage.indicator.js';

@Module({
  imports: [PrismaModule],
  controllers: [HealthOrpcHandler],
  providers: [HealthService, StorageHealthIndicator],
})
export class HealthModule {}
