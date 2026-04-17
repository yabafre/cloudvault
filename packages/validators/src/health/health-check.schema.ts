import { z } from '@cloudvault/zod';

const serviceStatus = z.enum(['ok', 'error']);

export const healthCheckOutputSchema = z.object({
  database: serviceStatus,
  storage: serviceStatus,
});

export type HealthCheckOutput = z.infer<typeof healthCheckOutputSchema>;
