import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { z } from 'zod';

export const DEV_DEFAULT_SECRET = 'temarihub_dev_secret_only_for_local_development_32chars';

export const KNOWN_PLACEHOLDER_SECRETS = new Set([
  'YOUR_SECURE_RANDOM_SESSION_SECRET_HERE',
  'REPLACE_WITH_CRYPTOGRAPHICALLY_SECURE_SECRET_MIN_32_CHARS',
  'REPLACE_WITH_SECURE_ADMIN_PASSWORD',
  'CHANGEME_GENERATE_SECURE_SECRET_MIN_32_HEX_CHARS',
  'CHANGEME_GENERATE_SECURE_SECRET_MIN_32_CHARS_openssl_rand_hex_32',
  DEV_DEFAULT_SECRET,
]);

/**
 * Deterministically resolves the .env file path across root workspace and subdirectories.
 */
export function resolveEnvFilePath(customCwd?: string): string | null {
  const cwd = customCwd || process.cwd();
  const candidateEnvPaths = [
    path.resolve(cwd, '.env'),
    path.resolve(cwd, '..', '.env'),
    path.resolve(cwd, 'server', '.env'),
  ];

  for (const envPath of candidateEnvPaths) {
    if (fs.existsSync(envPath)) {
      return envPath;
    }
  }
  return null;
}

// Automatically load environment on import
const resolvedEnvFile = resolveEnvFilePath();
if (resolvedEnvFile) {
  dotenv.config({ path: resolvedEnvFile });
}

export function createEnvSchema() {
  return z
    .object({
      PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
      NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
      API_PREFIX: z.string().default('/api/v1'),
      CLIENT_URL: z.string().default('http://localhost:5173'),
      MONGODB_URI: z.string().default('mongodb://localhost:27017/temarihub'),
      SESSION_SECRET: z.string().optional(),
      SESSION_COOKIE_NAME: z.string().default('temarihub_sid'),
      SESSION_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).optional(),
      SESSION_MAX_AGE_MS: z.string().default('604800000').transform((val) => parseInt(val, 10)),
      RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
      RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform((val) => parseInt(val, 10)),
      INITIAL_ADMIN_EMAIL: z.string().email().optional(),
      INITIAL_ADMIN_PASSWORD: z.string().min(8).optional(),
      INITIAL_ADMIN_NAME: z.string().min(2).optional(),
    })
    .superRefine((data, ctx) => {
      // Production security gate
      if (data.NODE_ENV === 'production') {
        if (!data.SESSION_SECRET || data.SESSION_SECRET.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['SESSION_SECRET'],
            message: 'SESSION_SECRET is required in production and must be explicitly configured.',
          });
        } else if (data.SESSION_SECRET.length < 32) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['SESSION_SECRET'],
            message: 'SESSION_SECRET in production must be at least 32 characters long.',
          });
        } else if (KNOWN_PLACEHOLDER_SECRETS.has(data.SESSION_SECRET)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['SESSION_SECRET'],
            message: 'SESSION_SECRET cannot be a default or placeholder value in production.',
          });
        }
      }
    })
    .transform((data) => {
      // In development or test, allow the dev default secret if not provided
      const resolvedSecret =
        data.SESSION_SECRET && data.SESSION_SECRET.trim() !== ''
          ? data.SESSION_SECRET
          : data.NODE_ENV === 'production'
            ? ''
            : DEV_DEFAULT_SECRET;

      return {
        ...data,
        SESSION_SECRET: resolvedSecret,
      };
    });
}

export type ValidatedEnv = z.infer<ReturnType<typeof createEnvSchema>>;

export function validateEnvConfig(rawEnv: Record<string, any>): ValidatedEnv {
  const schema = createEnvSchema();
  const parsed = schema.safeParse(rawEnv);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'Configuration'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  return parsed.data;
}

export const env = validateEnvConfig(process.env);
