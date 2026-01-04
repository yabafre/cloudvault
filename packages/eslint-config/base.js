// package: @cloudvault/eslint-config/base.js
/** @type {import("eslint").Linter.Config} */
const turboConfig = require('eslint-config-turbo').default || {};

module.exports = {
  root: true,
  ...turboConfig,
  extends: [
    ...(turboConfig.extends || []),
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
  ],
  plugins: [...(turboConfig.plugins || []), '@typescript-eslint/eslint-plugin'],
  parser: '@typescript-eslint/parser',
  ignorePatterns: [
    '.*.js',
    '*.setup.js',
    '*.config.js',
    '.turbo/',
    'dist/',
    'coverage/',
    'node_modules/',
    '.husky/',
  ],
};
