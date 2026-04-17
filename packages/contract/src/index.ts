import { oc } from '@orpc/contract';
import { authContract } from './auth';
import { filesContract } from './files';
import { profileContract } from './profile';
import { dashboardContract } from './dashboard';
import { healthContract } from './health';

export const contract = oc.router({
  auth: authContract,
  files: filesContract,
  profile: profileContract,
  dashboard: dashboardContract,
  health: healthContract,
});

export { authContract } from './auth';
export { filesContract } from './files';
export { profileContract } from './profile';
export { dashboardContract } from './dashboard';
export { healthContract } from './health';
