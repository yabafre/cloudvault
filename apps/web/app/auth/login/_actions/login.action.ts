'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import {
  publicProcedure,
  PublicError,
  COOKIE_OPTIONS,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from '@/lib/zsa-procedures';
import { api, ApiError } from '@/lib/api-client';
import type { AuthResponse } from '@cloudvault/types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const loginAction = publicProcedure
  .createServerAction()
  .input(loginSchema)
  .handler(async ({ input }) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', input);

      // Set httpOnly cookies for tokens
      const cookieStore = await cookies();
      cookieStore.set('accessToken', response.tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });
      cookieStore.set('refreshToken', response.tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });

      return {
        user: response.user,
        accessToken: response.tokens.accessToken,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new PublicError(error.message);
      }
      throw new PublicError('Login failed. Please try again.');
    }
  });
