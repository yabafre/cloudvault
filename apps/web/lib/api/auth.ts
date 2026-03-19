import { api, getErrorMessage } from './client'
import type {
  User,
  AuthResponse,
  LoginDto,
  RegisterDto,
  Tokens
} from '@cloudvault/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name?: string
}

/**
 * Register a new user
 */
export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  return api.post('auth/register', {
    json: credentials,
  }).json<AuthResponse>()
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  return api.post('auth/login', {
    json: credentials,
  }).json<AuthResponse>()
}

/**
 * Refresh access token using httpOnly cookie
 */
export async function refreshToken(): Promise<Tokens> {
  return api.post('auth/refresh').json<Tokens>()
}

/**
 * Logout user - invalidates refresh token
 */
export async function logout(): Promise<void> {
  await api.post('auth/logout')
}

/**
 * Get current user profile
 */
export async function getProfile(): Promise<User> {
  return api.get('auth/profile').json<User>()
}

/**
 * Initiate Google OAuth - returns redirect URL
 */
export function getGoogleAuthUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  return `${apiUrl}/auth/google`
}

export { getErrorMessage }
