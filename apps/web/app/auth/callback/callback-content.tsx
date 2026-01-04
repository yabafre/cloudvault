'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { getProfile, validateOAuthState } from '@/lib/api/auth'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth, clearAuth } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      const accessToken = searchParams.get('accessToken')
      const errorParam = searchParams.get('error')
      const state = searchParams.get('state')

      if (errorParam) {
        setError(decodeURIComponent(errorParam))
        return
      }

      // Validate OAuth state if provided (CSRF protection)
      // Note: state validation is optional until backend supports it
      if (state && !validateOAuthState(state)) {
        setError('Invalid authentication state. Please try again.')
        return
      }

      // Clear any stored state if backend didn't return it
      if (!state && typeof window !== 'undefined') {
        sessionStorage.removeItem('oauth_state')
      }

      if (!accessToken) {
        setError('No access token received')
        return
      }

      try {
        // Set the access token first
        useAuthStore.getState().setAccessToken(accessToken)

        // Fetch user profile
        const user = await getProfile()

        // Update auth state
        setAuth(user, accessToken)

        // Redirect to dashboard
        router.push('/dashboard')
      } catch (err) {
        clearAuth()
        setError('Failed to complete authentication')
      }
    }

    handleCallback()
  }, [searchParams, setAuth, clearAuth, router])

  if (error) {
    return (
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          className="w-full"
          onClick={() => router.push('/auth/login')}
        >
          Back to login
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-muted-foreground">
        Completing sign in...
      </p>
    </div>
  )
}
