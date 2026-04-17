import { oc } from '@orpc/contract';
import { dashboardStatsOutputSchema } from '@cloudvault/validators';

export const dashboardContract = oc.router({
  getStats: oc
    .route({ method: 'GET', path: '/dashboard/stats' })
    .output(dashboardStatsOutputSchema),
});
