import { create } from 'zustand'
import type { User, AuthStatus } from '@cloudvault/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  status: AuthStatus

  // Actions
  setAuth: (user: User, accessToken: string) => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  clearAuth: () => void
  setLoading: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'loading',

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
}))

// Selector hooks for performance
export const useUser = () => useAuthStore((state) => state.user)
export const useAccessToken = () => useAuthStore((state) => state.accessToken)
export const useAuthStatus = () => useAuthStore((state) => state.status)
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.status === 'authenticated')
