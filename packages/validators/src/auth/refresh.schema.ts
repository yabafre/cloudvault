import { z } from '@cloudvault/zod';

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshInput = z.infer<typeof refreshSchema>;

export const refreshOutputSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type RefreshOutput = z.infer<typeof refreshOutputSchema>;
