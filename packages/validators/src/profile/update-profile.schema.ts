import { z } from '@cloudvault/zod';

export const profileOutputSchema = z.object({
  id: z.string(),
  email: z.email(),
  displayName: z.string().nullable(),
  createdAt: z.string(),
});

export type ProfileOutput = z.infer<typeof profileOutputSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateProfileOutputSchema = profileOutputSchema;

export type UpdateProfileOutput = z.infer<typeof updateProfileOutputSchema>;
