# ADR-004: Frontend Authentication Architecture

## Status
ACCEPTED

## Context

CloudVault needs a secure, performant authentication system for the Next.js 16 frontend. The backend already implements:
- JWT access tokens (15min expiry)
- JWT refresh tokens (30 days, stored in DB)
- Endpoints: register, login, refresh, logout, profile, google oauth

### Technical Constraints
- Next.js 16 App Router + React 19
- SSR support required
- API on separate origin (localhost:4000)
- Must handle token refresh transparently
- Must protect against XSS and CSRF

## Decision

### 1. Token Storage: Hybrid Approach

| Token | Storage | Rationale |
|-------|---------|-----------|
| Access Token | In-memory (Zustand) | Short-lived, protected from XSS |
| Refresh Token | httpOnly cookie | Persistent, protected from JS access |

The API sets the httpOnly cookie; frontend never touches refresh token directly.

### 2. State Management: Zustand + React Query

- **Zustand** (~2KB): Synchronous auth state (user, accessToken, isAuthenticated)
- **React Query**: Async operations (login, register, refresh mutations)

Separation of concerns: sync state vs async operations.

### 3. Route Protection: Middleware + Layout Guard

- **Middleware (Edge)**: Check cookie presence, redirect before render
- **Layout AuthGuard**: Silent refresh attempt, loading states, client-side UX

Two layers: server-side security + client-side experience.

### 4. Token Refresh: Request Queue Pattern

```
Request fails 401 -> Is refreshing?
  - Yes: Queue request, wait
  - No: Start refresh, queue subsequent requests

Refresh success -> Replay all queued requests
Refresh failure -> Clear auth, redirect to login
```

Prevents race conditions when multiple requests fail simultaneously.

### 5. API Client: ky

- ~3KB (vs ~30KB axios)
- Native fetch-based
- Hooks for interceptors (beforeRequest, afterResponse)
- Built-in retry

## Consequences

### Positive
- **Security**: Access token in memory (XSS-safe), refresh in httpOnly cookie (also XSS-safe)
- **UX**: Silent refresh, no session expiry popups
- **Performance**: ky is lightweight, Zustand is minimal
- **DX**: Clear separation between sync/async concerns

### Negative
- **Complexity**: More moving parts than localStorage-only
- **Backend changes**: API must set httpOnly cookies
- **Session on tab close**: Access token lost (mitigated by refresh)

### Backend Requirements
1. Set `refreshToken` as httpOnly cookie in login/register responses
2. Read refresh token from cookie in `/auth/refresh`
3. Configure CORS with `credentials: true`

## Alternatives Considered

### localStorage for both tokens
- Rejected: Vulnerable to XSS attacks

### React Context only
- Rejected: Re-renders on any change, no persistence

### axios
- Rejected: 10x larger bundle for same features

## Implementation

### File Structure
```
apps/web/
├── lib/
│   ├── api/client.ts      # ky with interceptors
│   ├── api/auth.ts        # auth API functions
│   └── stores/auth.ts     # Zustand store
├── hooks/
│   └── use-auth.ts        # combined auth hook
├── components/auth/
│   └── auth-guard.tsx     # client protection
└── middleware.ts          # edge protection
```

### Dependencies
```bash
pnpm --filter @cloudvault/web add zustand ky
```

---

**Author:** Claude (Architect Agent)
**Date:** 2025-01-04
