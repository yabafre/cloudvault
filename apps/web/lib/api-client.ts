/**
 * API Client for Server Actions
 * This client is used within server actions to communicate with the NestJS backend.
 * It handles authentication via httpOnly cookies.
 */

import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  tags?: string[];
  revalidate?: number;
}

/**
 * Internal fetch wrapper for server-side API calls
 */
async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, tags, revalidate, ...init } = options;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...init.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] =
      `Bearer ${accessToken}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...init,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    next: {
      tags,
      revalidate,
    },
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let details: unknown;

    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorMessage;
      details = errorBody;
    } catch {
      errorMessage = response.statusText;
    }

    throw new ApiError(errorMessage, response.status, details);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return {} as T;
  }

  return response.json();
}

/**
 * API client for server actions
 */
export const api = {
  get: <T>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'POST', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PATCH', body }),

  put: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, options?: Omit<FetchOptions, 'method'>) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
