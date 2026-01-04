'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore, useUser, useAuthStatus, useIsAuthenticated } from '@/lib/stores/auth'
import * as authApi from '@/lib/api/auth'
import { getErrorMessage } from '@/lib/api/client'

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
}

/**
 * Hook to get current user profile with caching
 */
export function useProfile() {
  const isAuthenticated = useIsAuthenticated()

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: authApi.getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

/**
 * Hook to handle login
 */
export function useLogin() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken)
      queryClient.setQueryData(authKeys.profile(), data.user)
      router.push('/dashboard')
    },
  })
}

/**
 * Hook to handle registration
 */
export function useRegister() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken)
      queryClient.setQueryData(authKeys.profile(), data.user)
      router.push('/dashboard')
    },
  })
}

/**
 * Hook to handle logout
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { clearAuth } = useAuthStore()

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Always clear local state, even if API call fails
      clearAuth()
      queryClient.clear()
      toast.success('Signed out', {
        description: 'You have been signed out successfully.',
      })
      router.push('/auth/login')
    },
  })
}

/**
 * Hook to initialize auth state on app load
 * Attempts to refresh token and get user profile
 */
export function useAuthInit() {
  const { setAuth, clearAuth, setLoading } = useAuthStore()
  const queryClient = useQueryClient()

  useEffect(() => {
    async function initAuth() {
      setLoading()

      try {
        // Try to refresh token (uses httpOnly cookie)
        const tokens = await authApi.refreshToken()

        // Get user profile
        const user = await authApi.getProfile()

        setAuth(user, tokens.accessToken)
        queryClient.setQueryData(authKeys.profile(), user)
      } catch {
        // No valid session
        clearAuth()
      }
    }

    initAuth()
  }, [setAuth, clearAuth, setLoading, queryClient])
}

/**
 * Combined hook for auth state and actions
 */
export function useAuth() {
  const user = useUser()
  const status = useAuthStatus()
  const isAuthenticated = useIsAuthenticated()
  const loginMutation = useLogin()
  const registerMutation = useRegister()
  const logoutMutation = useLogout()

  return {
    user,
    status,
    isAuthenticated,
    isLoading: status === 'loading',
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  }
}

export { getErrorMessage }
