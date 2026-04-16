import { oc } from '@orpc/contract';
import { dashboardStatsOutputSchema } from '@cloudvault/validators';

export const dashboardContract = {
  getStats: oc
    .route({ method: 'GET', path: '/dashboard/stats' })
    .output(dashboardStatsOutputSchema),
};
