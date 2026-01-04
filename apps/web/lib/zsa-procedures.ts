import { cookies } from 'next/headers';
import { createServerActionProcedure } from 'zsa';
import { userSchema, type User } from '@/lib/schemas/auth.schema';

const API_URL = process.env.API_URL || 'http://localhost:4000';

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
