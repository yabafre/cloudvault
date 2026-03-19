'use client';

import { useMemo } from 'react';
import {
  useUser,
  useAuthStatus,
  useIsAuthenticated,
} from '@/core/auth/stores/auth';
import { useLogout } from './use-logout';
import { useProfile } from './use-profile';
import type { User } from '@cloudvault/types';

/**
 * Facade hook combining auth state and global actions
 * Local hooks (useLogin, useRegister) should be imported from their respective pages
 */
export function useAuth() {
  const user = useUser();
  const status = useAuthStatus();
  const isAuthenticated = useIsAuthenticated();
  const { logout, isPending: isLoggingOut } = useLogout();
  const { data: profileData } = useProfile();

  // Memoize the combined user to avoid unnecessary re-renders
  const currentUser = useMemo((): User | null => {
    // profileData comes from server action and may have user property
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileUser = (profileData as any)?.user;
    if (profileUser) {
      return profileUser as User;
    }
    return user;
  }, [profileData, user]);

  return {
    // State
    user: currentUser,
    status,
    isAuthenticated,
    isLoading: status === 'loading',

    // Global actions only
    logout,
    isLoggingOut,
  };
}
