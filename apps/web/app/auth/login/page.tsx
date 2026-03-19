import { LoginForm } from './_components/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - CloudVault',
  description: 'Sign in to your CloudVault account',
};

export default function LoginPage() {
  return <LoginForm />;
}
