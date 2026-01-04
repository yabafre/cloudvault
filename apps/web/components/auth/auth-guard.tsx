'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStatus, useUser } from '@/lib/stores/auth'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Spinner } from '@/components/ui/spinner'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * Client-side auth guard component
 * Wraps protected routes and handles:
 * - Initial auth state loading (waits for AuthProvider initialization)
 * - Redirect to login if unauthenticated
 * - Loading skeleton during auth check
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isInitialized } = useAuthContext()
  const status = useAuthStatus()
  const user = useUser()

  const isLoading = !isInitialized || status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!user

  useEffect(() => {
    // Wait for auth to be initialized
    if (!isInitialized) return

    // If not authenticated after initialization, redirect to login
    if (status === 'unauthenticated') {
      const redirectUrl = encodeURIComponent(pathname)
      router.replace(`/auth/login?redirect=${redirectUrl}`)
    }
  }, [isInitialized, status, router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Will redirect via useEffect
    return null
  }

  return <>{children}</>
}

/**
 * Guest guard - redirects authenticated users away from auth pages
 * Note: This is now handled by middleware, so this component just renders children
 */
export function GuestGuard({ children }: AuthGuardProps) {
  return <>{children}</>
}
