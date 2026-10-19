import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim()
      .optional(),
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters')
      .trim()
      .optional(),
    email: z
      .string({ required_error: 'Email address is required' })
      .email('Please enter a valid email address')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password cannot exceed 128 characters'),
    role: z
      .enum(['student', 'submitter'], {
        errorMap: () => ({
          message:
            'Public registration only supports role "student" or "submitter". Administrator accounts cannot be self-provisioned.',
        }),
      })
      .default('student'),
  })
  .refine((data) => Boolean(data.name || data.fullName), {
    message: 'Name is required',
    path: ['name'],
  })
  .transform((data) => ({
    ...data,
    name: (data.name || data.fullName)!,
  }));


export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
