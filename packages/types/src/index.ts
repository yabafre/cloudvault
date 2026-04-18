// Feature-scoped re-exports
export * from './common/index.js';
export * from './auth/index.js';
export * from './files/index.js';
export * from './profile/index.js';
export * from './dashboard/index.js';

// ============================================================================
// Legacy types — backward compatibility (remove in story 2-1)
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

export interface RefreshTokenDto {
  refreshToken: string;
}

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

/**
 * @deprecated Use FileMetadata from '@cloudvault/types/files' instead
 */
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
