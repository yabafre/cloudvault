import { oc } from '@orpc/contract';
import {
  profileOutputSchema,
  updateProfileSchema,
  updateProfileOutputSchema,
} from '@cloudvault/validators';

export const profileContract = oc.router({
  me: oc
    .route({ method: 'GET', path: '/profile/me' })
    .output(profileOutputSchema),

  update: oc
    .route({ method: 'PUT', path: '/profile/me' })
    .input(updateProfileSchema)
    .output(updateProfileOutputSchema),
});
