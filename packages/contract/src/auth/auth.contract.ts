import { oc } from '@orpc/contract';
import {
  loginSchema,
  loginOutputSchema,
  registerSchema,
  registerOutputSchema,
  refreshSchema,
  refreshOutputSchema,
  googleCallbackSchema,
  successOutputSchema,
  voidOutputSchema,
} from '@cloudvault/validators';

export const authContract = oc.router({
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

  logout: oc
    .route({ method: 'POST', path: '/auth/logout' })
    .output(successOutputSchema),

  googleCallback: oc
    .route({ method: 'GET', path: '/auth/google/callback' })
    .input(googleCallbackSchema)
    .output(voidOutputSchema),
});
