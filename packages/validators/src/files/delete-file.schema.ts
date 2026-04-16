import { z } from '@cloudvault/zod';

export const deleteFileSchema = z.object({
  fileId: z.string().uuid(),
});

export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
