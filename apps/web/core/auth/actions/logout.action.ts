'use server';

import { cookies } from 'next/headers';
import { publicProcedure, COOKIE_OPTIONS } from '@/lib/zsa-procedures';
import { api } from '@/lib/api-client';

export const logoutAction = publicProcedure
  .createServerAction()
  .handler(async () => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    // Try to invalidate refresh token on backend
    if (accessToken) {
      try {
        await api.post('/auth/logout');
      } catch {
        // Ignore errors - we still want to clear local cookies
      }
    }

    // Clear auth cookies
    cookieStore.set('accessToken', '', {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });
    cookieStore.set('refreshToken', '', {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });

    return { success: true };
  });
