import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, AuthStatus } from '@cloudvault/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  status: AuthStatus
  _hasHydrated: boolean

  // Actions
  setAuth: (user: User, accessToken: string) => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  clearAuth: () => void
  setLoading: () => void
  setHasHydrated: (state: boolean) => void
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
        accessToken: state.accessToken,
        // Don't persist status - it will be recalculated on hydration
      }),
      onRehydrateStorage: () => (state) => {
        // Called when the store is rehydrated from localStorage
        if (state) {
          state.setHasHydrated(true)
        }
      },
    }
  )
)

// Selector hooks for performance
export const useUser = () => useAuthStore((state) => state.user)
export const useAccessToken = () => useAuthStore((state) => state.accessToken)
export const useAuthStatus = () => useAuthStore((state) => state.status)
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.status === 'authenticated')
export const useHasHydrated = () => useAuthStore((state) => state._hasHydrated)
