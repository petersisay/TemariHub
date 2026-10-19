import { z } from 'zod';

export const moderationDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reviewNotes: z.string().max(1000).optional(),
});

export const resolveReportSchema = z.object({
  status: z.enum(['reviewed', 'resolved', 'dismissed']),
  resolutionNotes: z.string().max(1000).optional(),
});
