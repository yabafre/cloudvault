import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

// Neon pooled endpoint for runtime PrismaClient + unpooled endpoint for
// migrate/studio/db push (PgBouncer transaction mode rejects migrate DDL).
// Architecture §2.2 Data Layer.
export default defineConfig({
  schema: path.join('prisma', 'schema'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    // Nullish coalescing only — an accidentally empty DIRECT_URL must not
    // silently fall back to the pooled DATABASE_URL (migrate DDL would fail).
    url: env('DIRECT_URL') ?? env('DATABASE_URL'),
  },
});
