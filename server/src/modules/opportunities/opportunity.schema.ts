import { z } from 'zod';

export const opportunityTypeSchema = z.enum([
  'internship',
  'entry_level_job',
  'scholarship',
  'hackathon',
  'fellowship',
  'training',
]);

export const workArrangementSchema = z.enum(['on_site', 'remote', 'hybrid']);

export const degreeLevelSchema = z.enum([
  'undergraduate',
  'postgraduate',
  'phd',
  'tvet',
  'recent_graduate',
]);

export const listOpportunitiesQuerySchema = z.object({
  search: z.string().optional(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
  types: z.union([z.string(), z.array(z.string())]).optional(),
  workArrangement: z.union([z.string(), z.array(z.string())]).optional(),
  arrangements: z.union([z.string(), z.array(z.string())]).optional(),
  level: z.union([z.string(), z.array(z.string())]).optional(),
  levels: z.union([z.string(), z.array(z.string())]).optional(),
  field: z.string().optional(),
  location: z.string().optional(),
  includeExpired: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => val === true || val === 'true'),
  sort: z.enum(['newest', 'deadline_asc', 'deadline_desc']).optional().default('newest'),
  sortBy: z.enum(['newest', 'deadline_asc', 'deadline_desc']).optional(),
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(String(val), 10) || 1) : 1)),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? Math.min(50, Math.max(1, parseInt(String(val), 10) || 12)) : 12)),
});

export const submitOpportunitySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  organization: z.object({
    name: z.string().min(2, 'Organization name is required').max(150),
    websiteUrl: z.string().url('Organization website must be a valid URL').optional().or(z.literal('')),
    logoUrl: z.string().url('Logo URL must be valid').optional().or(z.literal('')),
    isVerified: z.boolean().optional().default(false),
  }),
  opportunityType: opportunityTypeSchema,
  description: z.string().min(20, 'Description must be at least 20 characters').max(10000),
  eligibleFields: z.array(z.string()).default([]),
  eligibleLevels: z.array(degreeLevelSchema).default([]),
  requiredSkills: z.array(z.string()).default([]),
  location: z.string().min(2, 'Location is required').max(100),
  workArrangement: workArrangementSchema.default('on_site'),
  deadline: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  isRollingDeadline: z.boolean().default(false),
  compensation: z
    .object({
      type: z.enum(['paid', 'unpaid', 'stipend', 'competitive', 'undisclosed']).default('undisclosed'),
      amount: z.number().min(0).optional(),
      currency: z.enum(['ETB', 'USD']).default('ETB'),
      period: z.enum(['monthly', 'total', 'hourly']).default('monthly'),
    })
    .default({ type: 'undisclosed' }),
  originalSourceUrl: z.string().url('Original source URL is required for human verification'),
  applicationUrl: z.string().url('Direct application URL is required'),
  sourceNotes: z.string().max(1000).optional(),
});

export const reportOpportunitySchema = z.object({
  reason: z.enum([
    'expired',
    'inaccurate_info',
    'suspicious_scam',
    'broken_link',
    'duplicate',
    'other',
  ]),
  details: z.string().min(5, 'Please provide detailed evidence or context').max(2000),
});
