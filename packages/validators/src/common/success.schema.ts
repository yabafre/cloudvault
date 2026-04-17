import { z } from '@cloudvault/zod';

export const successOutputSchema = z.object({
  success: z.literal(true),
});

export type SuccessOutput = z.infer<typeof successOutputSchema>;

export const voidOutputSchema = z.void();
