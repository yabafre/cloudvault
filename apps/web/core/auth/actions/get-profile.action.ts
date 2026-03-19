'use server';

import { authedProcedure } from '@/lib/zsa-procedures';

export const getProfileAction = authedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    // The authedProcedure already validates the session and fetches the user
    // ctx contains { user, accessToken } from the procedure handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { user: (ctx as any).user };
  });
