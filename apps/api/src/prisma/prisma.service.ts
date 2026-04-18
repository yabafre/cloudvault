import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // The singleton NestJS Logger is instantiated once at boot. Boot logs below
  // (`Connecting to database...`, etc.) therefore carry no `requestId` — this
  // is correct, they are outside any request context. If a future method on
  // this service logs inside a request path, the log will still be formatted
  // by pino (via `app.useLogger(PinoLogger)` in main.ts) but will lack
  // `requestId` because the pino HTTP binding relies on request-scoped
  // `nestjs-pino.Logger` injection, which this service does not use. Switch
  // to `@InjectLogger()` from `nestjs-pino` if per-request correlation is
  // required here — tracked in story 1-6 / KON-87.
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
  }

  /**
   * Clean the database (useful for testing)
   * WARNING: This will delete all data!
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Delete in order respecting foreign key constraints
    await this.file.deleteMany();
    await this.user.deleteMany();
  }
}
