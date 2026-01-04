# @cloudvault/eslint-config

Shared ESLint configurations for the Booker monorepo.

## Overview

This package provides consistent ESLint configurations across all apps and packages in the Booker monorepo. It includes configurations for Next.js, NestJS, and base TypeScript projects.

## Configurations

### Base Configuration

Common rules for all TypeScript projects.

**File:** `base.js`

**Usage:**

```javascript
// .eslintrc.js
module.exports = {
  extends: ['@cloudvault/eslint-config/base'],
};
```

**Includes:**
- TypeScript ESLint parser and plugin
- Prettier integration
- Common TypeScript rules

### Next.js Configuration

Optimized for Next.js applications with React.

**File:** `next.js`

**Usage:**

```javascript
// apps/web/.eslintrc.js
module.exports = {
  extends: ['@cloudvault/eslint-config/next'],
};
```

**Includes:**
- Base configuration
- Next.js plugin
- React hooks rules
- React specific rules

### NestJS Configuration

Optimized for NestJS backend applications.

**File:** `nest.js`

**Usage:**

```javascript
// apps/api/.eslintrc.js
module.exports = {
  extends: ['@cloudvault/eslint-config/nest'],
};
```

**Includes:**
- Base configuration
- Node.js specific rules
- NestJS best practices

### Library Configuration

For shared libraries and packages.

**File:** `library.js`

**Usage:**

```javascript
// packages/shared/.eslintrc.js
module.exports = {
  extends: ['@cloudvault/eslint-config/library'],
};
```

## Key Rules

### TypeScript

- `@typescript-eslint/no-explicit-any`: Error - Prevent use of `any`
- `@typescript-eslint/no-unused-vars`: Warn - Flag unused variables
- `@typescript-eslint/explicit-function-return-type`: Off - Allow inference

### Code Quality

- `no-console`: Warn - Prefer proper logging
- `eqeqeq`: Error - Require strict equality
- `prefer-const`: Error - Use const when possible

### React (Next.js only)

- `react/react-in-jsx-scope`: Off - Not needed in Next.js
- `react-hooks/rules-of-hooks`: Error - Enforce hooks rules
- `react-hooks/exhaustive-deps`: Warn - Check hook dependencies

## Prettier Integration

All configurations include Prettier integration via `eslint-config-prettier` to avoid conflicts between ESLint and Prettier.

## Customization

To extend or override rules in your project:

```javascript
// .eslintrc.js
module.exports = {
  extends: ['@cloudvault/eslint-config/next'],
  rules: {
    // Your custom rules
    'no-console': 'off', // Allow console in this project
  },
};
```

## Scripts

Common scripts to add to your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix"
  }
}
```

## Dependencies

This package depends on:

- `eslint` (v8.57.1)
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `eslint-config-prettier`
- `eslint-plugin-prettier`
- `eslint-config-turbo`

## Version

**Current Version:** 0.0.0

## License

MIT

---

**Maintained by:** Brainst Team
