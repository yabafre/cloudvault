import { oc } from '@orpc/contract';
import { authContract } from './auth/index.js';
import { filesContract } from './files/index.js';
import { profileContract } from './profile/index.js';
import { dashboardContract } from './dashboard/index.js';
import { healthContract } from './health/index.js';

export const contract = oc.router({
  auth: authContract,
  files: filesContract,
  profile: profileContract,
  dashboard: dashboardContract,
  health: healthContract,
});

export { authContract } from './auth/index.js';
export { filesContract } from './files/index.js';
export { profileContract } from './profile/index.js';
export { dashboardContract } from './dashboard/index.js';
export { healthContract } from './health/index.js';
