# Frontend Authentication System - Specification

## Status: IN_PROGRESS

## Overview

Implementation of the complete authentication system on the Next.js 16 frontend for CloudVault, connecting to the existing NestJS backend API.

## Scope

### In Scope
- Login page with email/password form
- Register page with validation
- OAuth Google integration
- Auth callback handler
- Protected dashboard route
- Auth state management (Zustand)
- Token management (access + refresh)
- Automatic token refresh
- Route guards (middleware + client)
- Logout functionality

### Out of Scope
- Password reset flow
- Email verification UI
- Account settings
- Profile editing

## User Stories

### US-1: Registration
**As a** new user
**I want to** create an account with my email
**So that** I can store and manage my files securely

**Acceptance Criteria:**
- Form with email, password, and optional name fields
- Password minimum 8 characters
- Real-time validation feedback
- Error handling for existing email
- Redirect to dashboard on success
- Google OAuth alternative available

### US-2: Login
**As a** registered user
**I want to** login with my credentials
**So that** I can access my files

**Acceptance Criteria:**
- Form with email and password fields
- Error messages for invalid credentials
- Remember me option (optional v2)
- Redirect to dashboard on success
- Link to registration page
- Google OAuth alternative available

### US-3: OAuth Login
**As a** user
**I want to** login with my Google account
**So that** I don't have to remember another password

**Acceptance Criteria:**
- Google button on login/register pages
- Redirect to Google consent screen
- Callback handles token extraction
- Automatic account creation/linking
- Redirect to dashboard on success

### US-4: Protected Routes
**As a** user
**I want** protected pages to require authentication
**So that** my data remains secure

**Acceptance Criteria:**
- Unauthenticated users redirected to login
- No flash of protected content
- Loading state during auth check
- Previous URL remembered for post-login redirect

### US-5: Session Persistence
**As a** user
**I want** my session to persist across page refreshes
**So that** I don't have to login repeatedly

**Acceptance Criteria:**
- Session survives page refresh
- Silent token refresh when expired
- Automatic logout on refresh token expiry
- Clear error message on session end

### US-6: Logout
**As a** logged-in user
**I want to** logout
**So that** I can secure my session on shared devices

**Acceptance Criteria:**
- Logout button accessible in dashboard
- Clears local auth state
- Invalidates server-side token
- Redirects to login page

## Technical Specification

### Pages Structure

```
apps/web/app/
├── (auth)/
│   ├── layout.tsx        # Auth layout (centered, no nav)
│   ├── login/
│   │   └── page.tsx      # Login form
│   ├── register/
│   │   └── page.tsx      # Register form
│   └── callback/
│       └── page.tsx      # OAuth callback handler
├── (dashboard)/
│   ├── layout.tsx        # Dashboard layout (with nav)
│   └── page.tsx          # Dashboard home
└── middleware.ts         # Route protection
```

### Components

```
apps/web/
├── components/
│   └── auth/
│       ├── auth-card.tsx         # (existing)
│       ├── google-button.tsx     # (existing)
│       ├── divider-with-text.tsx # (existing)
│       ├── login-form.tsx        # Login form component
│       ├── register-form.tsx     # Register form component
│       └── auth-guard.tsx        # Client-side auth wrapper
├── lib/
│   ├── api/
│   │   ├── client.ts            # ky HTTP client
│   │   └── auth.ts              # Auth API functions
│   └── stores/
│       └── auth.ts              # Zustand auth store
└── hooks/
    ├── use-auth.ts              # Combined auth hook
    ├── use-login.ts             # Login mutation
    ├── use-register.ts          # Register mutation
    └── use-logout.ts            # Logout mutation
```

### State Management

**Zustand Store:**
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';

  // Actions
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: () => void;
}
```

### API Integration

**Endpoints to integrate:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/register` | POST | Create account |
| `/auth/login` | POST | Get tokens |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/logout` | POST | Invalidate session |
| `/auth/profile` | GET | Get user data |
| `/auth/google` | GET | OAuth initiation |

**Token Storage:**
- Access token: In-memory (Zustand)
- Refresh token: httpOnly cookie (set by API)

### Form Validation

**Login Schema:**
```typescript
const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
```

**Register Schema:**
```typescript
const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain number"),
  name: z.string().optional(),
});
```

### Route Protection

**Middleware (Edge):**
```typescript
// Protected routes
const protectedPaths = ['/dashboard', '/files', '/settings'];

// Auth routes (redirect if logged in)
const authPaths = ['/auth/login', '/auth/register'];
```

**Client Guard:**
- Wraps dashboard layout
- Attempts silent refresh on mount
- Shows skeleton during check
- Redirects on failure

### Error Handling

| Error Code | Message | Action |
|------------|---------|--------|
| 401 | Invalid credentials | Show form error |
| 409 | Email exists | Show form error + link to login |
| 429 | Too many attempts | Show cooldown message |
| 500 | Server error | Show toast + retry option |

### Loading States

1. **Initial load**: Full page skeleton
2. **Form submit**: Button spinner + disabled state
3. **Route change**: Top progress bar
4. **Token refresh**: Silent (no UI)

## UI/UX Design

### Login Page
- Centered card layout
- Logo at top
- Email input
- Password input (with show/hide toggle)
- "Forgot password?" link (non-functional for MVP)
- Submit button
- Divider "or"
- Google button
- "Don't have an account? Register" link

### Register Page
- Centered card layout
- Logo at top
- Name input (optional)
- Email input
- Password input (with strength indicator)
- Submit button
- Divider "or"
- Google button
- "Already have an account? Login" link

### Dashboard
- Top navigation bar
- User avatar + name dropdown
- Logout option in dropdown
- Main content area

## Dependencies

### Required (to add)
```bash
pnpm --filter @cloudvault/web add zustand ky
```

### Already Present
- @tanstack/react-query
- react-hook-form
- zod
- @hookform/resolvers

## Success Metrics

| Metric | Target |
|--------|--------|
| Login form TTI | < 1.5s |
| Auth state hydration | < 100ms |
| Token refresh latency | < 300ms |
| Error rate | < 0.1% |

## Testing Strategy

### Unit Tests
- Zustand store actions
- Form validation schemas
- API client functions

### Integration Tests
- Login flow (happy path)
- Register flow (happy path)
- Token refresh flow
- Error handling

### E2E Tests
- Full login journey
- Full register journey
- OAuth flow
- Session persistence
- Protected route access

## Implementation Order

1. Setup Zustand store
2. Setup ky API client
3. Create auth API functions
4. Implement login page + form
5. Implement register page + form
6. Add middleware protection
7. Create auth guard component
8. Implement OAuth callback
9. Add dashboard layout with logout
10. Test all flows

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cookie not sent (CORS) | Medium | High | Test early, document CORS config |
| Hydration mismatch | Medium | Medium | Proper SSR setup, useEffect guards |
| Token race conditions | Low | High | Request queue pattern |
| OAuth state mismatch | Low | Medium | Verify state parameter |

---

**Author:** Claude (PM-Spec Agent)
**Date:** 2025-01-04
