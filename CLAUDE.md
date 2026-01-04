# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CloudVault** is a secure file storage and sharing platform built with a modern TypeScript stack and deployed on AWS. This is a monorepo project demonstrating full-stack cloud architecture with CI/CD, monitoring, and DevOps best practices.

**Primary Stack:**
- Backend: NestJS (TypeScript) with Prisma ORM + PostgreSQL
- Frontend: Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- Infrastructure: AWS (S3, Lambda, EC2), Cloudflare (CDN/WAF)
- Tooling: Turborepo, pnpm, Docker

## Essential Commands

### Development Workflow
```bash
# Install dependencies (use pnpm only)
pnpm install

# Start all services in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests across monorepo
pnpm test

# Lint code
pnpm lint

# Format code with Prettier
pnpm format

# Clean build artifacts and node_modules
pnpm clean
```

### Prisma Commands (from root)
```bash
# All Prisma commands must be run from the root of the monorepo
pnpm db:generate      # Generate Prisma client after schema changes
pnpm db:migrate       # Create and apply migrations (dev)
pnpm db:migrate:prod  # Deploy migrations (production)
pnpm db:studio        # GUI database interface
pnpm db:push          # Push schema without migration
pnpm db:reset         # Reset database (deletes all data)
```

### API-Specific Commands
```bash
# From root (recommended)
pnpm dev:api    # Development with watch mode
pnpm build:api  # Production build
pnpm test:api   # Run tests

# Or from apps/api/
cd apps/api && pnpm dev
```

### Web-Specific Commands (apps/web/)
```bash
cd apps/web

# Development server (port 3000)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start
```

## Architecture & Structure

### Monorepo Organization

**Turborepo Configuration:**
- Build tasks have dependencies (`^build` ensures packages build before apps)
- Dev mode is persistent and uncached for hot-reload
- Test tasks depend on build completion
- Uses TUI (Terminal UI) for better developer experience

**Workspace Structure:**
```
apps/
├── api/              # NestJS backend (port 4000)
│   ├── prisma/
│   │   └── schema.prisma     # Database schema (User, File, RefreshToken)
│   ├── src/
│   │   ├── main.ts           # Bootstrap (CORS, ValidationPipe, Swagger)
│   │   ├── app.module.ts     # Root module (imports AuthModule, PrismaModule)
│   │   ├── prisma/           # Prisma module
│   │   │   ├── prisma.module.ts  # Global module
│   │   │   ├── prisma.service.ts # PrismaClient wrapper
│   │   │   └── index.ts          # Barrel export
│   │   └── modules/
│   │       └── auth/         # Authentication module
│   │           ├── auth.module.ts
│   │           ├── auth.service.ts
│   │           ├── auth.controller.ts
│   │           ├── dto/          # RegisterDto, LoginDto, TokensDto
│   │           ├── guards/       # JwtAuthGuard, LocalAuthGuard, GoogleAuthGuard
│   │           ├── strategies/   # JWT, Local, Google strategies
│   │           └── decorators/   # @Public(), @CurrentUser()
│   └── test/                 # E2E tests
│
└── web/              # Next.js 16 frontend (port 3000)
    ├── app/              # App Router structure
    │   ├── layout.tsx        # Root layout with providers
    │   ├── page.tsx          # Homepage/landing page
    │   ├── auth/             # Auth pages (login, register, callback)
    │   └── dashboard/        # Protected dashboard
    ├── components/
    │   ├── ui/               # shadcn/ui components
    │   ├── auth/             # Auth forms and guards
    │   ├── dashboard/        # Dashboard components
    │   └── providers/        # React context providers
    ├── lib/
    │   ├── stores/           # Zustand stores
    │   └── api/              # API client and endpoints
    ├── hooks/                # Custom React hooks global
    └── proxy.ts              # Next.js 16 edge proxy

packages/
├── eslint-config/    # Shared ESLint configuration
├── typescript-config/ # Shared TypeScript configs
└── types/            # Shared TypeScript type definitions
    └── src/index.ts  # Export shared types from here

lambdas/
└── thumbnail-generator/  # Python Lambda for image processing
    ├── handler.py        # S3 trigger -> thumbnail generation
    └── requirements.txt  # Pillow, boto3

infra/
└── scripts/          # Deployment and infrastructure scripts
```

### Key Architectural Decisions

**1. Workspace Dependencies:**
- Packages use `workspace:*` protocol for internal dependencies
- API and Web apps reference shared packages: `@cloudvault/types`, `@cloudvault/eslint-config`, `@cloudvault/typescript-config`

**2. Backend Architecture (NestJS):**
- Port: 4000 (configured via `API_PORT` env var)
- Module-based architecture following NestJS patterns
- **Path Aliases:** `@/*` maps to `src/*` for cleaner imports
- **Prisma ORM:** Global PrismaModule provides injectable PrismaService
- **Database Models:** User, File, RefreshToken
- **Authentication:** JWT + Refresh tokens, Google OAuth, bcrypt password hashing
- **Global Guard:** JwtAuthGuard applied globally, use `@Public()` to bypass
- **Upcoming features:** AWS S3 SDK integration, file upload

**3. Frontend Architecture (Next.js 16):**
- Uses App Router (not Pages Router)
- React Server Components by default
- Tailwind CSS 4 for styling with dark mode support
- **State Management:** Zustand with localStorage persistence
- **API Client:** ky with automatic token refresh
- **Forms:** react-hook-form + zod validation
- **UI Components:** shadcn/ui (Radix + Tailwind)
- **Routing Protection:** proxy.ts (Next.js 16) + AuthGuard component

**4. Shared Types Package:**
- Central location for TypeScript interfaces/types shared between frontend and backend
- Prevents type drift and ensures API contract consistency
- Export all shared types from `packages/types/src/index.ts`

**5. Lambda Functions:**
- Python-based for AWS Lambda compatibility
- Thumbnail generator: S3 ObjectCreated trigger → generates 200x200 thumbnails → stores in `thumbnails/` prefix
- Uses Pillow for image processing, boto3 for S3 operations

## Development Guidelines

### Package Manager
**CRITICAL:** This project uses `pnpm` exclusively. Do not use `npm` or `yarn`.
- pnpm version: ≥9.0.0
- Node version: ≥20.0.0

### Environment Configuration
There is a **single `.env` file at the root** of the monorepo (Turborepo pattern):
```bash
# Set up from example
cp .env.example .env
```

**Important:**
- All root-level commands use `dotenv-cli` to load `.env` automatically
- NestJS uses `@nestjs/config` with `ConfigModule.forRoot({ envFilePath: '../../.env' })`
- Do NOT create `.env` files in `apps/api/` or `apps/web/`

### Adding New Dependencies
```bash
# To specific workspace
pnpm --filter @cloudvault/api add <package>
pnpm --filter @cloudvault/web add <package>

# To root (for tooling only)
pnpm add -w <package>
```

### ESLint Configuration Issues
**Known Issue:** The project currently has peer dependency warnings with ESLint 9 and various plugins expecting ESLint 8. This is a common issue in the ecosystem transition to ESLint 9.

**When adding ESLint rules:**
- ESLint config is centralized in `packages/eslint-config/`
- Shared configs: `base.js`, `library.js`, `nest.js`, `next.js`, `react-internal.js`
- Uses `@vercel/style-guide` as base with customizations

### Testing Strategy
- **Backend:** Jest with ts-jest transformer, tests co-located with source (`*.spec.ts`)
- **Frontend:** Testing setup TBD (Next.js project ready for testing library integration)
- **E2E:** Separate directory `apps/api/test/` for end-to-end tests

### TypeScript Configuration
- Shared configs in `packages/typescript-config/`
- Strict mode enabled
- Use `@cloudvault/types` for cross-package type sharing

## AWS Integration Notes

**Current State:** Infrastructure setup in progress
- S3 bucket for file storage (to be configured)
- Lambda thumbnail generator ready for deployment
- EC2 planned for API hosting
- Cloudflare integration planned for DNS/CDN/WAF

**When implementing AWS features:**
- Use AWS SDK v3 (modern, tree-shakeable)
- Configure credentials via environment variables
- S3 pre-signed URLs should expire in 15 minutes (per security requirements)

## CI/CD

GitHub Actions workflows exist but are placeholders:
- `.github/workflows/ci.yml` - Continuous integration
- `.github/workflows/deploy.yml` - Deployment pipeline

These should be implemented to run `pnpm lint`, `pnpm test`, `pnpm build`.

## Feature Roadmap Context

**MVP v1.0 (In Progress):**
- [x] User authentication (register/login with JWT + refresh tokens)
- [x] Google OAuth integration
- [x] Frontend auth system (login, register, logout, protected routes)
- [x] Homepage/landing page
- [ ] File upload to S3 with pre-signed URLs
- [ ] File listing and deletion
- [ ] Automatic thumbnail generation
- [ ] User dashboard with file management

**v2.0 (Future):**
- File sharing (public/private links)
- Folder organization
- Usage statistics and quotas
- Automated cleanup workers
- Advanced metrics and alerting

## Important Patterns

### Using Prisma in Services
```typescript
// Any service can inject PrismaService (global module)
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: { email: string; password: string; name?: string }) {
    return this.prisma.user.create({ data });
  }
}
```

### Adding a New NestJS Module
```typescript
// 1. Generate with NestJS CLI (from apps/api/)
nest generate module <name>
nest generate controller <name>
nest generate service <name>

// 2. Import in app.module.ts
@Module({
  imports: [NewModule],
  // ...
})
```

### Adding Shared Types
```typescript
// In packages/types/src/index.ts
export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

// In API (apps/api/src/)
import { FileMetadata } from '@cloudvault/types';

// In Web (apps/web/app/)
import { FileMetadata } from '@cloudvault/types';
```

### Turborepo Task Dependencies
If adding new build steps, update `turbo.json`:
```json
{
  "tasks": {
    "your-task": {
      "dependsOn": ["^build"],  // Run after dependencies build
      "outputs": ["dist/**"],   // Cache these outputs
      "cache": true             // Enable caching
    }
  }
}
```

### Backend Authentication Patterns

```typescript
// Protecting routes (default behavior - JWT required)
@Controller('files')
export class FilesController {
  @Get()
  getFiles(@CurrentUser('id') userId: string) {
    // userId is extracted from JWT
  }
}

// Making routes public
import { Public } from '@/modules/auth/decorators';

@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}

// Getting current user in controllers
import { CurrentUser } from '@/modules/auth/decorators';

@Get('profile')
getProfile(@CurrentUser() user: any) {
  // Full user object
}

@Get('files')
getFiles(@CurrentUser('id') userId: string) {
  // Just the user ID
}
```

## Troubleshooting

**"Command not found: turbo"**
→ Run `pnpm install` at root

**"Cannot find module '@cloudvault/types'"**
→ Run `pnpm install` to link workspace dependencies

**"Prisma client not found"**
→ Run `pnpm db:generate` from the root of the monorepo

**"Database connection refused"**
→ Ensure PostgreSQL is running locally. Create the database if needed:
  `psql -U postgres -c "CREATE DATABASE cloudvault;"`
→ Then run migrations: `pnpm db:migrate`

**Port conflicts**
→ API runs on port 4000, Web on port 3000. Check `API_PORT` env var if conflicts occur

**ESLint peer dependency warnings**
→ Known issue with ESLint 9 migration, safe to ignore warnings if linting works
