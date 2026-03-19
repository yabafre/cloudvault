'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Spinner } from '@/components/ui/spinner'
import * as authApi from '@/lib/api/auth'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * Client-side auth guard component
 * Wraps protected routes and handles:
 * - Initial auth state loading
 * - Redirect to login if unauthenticated
 * - Loading skeleton during auth check
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const { user, setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    async function checkAuth() {
      // If we already have a user, we're authenticated
      if (user) {
        setIsChecking(false)
        return
      }

      try {
        // Try to refresh token (uses httpOnly cookie)
        const tokens = await authApi.refreshToken()
        const profile = await authApi.getProfile()
        setAuth(profile, tokens.accessToken)
        setIsChecking(false)
      } catch {
        // No valid session - redirect to login
        clearAuth()
        const redirectUrl = encodeURIComponent(pathname)
        router.replace(`/auth/login?redirect=${redirectUrl}`)
      }
    }

    checkAuth()
  }, [user, setAuth, clearAuth, router, pathname])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
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
