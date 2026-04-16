import { z } from '@cloudvault/zod';

export const dashboardStatsOutputSchema = z.object({
  fileCount: z.number(),
  bytesUsed: z.number(),
  bytesTotal: z.number(),
  lastUploadAt: z.string().nullable(),
});

export type DashboardStatsOutput = z.infer<typeof dashboardStatsOutputSchema>;
