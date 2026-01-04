# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- ZSA Server Actions architecture for authentication (#auth-zsa-restructure)
  - Server Actions as secure proxy to NestJS backend
  - Shared Zod schemas between actions and forms (`lib/schemas/auth.schema.ts`)
  - TanStack Query integration via `zsa-react-query`
  - httpOnly cookie-based token storage
  - New files: `lib/actions/auth/*.action.ts`, `lib/actions/action-client.ts`

### Changed
- **BREAKING**: Authentication system migrated from direct API calls to Server Actions
  - `lib/api/auth.ts` replaced by `lib/actions/auth/*.action.ts`
  - Auth store simplified to user state only (tokens removed from client-side)
  - `useAuth` hook now uses TanStack Query with ZSA mutations
  - AuthProvider uses `getSessionAction` for session restoration

### Security
- Access and refresh tokens now stored in httpOnly cookies (not accessible via JavaScript)
- Token refresh handled server-side automatically
- Removed token exposure in client-side localStorage

## [0.1.0] - 2025-12-31

### Added
- Initial project setup with Turborepo monorepo
- NestJS backend with Prisma ORM and PostgreSQL
- Next.js 16 frontend with App Router and React 19
- User authentication (JWT access tokens + refresh tokens)
- Google OAuth integration
- Basic dashboard layout
- Landing page with hero section
- Login and registration forms with validation
- Protected routes with AuthGuard component
- Zustand store for auth state management
- ky HTTP client with auto token refresh
