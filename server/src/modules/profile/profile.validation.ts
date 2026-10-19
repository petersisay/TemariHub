import { z } from 'zod';

export const updateProfileSchema = z.object({
  university: z.string().min(2, 'University is required').trim().optional(),
  customUniversity: z.string().trim().optional(),
  degreeLevel: z
    .enum(['undergraduate', 'postgraduate', 'phd', 'tvet', 'recent_graduate'])
    .optional(),
  fieldOfStudy: z.string().min(2, 'Field of study is required').trim().optional(),
  graduationYear: z.number().int().min(2020).max(2040).optional(),
  skills: z.array(z.string().trim()).optional(),
  preferredLocations: z.array(z.string().trim()).optional(),
  preferredArrangements: z.array(z.enum(['on_site', 'remote', 'hybrid'])).optional(),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').trim().optional(),
  githubUrl: z.string().url('Invalid GitHub URL').or(z.literal('')).optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional(),
  portfolioUrl: z.string().url('Invalid Portfolio URL').or(z.literal('')).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
