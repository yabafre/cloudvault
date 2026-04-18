import { z } from '@cloudvault/zod';
import { paginationSchema } from '../common/index.js';

export const listFilesSchema = paginationSchema;

export type ListFilesInput = z.infer<typeof listFilesSchema>;

const fileOutputSchema = z.object({
  id: z.string().uuid(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  status: z.enum(['PENDING', 'READY', 'FAILED']),
  thumbnailUrl: z.string().nullable(),
  createdAt: z.string(),
});

export const listFilesOutputSchema = z.object({
  items: z.array(fileOutputSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type ListFilesOutput = z.infer<typeof listFilesOutputSchema>;

export { fileOutputSchema };
