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
import type { AuthResponse } from '@cloudvault/types';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

export const registerAction = publicProcedure
  .createServerAction()
  .input(registerSchema)
  .handler(async ({ input }) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', input);

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
      throw new PublicError('Registration failed. Please try again.');
    }
  });
