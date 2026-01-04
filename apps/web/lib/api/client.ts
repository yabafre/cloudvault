import ky, { type KyInstance, type Options, HTTPError } from 'ky'
import { useAuthStore } from '@/lib/stores/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Track refresh state to prevent race conditions
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await ky.post(`${API_URL}/auth/refresh`, {
      credentials: 'include', // Send httpOnly cookie
    }).json<{ accessToken: string; refreshToken: string }>()

    return response.accessToken
  } catch {
    return null
  }
}

async function handleTokenRefresh(): Promise<string | null> {
  if (isRefreshing) {
    // Wait for ongoing refresh
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = refreshAccessToken()

  try {
    const newToken = await refreshPromise
    if (newToken) {
      useAuthStore.getState().setAccessToken(newToken)
    } else {
      useAuthStore.getState().clearAuth()
    }
    return newToken
  } finally {
    isRefreshing = false
    refreshPromise = null
  }
}

export const api: KyInstance = ky.create({
  prefixUrl: API_URL,
  credentials: 'include', // Always send cookies
  timeout: 30000,
  hooks: {
    beforeRequest: [
      (request) => {
        const accessToken = useAuthStore.getState().accessToken
        if (accessToken) {
          request.headers.set('Authorization', `Bearer ${accessToken}`)
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        // Handle 401 - attempt token refresh
        if (response.status === 401 && !request.url.includes('/auth/refresh')) {
          const newToken = await handleTokenRefresh()

          if (newToken) {
            // Retry the original request with new token
            const headers: Record<string, string> = {}
            request.headers.forEach((value, key) => {
              headers[key] = value
            })
            headers['Authorization'] = `Bearer ${newToken}`

            const retryOptions: Options = {
              ...options,
              headers,
            }
            return ky(request.url, retryOptions)
          }
        }
        return response
      },
    ],
  },
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
})

// Helper to extract error message from API errors
export async function getErrorMessage(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const body = await error.response.json() as { message?: string }
      return body.message || error.message
    } catch {
      return error.message
    }
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export { HTTPError }
