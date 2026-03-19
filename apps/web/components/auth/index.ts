// Reusable auth UI components (shared across auth pages)
export { AuthCard } from './auth-card';
export { DividerWithText } from './divider-with-text';
export { GoogleButton } from './google-button';

// Re-exports from core/auth for backward compatibility
// These should be imported from @/core/auth instead
export { AuthGuard, GuestGuard } from '@/core/auth/components/auth-guard';

// DEPRECATED: Forms are now local to their pages
// Use @/app/auth/login/_components/login-form and @/app/auth/register/_components/register-form instead
export { LoginForm } from '@/app/auth/login/_components/login-form';
export { RegisterForm } from '@/app/auth/register/_components/register-form';
