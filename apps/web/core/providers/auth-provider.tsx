'use client';

import {
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { useAuthStore, useHasHydrated } from '@/core/auth/stores/auth';
import { getProfileAction } from '@/core/auth/actions';
import type { User } from '@cloudvault/types';

interface AuthContextValue {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  // Return default value if context is not available (e.g., during SSR or outside provider)
  if (context === undefined) {
    return { isInitialized: false };
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider initializes auth state on app mount.
 * It waits for Zustand to rehydrate from localStorage,
 * then validates the session using httpOnly cookies via server action.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    // Wait for Zustand store to rehydrate from localStorage
    if (!hasHydrated) return;

    const { setAuth, clearAuth, user } = useAuthStore.getState();

    async function initAuth() {
      try {
        // If we have a user from localStorage, validate the session
        if (user) {
          try {
            // Use server action to validate session with httpOnly cookie
            const [result, error] = await getProfileAction({});

            if (error) {
              // Session invalid, clear auth
              clearAuth();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } else if ((result as any)?.user) {
              // Session valid, update with fresh user data
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setAuth((result as any).user as User, ''); // Token is in httpOnly cookie
            }
          } catch {
            // Error validating session, clear auth
            clearAuth();
          }
        } else {
          // No user in localStorage, try to validate session anyway
          // (in case user has valid httpOnly cookie from previous session)
          try {
            const [result, error] = await getProfileAction({});

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!error && (result as any)?.user) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setAuth((result as any).user as User, '');
            } else {
              clearAuth();
            }
          } catch {
            clearAuth();
          }
        }
      } finally {
        setIsInitialized(true);
      }
    }

    initAuth();
  }, [hasHydrated]);

  const value: AuthContextValue = { isInitialized };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
