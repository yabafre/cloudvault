# ADR-003: Frontend Auth System Restructuring

## Status
PROPOSED

## Context

The frontend authentication system of CloudVault was implemented following ADR-002 (Frontend Authentication Architecture), which defines the technical approach (token storage, state management, route protection). However, the current codebase has diverged from the intended file organization patterns, creating maintainability and scalability issues.

### Current Problems

1. **Scattered Business Logic**: Auth code is spread across 7+ files without clear organization
2. **ADR-002 Non-Compliance**: The actual structure does not match the decided architecture
3. **Duplicate Providers**: `AuthProvider` and `Providers` coexist with unclear responsibilities
4. **Global vs Local Hooks**: All hooks are global when some should be local to specific pages
5. **Inconsistent Folder Structure**: Mixed patterns without clear conventions

### Technical Debt Identified

| Problem | Location | Impact |
|---------|----------|--------|
| LoginForm in global components | `components/auth/login-form.tsx` | Should be in `login/_components/` |
| RegisterForm in global components | `components/auth/register-form.tsx` | Should be in `register/_components/` |
| Monolithic use-auth hook (147 lines) | `hooks/use-auth.ts` | Hard to maintain, tree-shake |
| Duplicate providers | `components/providers/` + `core/providers/` | Code duplication, confusion |
| Duplicate theme-provider | `core/providers/` + `components/common/` | Same component in 2 places |
| API/stores in lib/ instead of core/ | `lib/api/`, `lib/stores/` | Non-conformant to ADR-002 |

### Reference Documents

- **Specification**: `/docs/claude/working-notes/frontend-auth-system.md`
- **Architecture**: ADR-002 (defines token storage, state management patterns)
- **Project Guidelines**: CLAUDE.md

## Decision

Restructure the frontend authentication system to align with ADR-002 patterns and Next.js App Router best practices:

### 1. Adopt "Core + Route-Local" Pattern

**Core (`apps/web/core/auth/`)**: Shared authentication infrastructure
- API client and functions
- Zustand store
- Global hooks (useAuth, useLogout, useProfile)
- AuthGuard component

**Route-Local (`app/auth/{route}/_*`)**: Page-specific code
- Forms specific to each page
- Hooks specific to each page (useLogin, useRegister)
- Server actions if needed

### 2. Single Provider Entry Point

All providers consolidated in `core/providers/index.tsx`:
- ReactQueryProvider
- ThemeProvider (from next-themes directly)
- AuthProvider

Remove duplicate providers from `components/providers/`.

### 3. Hook Decomposition

Split the monolithic `use-auth.ts` (147 lines, 6 hooks) into:

| Hook | Location | Rationale |
|------|----------|-----------|
| `useLogin` | `app/auth/login/_hooks/` | Only used in login page |
| `useRegister` | `app/auth/register/_hooks/` | Only used in register page |
| `useLogout` | `core/auth/hooks/` | Used globally (dashboard, nav) |
| `useProfile` | `core/auth/hooks/` | Used in multiple places |
| `useAuth` | `core/auth/hooks/` | Facade for common auth state |

Each hook should be < 50 lines.

### 4. Target File Structure

```
apps/web/
|-- app/
|   |-- auth/
|   |   |-- layout.tsx
|   |   |-- callback/
|   |   |   |-- _components/
|   |   |   |   +-- callback-content.tsx
|   |   |   +-- page.tsx
|   |   |-- login/
|   |   |   |-- _components/
|   |   |   |   +-- login-form.tsx        # MOVED from components/auth
|   |   |   |-- _hooks/
|   |   |   |   +-- use-login.ts          # EXTRACTED from hooks/use-auth
|   |   |   +-- page.tsx
|   |   +-- register/
|   |       |-- _components/
|   |       |   +-- register-form.tsx     # MOVED from components/auth
|   |       |-- _hooks/
|   |       |   +-- use-register.ts       # EXTRACTED from hooks/use-auth
|   |       +-- page.tsx
|   |-- dashboard/
|   |   |-- layout.tsx                    # Uses AuthGuard from core/
|   |   +-- page.tsx
|   +-- layout.tsx                        # Uses providers from core/
|
|-- components/
|   |-- auth/                             # REUSABLE components only
|   |   |-- auth-card.tsx
|   |   |-- divider-with-text.tsx
|   |   |-- google-button.tsx
|   |   +-- index.ts
|   +-- ui/                               # shadcn/ui (unchanged)
|
|-- core/
|   |-- auth/
|   |   |-- api/
|   |   |   |-- client.ts                 # MOVED from lib/api
|   |   |   +-- auth.ts                   # MOVED from lib/api
|   |   |-- stores/
|   |   |   +-- auth.ts                   # MOVED from lib/stores
|   |   |-- hooks/
|   |   |   |-- use-auth.ts               # Simplified facade
|   |   |   |-- use-logout.ts             # EXTRACTED
|   |   |   +-- use-profile.ts            # EXTRACTED
|   |   +-- components/
|   |       +-- auth-guard.tsx            # MOVED from components/auth
|   +-- providers/
|       |-- index.tsx                     # Single entry point
|       |-- react-query.tsx
|       +-- auth-provider.tsx             # MOVED from components/providers
|
|-- hooks/
|   |-- use-auth.ts                       # Re-export from core (backward compat)
|   +-- use-mobile.ts
|
+-- proxy.ts
```

## Consequences

### Positive

- **Maintainability**: Clear separation between core and route-specific code
- **Scalability**: Adding new auth features (2FA, password reset) follows clear pattern
- **Developer Experience**: New developers understand structure quickly (< 15 min)
- **Bundle Size**: Tree-shaking works better with smaller, focused modules
- **ADR Compliance**: Code matches documented architecture

### Negative

- **Migration Effort**: Estimated 3-5 days of refactoring work
- **Breaking Imports**: Existing imports will break temporarily
- **Testing Updates**: Test paths need updating

### Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Circular imports between core and hooks | Use dynamic imports or careful module ordering |
| SSR hydration issues | AuthProvider already handles Zustand hydration |
| Breaking existing functionality | Phase migration with re-exports for backward compatibility |
| Tests breaking | Update test paths in same PR as migrations |

## Alternatives Considered

### Option A: Keep Current Structure

- **Pros**: No migration effort
- **Cons**: Technical debt accumulates, harder to maintain
- **Rejected**: Technical debt is already causing issues

### Option B: Full Feature-Based Architecture

Structure everything by feature domain (`features/auth/`, `features/files/`).

- **Pros**: Complete feature isolation
- **Cons**: Overkill for current project size, requires significant restructuring
- **Rejected**: Too much overhead for current phase

### Option C (Chosen): Core + Route-Local Hybrid

Balance between global shared code and route-specific implementations.

- **Pros**: Follows Next.js App Router patterns, pragmatic migration
- **Cons**: Some judgment calls on what goes where
- **Chosen**: Best balance of benefits vs migration cost

## Implementation

### Phase 1: Preparation (0.5 day)

1. Create folder structure in `core/auth/`
2. Add `_components/` and `_hooks/` folders in login/ and register/

### Phase 2: Core Migration (1 day)

1. Move `lib/api/client.ts` to `core/auth/api/client.ts`
2. Move `lib/api/auth.ts` to `core/auth/api/auth.ts`
3. Move `lib/stores/auth.ts` to `core/auth/stores/auth.ts`
4. Update all imports

### Phase 3: Hook Decomposition (1 day)

1. Extract `useLogin` to `app/auth/login/_hooks/use-login.ts`
2. Extract `useRegister` to `app/auth/register/_hooks/use-register.ts`
3. Extract `useLogout` to `core/auth/hooks/use-logout.ts`
4. Extract `useProfile` to `core/auth/hooks/use-profile.ts`
5. Simplify `core/auth/hooks/use-auth.ts` as facade

### Phase 4: Component Migration (1 day)

1. Move `login-form.tsx` to `app/auth/login/_components/`
2. Move `register-form.tsx` to `app/auth/register/_components/`
3. Move `auth-guard.tsx` to `core/auth/components/`
4. Update page imports

### Phase 5: Cleanup (0.5 day)

1. Remove old files from `lib/`
2. Update `components/auth/index.ts` (keep only reusable components)
3. Remove `components/providers/`
4. Remove duplicate theme-provider
5. Update `app/layout.tsx` to use `core/providers`

### Phase 6: Validation (1 day)

1. Verify application starts
2. Test login flow (email + Google OAuth)
3. Test register flow
4. Test protected routes
5. Verify production build

### Performance Budget

- **API Response**: No change (frontend restructuring only)
- **Bundle Impact**: Expected reduction due to better tree-shaking
- **Initial Load**: No degradation expected

### Security

No security changes - this is a structural refactoring only:
- Access token storage (in-memory Zustand) unchanged
- Refresh token storage (httpOnly cookie) unchanged
- Route protection logic unchanged

## Diagram

```
Before Restructuring:
+-------------------+     +------------------+     +----------------+
| components/auth/  |     | lib/api/         |     | hooks/         |
| - login-form      |     | - client.ts      |     | - use-auth.ts  |
| - register-form   |     | - auth.ts        |     |   (147 lines)  |
| - auth-guard      |     +------------------+     +----------------+
+-------------------+              |                       |
         |                         v                       |
         |               +------------------+              |
         +-------------->| lib/stores/      |<-------------+
                         | - auth.ts        |
                         +------------------+

After Restructuring:
+----------------------+
|       core/auth/     |
| +------------------+ |     +-------------------------+
| | api/             | |     | app/auth/login/         |
| | - client.ts      | |     | +---------------------+ |
| | - auth.ts        | |     | | _components/        | |
| +------------------+ |     | | - login-form.tsx    | |
| +------------------+ |     | +---------------------+ |
| | stores/          | |     | +---------------------+ |
| | - auth.ts        | |     | | _hooks/             | |
| +------------------+ |     | | - use-login.ts      | |
| +------------------+ |     | +---------------------+ |
| | hooks/           | |     +-------------------------+
| | - use-auth.ts    | |
| | - use-logout.ts  | |     +-------------------------+
| | - use-profile.ts | |     | app/auth/register/      |
| +------------------+ |     | +---------------------+ |
| +------------------+ |     | | _components/        | |
| | components/      | |     | | - register-form.tsx | |
| | - auth-guard.tsx | |     | +---------------------+ |
| +------------------+ |     | +---------------------+ |
+----------------------+     | | _hooks/             | |
                             | | - use-register.ts   | |
                             | +---------------------+ |
                             +-------------------------+
```

## References

- Specification: `docs/claude/working-notes/frontend-auth-system.md`
- ADR-002: Frontend Auth Architecture (token storage, state management)
- CLAUDE.md: Project guidelines and patterns

---

**Author:** Claude (Architect Agent)
**Date:** 2026-01-05
**Supersedes:** None (complements ADR-002)
