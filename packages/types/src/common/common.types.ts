// Unified error codes — architecture §3.5 (LAW)
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FILE_TOO_LARGE'
  | 'INVALID_MIME'
  | 'QUOTA_EXCEEDED'
  | 'EMAIL_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  data?: Record<string, unknown>;
}

export interface Pagination<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export type ISODateString = string;

export type Uuid = string;
