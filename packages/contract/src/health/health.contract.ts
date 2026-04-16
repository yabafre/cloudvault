import { oc } from '@orpc/contract';
import { healthCheckOutputSchema } from '@cloudvault/validators';

export const healthContract = {
  check: oc
    .route({ method: 'GET', path: '/health' })
    .output(healthCheckOutputSchema),
};
