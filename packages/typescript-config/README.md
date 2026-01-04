# @cloudvault/typescript-config

Shared TypeScript configurations for the Booker monorepo.

## Overview

This package provides consistent TypeScript compiler configurations across all apps and packages in the Booker monorepo. It includes optimized configurations for Next.js, NestJS, and base TypeScript projects.

## Configurations

### Base Configuration

Foundation for all TypeScript projects with strict type checking.

**File:** `base.json`

**Features:**
- Strict mode enabled
- ES2022 target
- ESNext module system
- Path mapping support
- Source maps enabled

**Usage:**

```json
{
  "extends": "@cloudvault/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Next.js Configuration

Optimized for Next.js applications.

**File:** `next.json`

**Features:**
- JSX support (preserve for Next.js)
- Incremental builds
- ESNext lib and module
- Paths configured for Next.js app structure

**Usage:**

```json
{
  "extends": "@cloudvault/typescript-config/next.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### NestJS Configuration

Optimized for NestJS backend applications.

**File:** `nest.json`

**Features:**
- ES2022 target
- CommonJS modules
- Decorators enabled
- ESNext lib support
- Strict null checks

**Usage:**

```json
{
  "extends": "@cloudvault/typescript-config/nest.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

## Compiler Options

### Strict Type Checking

All configurations enable strict type checking:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true
}
```

### Module Resolution

```json
{
  "moduleResolution": "node",
  "esModuleInterop": true,
  "allowSyntheticDefaultImports": true,
  "resolveJsonModule": true
}
```

### Code Quality

```json
{
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "forceConsistentCasingInFileNames": true
}
```

## Path Mapping

All configurations support path mapping for cleaner imports:

```json
{
  "paths": {
    "@/*": ["./*"],
    "@components/*": ["./components/*"],
    "@lib/*": ["./lib/*"],
    "@core/*": ["./core/*"]
  }
}
```

## Customization

To extend or override options in your project:

```json
{
  "extends": "@cloudvault/typescript-config/base.json",
  "compilerOptions": {
    // Your custom options
    "baseUrl": ".",
    "paths": {
      "@custom/*": ["./custom/*"]
    }
  }
}
```

## Usage Examples

### Next.js App (apps/web)

```json
{
  "extends": "@cloudvault/typescript-config/next.json",
  "compilerOptions": {
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### NestJS API (apps/api)

```json
{
  "extends": "@cloudvault/typescript-config/nest.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

### Shared Library Package

```json
{
  "extends": "@cloudvault/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declarationMap": true,
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## Type Checking

Run type checking in your project:

```bash
# Check types without emitting files
tsc --noEmit

# Watch mode
tsc --noEmit --watch

# Check specific file
tsc --noEmit path/to/file.ts
```

## Common Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch",
    "build": "tsc"
  }
}
```

## Benefits

1. **Consistency**: Same TypeScript settings across all projects
2. **Type Safety**: Strict mode catches errors early
3. **Better DX**: Path mapping for cleaner imports
4. **Maintainability**: Update configs in one place
5. **Performance**: Optimized for each framework

## Troubleshooting

### Module not found errors

Ensure your `tsconfig.json` has correct `baseUrl` and `paths`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Type checking too slow

Enable incremental builds:

```json
{
  "compilerOptions": {
    "incremental": true
  }
}
```

### Declaration files not generated

Add declaration options:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  }
}
```

## Version

**Current Version:** 0.0.0

## License

MIT

---

**Maintained by:** Brainst Team
