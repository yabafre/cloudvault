'use client'

import { useEffect, useState, createContext, useContext, type ReactNode } from 'react'
import { useAuthStore, useHasHydrated } from '@/lib/stores/auth'
import * as authApi from '@/lib/api/auth'

interface AuthContextValue {
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)
  // Return default value if context is not available (e.g., during SSR or outside provider)
  if (context === undefined) {
    return { isInitialized: false }
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider initializes auth state on app mount.
 * It waits for Zustand to rehydrate from localStorage,
 * then attempts to refresh the token using the httpOnly cookie
 * and loads the user profile if successful.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const hasHydrated = useHasHydrated()

  useEffect(() => {
    // Wait for Zustand store to rehydrate from localStorage
    if (!hasHydrated) return

    const { setAuth, clearAuth, accessToken } = useAuthStore.getState()

    async function initAuth() {
      try {
        // If we have a persisted access token, try to use it first
        if (accessToken) {
          try {
            const user = await authApi.getProfile()
            setAuth(user, accessToken)
            setIsInitialized(true)
            return
          } catch {
            // Token expired, continue to refresh
          }
        }

        // Attempt to refresh token (uses httpOnly cookie)
        const tokens = await authApi.refreshToken()

        // If successful, fetch user profile
        const user = await authApi.getProfile()

        // Update auth state
        setAuth(user, tokens.accessToken)
      } catch {
        // No valid session - this is expected for unauthenticated users
        clearAuth()
      } finally {
        setIsInitialized(true)
      }
    }

    initAuth()
  }, [hasHydrated])

  const value: AuthContextValue = { isInitialized }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
