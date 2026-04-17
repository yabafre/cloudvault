import { z } from '@cloudvault/zod';

// Per PRD FR15: allowed formats — JPG, PNG, PDF, WEBP
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

// Per PRD FR16: 10 MB per-file upper bound
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Blocks path separators, Windows reserved chars, and control characters
const FILENAME_SAFE = /^[^/\\<>:"|?*\x00-\x1f]+$/;

export const uploadIntentSchema = z.object({
  fileName: z.string().min(1).max(255).regex(FILENAME_SAFE),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
});

export type UploadIntentInput = z.infer<typeof uploadIntentSchema>;

export const uploadIntentOutputSchema = z.object({
  fileId: z.string().uuid(),
  url: z.string().url(),
  fields: z.record(z.string(), z.string()),
});

export type UploadIntentOutput = z.infer<typeof uploadIntentOutputSchema>;
