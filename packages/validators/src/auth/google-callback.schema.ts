import { z } from '@cloudvault/zod';

export const googleCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
});

export type GoogleCallbackInput = z.infer<typeof googleCallbackSchema>;
