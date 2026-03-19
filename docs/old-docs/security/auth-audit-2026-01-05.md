# Security Audit Report: Frontend Auth System

**Date:** 2026-01-05
**Auditor:** Claude Security Agent
**Scope:** CloudVault Frontend Authentication System (Restructured)

---

## Scope

**Files reviewed:** 15
**Modules:**
- `apps/web/core/auth/api/client.ts`
- `apps/web/core/auth/api/auth.ts`
- `apps/web/core/auth/stores/auth.ts`
- `apps/web/core/auth/hooks/use-auth.ts`
- `apps/web/core/auth/hooks/use-logout.ts`
- `apps/web/core/auth/hooks/use-profile.ts`
- `apps/web/core/auth/components/auth-guard.tsx`
- `apps/web/core/providers/auth-provider.tsx`
- `apps/web/app/auth/login/_components/login-form.tsx`
- `apps/web/app/auth/login/_hooks/use-login.ts`
- `apps/web/app/auth/register/_components/register-form.tsx`
- `apps/web/app/auth/register/_hooks/use-register.ts`
- `apps/web/app/auth/callback/_components/callback-content.tsx`
- `apps/web/proxy.ts`
- `apps/web/next.config.ts`

---

## Findings

### CRITICAL (Blocking)

| ID | Issue | File:Line | Remediation |
|----|-------|-----------|-------------|
| C-01 | Access Token in localStorage | `core/auth/stores/auth.ts:66-70` | Store access token in memory only (not localStorage). The Zustand persist middleware stores `accessToken` to localStorage, making it accessible to XSS attacks. Refresh tokens are correctly stored as httpOnly cookies. |

### HIGH

| ID | Issue | File:Line | Remediation |
|----|-------|-----------|-------------|
| H-01 | Access Token in URL (OAuth Callback) | `app/auth/callback/_components/callback-content.tsx:19` | The OAuth callback receives `accessToken` via URL query parameter (`searchParams.get('accessToken')`). This exposes tokens in browser history, server logs, and referrer headers. Backend should use a short-lived authorization code exchanged via POST, or set the token via httpOnly cookie with a redirect. |
| H-02 | Missing Security Headers Configuration | `next.config.ts:1-6` | Next.js config has no security headers defined. Add CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers. |
| H-03 | Missing Rate Limiting | `core/auth/api/client.ts:47-90` | No client-side rate limiting or exponential backoff for auth endpoints. While backend should enforce this, client-side throttling prevents abuse and improves UX. |

### MEDIUM

| ID | Issue | File:Line | Remediation |
|----|-------|-----------|-------------|
| M-01 | OAuth State Validation Optional | `app/auth/callback/_components/callback-content.tsx:28-38` | The comment "state validation is optional until backend supports it" weakens CSRF protection. Ensure backend always returns state parameter and make validation mandatory. |
| M-02 | No Token Expiry Validation | `core/auth/api/client.ts:52-58` | Access tokens are used without checking expiration time before requests. Consider decoding JWT locally to check exp claim before API calls to avoid unnecessary 401 round-trips. |
| M-03 | Sidebar Cookie Without Secure Flag | `components/ui/sidebar.tsx:86` | `document.cookie` sets sidebar state without `Secure` flag, allowing transmission over HTTP. Add `; Secure` in production. |
| M-04 | Missing HTTPS Enforcement | `next.config.ts` / `proxy.ts` | No HTTPS redirect configured in middleware. In production, all HTTP requests should redirect to HTTPS. |
| M-05 | GuestGuard Disabled | `core/auth/components/auth-guard.tsx:64-66` | `GuestGuard` component is effectively disabled (just renders children). Comment states "handled by middleware" but provides no protection if middleware is bypassed. |

### LOW

| ID | Issue | File:Line | Remediation |
|----|-------|-----------|-------------|
| L-01 | Password Schema Too Permissive | `app/auth/login/_components/login-form.tsx:22` | Login form only validates password is not empty (`min(1)`). Consider adding reasonable length limits to prevent abuse. |
| L-02 | Registration Password Validation Mismatch | `app/auth/register/_components/register-form.tsx:20-34` | Zod schema requires only 8 chars, but UI shows additional strength indicators (uppercase, lowercase, number). These are informational only and not enforced at validation level. |
| L-03 | Verbose Error Messages | `core/auth/api/client.ts:93-106` | API error messages are passed through to UI. Ensure backend does not leak sensitive information in error responses (e.g., "user not found" vs "user exists"). |
| L-04 | Missing Loading State Race Condition Guard | `core/providers/auth-provider.tsx:48-78` | The `initAuth` function could potentially be called multiple times if `hasHydrated` changes rapidly. Consider using a ref to track initialization. |
| L-05 | No Session Timeout Warning | All auth files | No mechanism to warn users before session expires or to extend session automatically before token expiration. |

### INFO (Observations - Non-Issues)

| ID | Observation | File:Line | Status |
|----|-------------|-----------|--------|
| I-01 | CSRF Protection for OAuth | `core/auth/api/auth.ts:65-71` | OAuth state parameter correctly generated using `crypto.randomUUID()` and stored in sessionStorage. |
| I-02 | Token Refresh Race Condition Prevention | `core/auth/api/client.ts:6-8, 24-45` | Token refresh uses singleton pattern (`isRefreshing`, `refreshPromise`) to prevent multiple concurrent refresh requests. |
| I-03 | Credentials Include Mode | `core/auth/api/client.ts:49` | API client correctly configured with `credentials: 'include'` for httpOnly cookie support. |
| I-04 | Input Validation with Zod | `login-form.tsx:20-23`, `register-form.tsx:20-24` | Forms use Zod schemas with react-hook-form for client-side validation. |
| I-05 | Protected Routes via Middleware | `proxy.ts:1-73` | Server-side route protection using Next.js middleware with cookie-based auth check. |
| I-06 | Auth State Hydration | `core/auth/stores/auth.ts:72-77` | Zustand correctly handles SSR/hydration with `onRehydrateStorage` callback. |
| I-07 | Query Cache Cleared on Logout | `core/auth/hooks/use-logout.ts:22` | React Query cache cleared on logout preventing data leakage between sessions. |
| I-08 | dangerouslySetInnerHTML (Safe Use) | `components/ui/chart.tsx:83` | Used in shadcn/ui Chart component for CSS generation only. Color values come from config (not user input) - no XSS risk. |

---

## Detailed Analysis

### Token Storage Strategy

**Current Implementation:**
- **Refresh Token:** Stored as httpOnly cookie (GOOD - not accessible via JS)
- **Access Token:** Stored in localStorage via Zustand persist middleware (PROBLEMATIC)

**Risk Assessment:**
The access token in localStorage is accessible to any JavaScript running on the page, including potential XSS payloads. While the access token has a short lifespan, an attacker could use it for immediate API calls.

**Recommended Architecture:**
```
Option A (Recommended): Memory-Only Access Token
- Keep refresh token as httpOnly cookie (current)
- Store access token in memory only (Zustand without persist for accessToken)
- On page refresh, use refresh token to get new access token

Option B: BFF Pattern (Backend-for-Frontend)
- All API calls go through Next.js API routes
- Tokens stored entirely server-side in sessions
- Frontend never sees tokens
```

### OAuth Callback Security

**Current Flow:**
1. Frontend generates state, stores in sessionStorage
2. User redirected to Google via backend
3. Backend exchanges code for tokens
4. Backend redirects to `/auth/callback?accessToken=xxx&state=yyy`
5. Frontend validates state, stores token

**Vulnerabilities:**
- Token in URL exposed to browser history, Referrer header, and server logs
- Token could be leaked to third-party scripts via Referrer

**Recommended Flow:**
1. Frontend generates state, stores in sessionStorage
2. User redirected to Google via backend
3. Backend exchanges code for tokens
4. Backend sets httpOnly cookie AND stores access token in memory
5. Backend redirects to `/auth/callback?success=true&state=yyy`
6. Frontend validates state, fetches profile (token already in cookie)

### Missing Security Headers

The following headers should be configured in `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        },
      ],
    },
  ];
}
```

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH | 3 |
| MEDIUM | 5 |
| LOW | 5 |
| INFO | 8 |

---

## Verdict

**FAIL**

The frontend authentication system has **1 CRITICAL** and **3 HIGH** severity issues that must be addressed before production deployment:

1. **CRITICAL:** Access tokens stored in localStorage create XSS vulnerability
2. **HIGH:** Access tokens passed in OAuth callback URL exposes tokens
3. **HIGH:** Missing security headers leave application vulnerable to common attacks
4. **HIGH:** No rate limiting for authentication endpoints

---

## Positive Security Observations

The codebase demonstrates several good security practices:

1. Proper use of httpOnly cookies for refresh tokens
2. CSRF protection via OAuth state parameter
3. Race condition prevention in token refresh logic
4. Server-side route protection via middleware
5. Input validation with Zod schemas
6. Query cache cleared on logout
7. Proper credential mode for cross-origin cookies

---

## Remediation Priority

1. **Immediate (Before Production):**
   - C-01: Remove accessToken from localStorage persist
   - H-01: Refactor OAuth callback to not pass token in URL
   - H-02: Add security headers to Next.js config

2. **Short-term (Sprint 1):**
   - H-03: Implement rate limiting
   - M-01: Make OAuth state validation mandatory
   - M-04: Add HTTPS enforcement

3. **Medium-term (Sprint 2):**
   - M-02: Add client-side token expiry check
   - M-03: Add Secure flag to sidebar cookie
   - M-05: Re-enable GuestGuard
   - L-02: Enforce password strength at validation level

---

## Next Steps

After addressing CRITICAL and HIGH issues:
> Use the performance-optimizer subagent on "frontend-auth-system"
