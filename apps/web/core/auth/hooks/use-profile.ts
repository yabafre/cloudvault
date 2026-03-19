'use client';

import { useServerActionQuery } from '@/lib/server-action-hooks';
import { useIsAuthenticated } from '@/core/auth/stores/auth';
import { getProfileAction } from '@/core/auth/actions';
import { authKeys } from '@/core/auth/utils/query-keys';

/**
 * Hook to get current user profile with caching - global hook
 * Uses ZSA server action for secure profile fetching
 */
export function useProfile() {
  const isAuthenticated = useIsAuthenticated();

  return useServerActionQuery(getProfileAction, {
    input: undefined,
    queryKey: authKeys.profile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

// Re-export authKeys for convenience
export { authKeys };
