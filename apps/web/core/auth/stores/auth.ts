'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthStatus } from '@cloudvault/types';

interface AuthState {
  user: User | null;
  accessToken: string | null; // Kept for backward compatibility, but tokens are now in httpOnly cookies
  status: AuthStatus;
  _hasHydrated: boolean;

  // Actions
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setLoading: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      status: 'loading',
      _hasHydrated: false,

      setAuth: (user, accessToken) =>
        set({
          user,
          accessToken,
          status: 'authenticated',
        }),

      setAccessToken: (token) =>
        set({
          accessToken: token,
        }),

      setUser: (user) =>
        set({
          user,
        }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          status: 'unauthenticated',
        }),

      setLoading: () =>
        set({
          status: 'loading',
        }),

      setHasHydrated: (state) =>
        set({
          _hasHydrated: state,
        }),
    }),
    {
      name: 'cloudvault-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        // Note: accessToken is NOT persisted to localStorage for security
        // Tokens are stored in httpOnly cookies and managed by server actions
      }),
      onRehydrateStorage: () => (state) => {
        // Called when the store is rehydrated from localStorage
        if (state) {
          state.setHasHydrated(true);
          // If we have a user from localStorage, set status to authenticated
          // The actual token validation will happen via server action
          if (state.user) {
            state.status = 'authenticated';
          } else {
            state.status = 'unauthenticated';
          }
        }
      },
    },
  ),
);

// Selector hooks for performance
export const useUser = () => useAuthStore((state) => state.user);
export const useAccessToken = () => useAuthStore((state) => state.accessToken);
export const useAuthStatus = () => useAuthStore((state) => state.status);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.status === 'authenticated');
export const useHasHydrated = () => useAuthStore((state) => state._hasHydrated);
