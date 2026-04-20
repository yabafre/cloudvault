// Unified error codes — architecture §3.5 (LAW)
export const API_ERROR_CODES = [
  'UNAUTHORIZED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'CONFLICT',
  'FILE_TOO_LARGE',
  'INVALID_MIME',
  'QUOTA_EXCEEDED',
  'EMAIL_TAKEN',
  'INVALID_CREDENTIALS',
  'RATE_LIMITED',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    typeof value === 'string' &&
    (API_ERROR_CODES as readonly string[]).includes(value)
  );
}

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
