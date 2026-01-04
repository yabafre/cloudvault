// apps/web/.eslintrc.js

/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: ['@cloudvault/eslint-config/next.js'],
  plugins: ['@typescript-eslint'],
};

