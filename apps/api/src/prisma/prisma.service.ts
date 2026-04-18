import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import prismaPkg from '@prisma/client';

// Defensive ESM/CJS interop: @prisma/client v6 ships dual-resolution, so
// depending on the loader `prismaPkg` is either `module.exports` directly
// (CJS via @swc-node/register) or `{ default: module.exports }` (ESM-wrap).
// Crash loudly with a clear message rather than `class extends undefined`.
type PrismaPkg = typeof prismaPkg & { default?: typeof prismaPkg };
const prismaPkgTyped = prismaPkg as PrismaPkg;
const PrismaClient =
  prismaPkgTyped.PrismaClient ?? prismaPkgTyped.default?.PrismaClient;
if (!PrismaClient) {
  throw new Error(
    '[prisma] Could not resolve PrismaClient from @prisma/client — check ESM/CJS loader.',
  );
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
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
