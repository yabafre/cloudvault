export type AuthProvider = 'LOCAL' | 'GOOGLE';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  provider: AuthProvider;
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: Tokens;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
