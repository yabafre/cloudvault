'use server';

import { z } from '@cloudvault/zod';
import { cookies } from 'next/headers';
import {
  publicProcedure,
  PublicError,
  COOKIE_OPTIONS,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from '@/lib/zsa-procedures';
import { api, ApiError } from '@/lib/api-client';
import type { User } from '@cloudvault/types';

const exchangeCodeSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
});

export const exchangeCodeAction = publicProcedure
  .createServerAction()
  .input(exchangeCodeSchema)
  .handler(async ({ input }) => {
    try {
      // Set the access token in cookies first
      const cookieStore = await cookies();
      cookieStore.set('accessToken', input.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      // Fetch user profile using the access token
      const API_URL = process.env.API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new PublicError('Failed to fetch user profile');
      }

      const user: User = await response.json();

      // Note: The refresh token should be set as httpOnly cookie by the backend
      // during the OAuth flow. If your backend returns it in the callback,
      // you would set it here:
      // cookieStore.set('refreshToken', refreshToken, {
      //   ...COOKIE_OPTIONS,
      //   maxAge: REFRESH_TOKEN_MAX_AGE,
      // });

      return {
        user,
        accessToken: input.accessToken,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new PublicError(error.message);
      }
      if (error instanceof PublicError) {
        throw error;
      }
      throw new PublicError('Failed to complete authentication');
    }
  });
