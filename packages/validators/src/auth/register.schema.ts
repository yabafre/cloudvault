import { z } from '@cloudvault/zod';
import { userSchema, tokensSchema } from './login.schema';

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerOutputSchema = z.object({
  user: userSchema,
  tokens: tokensSchema,
});

export type RegisterOutput = z.infer<typeof registerOutputSchema>;
