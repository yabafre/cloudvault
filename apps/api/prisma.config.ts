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
    url: env('DIRECT_URL') || env('DATABASE_URL'),
  },
});
