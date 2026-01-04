import { RegisterForm } from '@/components/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account - CloudVault',
  description: 'Create your CloudVault account to start storing files securely',
}

export default function RegisterPage() {
  return <RegisterForm />
}
