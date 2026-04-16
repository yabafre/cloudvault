import { z } from '@cloudvault/zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  provider: z.enum(['LOCAL', 'GOOGLE']),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const loginOutputSchema = z.object({
  user: userSchema,
  tokens: tokensSchema,
});

export type LoginOutput = z.infer<typeof loginOutputSchema>;

// Re-export shared sub-schemas for reuse in register
export { userSchema, tokensSchema };
