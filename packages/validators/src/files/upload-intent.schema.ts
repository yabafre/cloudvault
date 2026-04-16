import { z } from '@cloudvault/zod';

export const uploadIntentSchema = z.object({
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
});

export type UploadIntentInput = z.infer<typeof uploadIntentSchema>;

export const uploadIntentOutputSchema = z.object({
  fileId: z.string().uuid(),
  url: z.string().url(),
  fields: z.record(z.string(), z.string()),
});

export type UploadIntentOutput = z.infer<typeof uploadIntentOutputSchema>;
