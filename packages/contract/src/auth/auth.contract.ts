import { oc } from '@orpc/contract';
import {
  loginSchema,
  loginOutputSchema,
  registerSchema,
  registerOutputSchema,
  refreshSchema,
  refreshOutputSchema,
} from '@cloudvault/validators';

export const authContract = {
  login: oc
    .route({ method: 'POST', path: '/auth/login' })
    .input(loginSchema)
    .output(loginOutputSchema),

  register: oc
    .route({ method: 'POST', path: '/auth/register' })
    .input(registerSchema)
    .output(registerOutputSchema),

  refresh: oc
    .route({ method: 'POST', path: '/auth/refresh' })
    .input(refreshSchema)
    .output(refreshOutputSchema),

  logout: oc.route({ method: 'POST', path: '/auth/logout' }),

  googleCallback: oc.route({
    method: 'GET',
    path: '/auth/google/callback',
  }),
};
