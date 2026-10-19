import { z } from 'zod';

export const trackerStatusSchema = z.enum([
  'Interested',
  'Preparing',
  'Applied',
  'Interview',
  'Accepted',
  'Rejected',
  'Withdrawn',
]);

export const createTrackerSchema = z.object({
  opportunityId: z.string().min(1, 'Opportunity ID is required'),
  status: trackerStatusSchema.default('Interested'),
  appliedDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  deadlineReminderDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  privateNotes: z.string().max(5000, 'Notes cannot exceed 5000 characters').optional(),
});

export const updateTrackerSchema = z.object({
  status: trackerStatusSchema.optional(),
  appliedDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable().optional(),
  deadlineReminderDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).nullable().optional(),
  privateNotes: z.string().max(5000, 'Notes cannot exceed 5000 characters').optional(),
});
