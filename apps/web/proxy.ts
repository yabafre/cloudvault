import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/files', '/settings', '/profile']

// Routes only for unauthenticated users (guest-only)
const authRoutes = ['/auth/login', '/auth/register']

// Routes that don't need any check
const publicRoutes = ['/auth/callback', '/auth/forgot-password', '/auth/reset-password']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for refresh token cookie (set by API with httpOnly flag)
  const refreshToken = request.cookies.get('refreshToken')?.value
  const isAuthenticated = !!refreshToken

  // Check if the current path matches protected routes
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Check if the current path is a guest-only auth route
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Check if route is public (no auth checks needed)
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Skip auth checks for public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && isAuthenticated) {
    // Check for redirect param to honor original destination
    const redirectTo = request.nextUrl.searchParams.get('redirect')
    const destination = redirectTo || '/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // Root path: show homepage (no redirect)
  // Users can access homepage whether logged in or not

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
