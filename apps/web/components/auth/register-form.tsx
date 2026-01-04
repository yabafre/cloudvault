'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useRegister, getErrorMessage } from '@/hooks/use-auth'
import { AuthCard, DividerWithText, GoogleButton } from '@/components/auth'
import { getGoogleAuthUrl } from '@/lib/api/auth'

const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
})

type RegisterFormData = z.infer<typeof registerSchema>

// Password strength rules
const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Contains number', test: (p: string) => /[0-9]/.test(p) },
]

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { mutateAsync: register, isPending } = useRegister()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const password = form.watch('password')

  async function onSubmit(data: RegisterFormData) {
    setError(null)
    try {
      await register(data)
      toast.success('Account created!', {
        description: 'Welcome to CloudVault. Your account is ready.',
      })
    } catch (err) {
      const message = await getErrorMessage(err)
      setError(message)
      toast.error('Registration failed', {
        description: message,
      })
    }
  }

  function handleGoogleLogin() {
    window.location.href = getGoogleAuthUrl()
  }

  return (
    <AuthCard
      title="Create an account"
      description="Get started with CloudVault"
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Name (optional)</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            disabled={isPending}
            {...form.register('name')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isPending}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              autoComplete="new-password"
              disabled={isPending}
              {...form.register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="sr-only">
                {showPassword ? 'Hide password' : 'Show password'}
              </span>
            </Button>
          </div>
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}

          {/* Password strength indicator */}
          {password && (
            <div className="space-y-1 pt-2">
              {passwordRules.map((rule) => (
                <div
                  key={rule.label}
                  className="flex items-center gap-2 text-xs"
                >
                  {rule.test(password) ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span
                    className={
                      rule.test(password)
                        ? 'text-green-500'
                        : 'text-muted-foreground'
                    }
                  >
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Spinner className="mr-2" /> : null}
          Create account
        </Button>

        <DividerWithText text="or" />

        <GoogleButton
          onClick={handleGoogleLogin}
          disabled={isPending}
          text="Sign up with Google"
        />

        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
