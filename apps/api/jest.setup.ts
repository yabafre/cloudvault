import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://test:test@localhost:5432/test?sslmode=disable';
}
