'use client';

/**
 * DEPRECATED: This file is kept for backward compatibility.
 * Import from @/core/auth instead for new code.
 *
 * Global hooks (useAuth, useLogout, useProfile) are in @/core/auth/hooks
 * Local hooks (useLogin, useRegister) are in their respective pages:
 * - @/app/auth/login/_hooks/use-login
 * - @/app/auth/register/_hooks/use-register
 */

// Re-export everything from core/auth/hooks for compatibility
export { useAuth, useLogout, useProfile } from '@/core/auth/hooks';

// Re-export authKeys from utils (not hooks) to avoid 'use client' issues
export { authKeys } from '@/core/auth/utils/query-keys';

// Re-export getErrorMessage for compatibility
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Re-export local hooks for backward compatibility
// NOTE: These should be imported from their local pages instead
export { useLogin } from '@/app/auth/login/_hooks/use-login';
export { useRegister } from '@/app/auth/register/_hooks/use-register';
