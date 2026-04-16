import { cookies } from 'next/headers';
import { createServerActionProcedure } from 'zsa';
import { z } from '@cloudvault/zod';
import type { User } from '@cloudvault/types';

const API_URL = process.env.API_URL || 'http://localhost:4000';

// Zod schema for user validation
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().default(null),
  avatar: z.string().nullable().default(null),
  provider: z.enum(['LOCAL', 'GOOGLE']),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export class PublicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicError';
  }
}

// Cookie options for httpOnly tokens
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Public procedure - no authentication required
 * Used for login, register, and OAuth callback
 */
export const publicProcedure = createServerActionProcedure().handler(
  async () => {
    // Public procedures don't require authentication
    // Return empty context
    return {};
  },
);

/**
 * Authed procedure - validates session and provides user context
 */
export const authedProcedure = createServerActionProcedure().handler(
  async () => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) throw new PublicError('Non authentifie');

    const res = await fetch(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new PublicError('Session invalide');

    const user: User = userSchema.parse(await res.json());
    return { user, accessToken };
  },
);
