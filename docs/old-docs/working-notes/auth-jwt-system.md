# Authentication System - JWT with Auto-Refresh

## Status: IMPLEMENTED

This document describes the complete authentication system implemented in CloudVault.

## Features

- JWT Access Token (15min expiry by default, configurable)
- JWT Refresh Token (30 days expiry, stored in database)
- Email/Password authentication with bcrypt hashing (12 rounds)
- Google OAuth 2.0 integration
- Global JWT guard with `@Public()` decorator bypass
- Automatic token rotation on refresh

## Architecture

### Components

```
apps/api/src/modules/auth/
├── auth.module.ts          # Module configuration
├── auth.service.ts         # Business logic
├── auth.controller.ts      # API endpoints
├── dto/
│   ├── register.dto.ts     # Registration validation
│   ├── login.dto.ts        # Login validation
│   └── tokens.dto.ts       # Token response
├── strategies/
│   ├── jwt.strategy.ts     # Access token validation
│   ├── jwt-refresh.strategy.ts  # Refresh token validation
│   ├── local.strategy.ts   # Email/password validation
│   └── google.strategy.ts  # Google OAuth
├── guards/
│   ├── jwt-auth.guard.ts   # Global guard with @Public() support
│   ├── jwt-refresh.guard.ts
│   ├── local-auth.guard.ts
│   └── google-auth.guard.ts
└── decorators/
    ├── public.decorator.ts    # Bypass auth
    └── current-user.decorator.ts  # Extract user from request
```

### Database Models

```prisma
model User {
  id            String       @id @default(uuid())
  email         String       @unique
  password      String?      // Nullable for OAuth users
  name          String?
  avatar        String?
  provider      AuthProvider @default(LOCAL)
  providerId    String?      // Google ID
  emailVerified Boolean      @default(false)
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(...)
  expiresAt DateTime
  createdAt DateTime @default(now())
  revokedAt DateTime?
}
```

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new user account |
| POST | `/auth/login` | Login with email/password |
| GET | `/auth/google` | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | Google OAuth callback |

### Protected Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout (revoke tokens) |
| GET | `/auth/profile` | Get current user profile |

## Token Flow

### Registration/Login

```
Client                    API                      Database
  |                        |                          |
  |-- POST /auth/register -->                         |
  |                        |-- Create user ----------->|
  |                        |-- Create refresh token -->|
  |<-- { user, tokens } ---|                          |
```

### Token Refresh

```
Client                    API                      Database
  |                        |                          |
  |-- POST /auth/refresh -->                          |
  |   (refreshToken body)  |                          |
  |                        |-- Validate JWT --------->|
  |                        |-- Check DB token ------->|
  |                        |-- Revoke old token ----->|
  |                        |-- Create new tokens ---->|
  |<-- { user, tokens } ---|                          |
```

### Auto-Refresh Pattern (Frontend)

```typescript
// Recommended frontend implementation
async function fetchWithAuth(url: string, options: RequestInit) {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  if (response.status === 401) {
    // Token expired, try refresh
    const refreshed = await refreshTokens();
    if (refreshed) {
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });
    }
  }

  return response;
}
```

## Security Considerations

1. **Password Hashing**: bcrypt with 12 salt rounds
2. **JWT Secret**: Stored in environment variable, never committed
3. **Refresh Token Storage**: UUIDs stored in database, signed in JWT
4. **Token Revocation**: Refresh tokens can be revoked individually or all at once
5. **OAuth Linking**: Existing email accounts are linked to Google on first OAuth login

## Environment Variables

```env
# Required
JWT_SECRET=<strong-random-string>
JWT_EXPIRES_IN=15m

# For Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# Frontend redirect
FRONTEND_URL=http://localhost:3000
```

## Usage Examples

### Protecting Routes (Default)

```typescript
@Controller('files')
export class FilesController {
  @Get()
  getFiles(@CurrentUser('id') userId: string) {
    // JWT required, userId extracted from token
  }
}
```

### Making Routes Public

```typescript
import { Public } from '@/modules/auth/decorators';

@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

### Getting Current User

```typescript
import { CurrentUser } from '@/modules/auth/decorators';

@Get('profile')
getProfile(@CurrentUser() user: AuthenticatedUser) {
  // Full user object
}

@Get('files')
getFiles(@CurrentUser('id') userId: string) {
  // Just the user ID
}
```

## Testing the API

```bash
# Register
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecureP@ss123","name":"Test User"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecureP@ss123"}'

# Refresh (replace with actual token)
curl -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'

# Get Profile
curl http://localhost:4000/auth/profile \
  -H "Authorization: Bearer <access_token>"
```

## Swagger Documentation

Available at: `http://localhost:4000/api` when the API is running.
