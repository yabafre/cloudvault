import { z } from '@cloudvault/zod'

// Schema de login
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
})
export type LoginInput = z.infer<typeof loginSchema>

// Schema d'inscription
export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
})
export type RegisterInput = z.infer<typeof registerSchema>

// Schema utilisateur (reponse API)
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})
export type User = z.infer<typeof userSchema>

// Schema de session
export const sessionSchema = z.object({
  user: userSchema.nullable(),
  isAuthenticated: z.boolean(),
})
export type Session = z.infer<typeof sessionSchema>

// Schema tokens (interne aux actions)
export const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})
export type Tokens = z.infer<typeof tokensSchema>

// Schema reponse auth
export const authResponseSchema = z.object({
  user: userSchema,
  tokens: tokensSchema,
})
export type AuthResponse = z.infer<typeof authResponseSchema>
