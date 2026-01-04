// ============================================================================
// User Types
// ============================================================================

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

// ============================================================================
// File Types
// ============================================================================

export interface File {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  s3Url: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: Tokens;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
