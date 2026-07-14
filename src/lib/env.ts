import { z } from 'zod';

/**
 * Centralised, validated environment access.
 *
 * Server-only variables are validated lazily so that importing this module in a
 * client bundle (which only needs the NEXT_PUBLIC_* values) does not throw.
 */

const booleanish = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_DIR: z.string().default('./storage'),

  S3_ENDPOINT: z.string().optional().default(''),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY_ID: z.string().optional().default(''),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(''),
  S3_PRIVATE_BUCKET: z.string().default('olivia-private'),
  S3_PUBLIC_BUCKET: z.string().default('olivia-public'),
  S3_FORCE_PATH_STYLE: booleanish,
  S3_PUBLIC_BASE_URL: z.string().optional().default(''),

  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(300),

  EMAIL_DRIVER: z.enum(['console', 'resend', 'smtp-noop']).default('console'),
  EMAIL_FROM: z.string().default('Olivia Saunders <studio@example.com>'),
  ADMIN_NOTIFICATION_EMAIL: z.string().default('studio@example.com'),
  RESEND_API_KEY: z.string().optional().default(''),

  RATE_LIMIT_ENABLED: z
    .string()
    .optional()
    .default('true')
    .transform((v) => v !== 'false'),

  SENTRY_DSN: z.string().optional().default(''),
});

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_ANALYTICS_DRIVER: z.string().optional().default(''),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional().default(''),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(''),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type PublicEnv = z.infer<typeof publicSchema>;

let cachedServerEnv: ServerEnv | null = null;

/**
 * Validate and return server environment. Throws a helpful error at boot if a
 * required variable is missing. Cached after first successful parse.
 */
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid server environment configuration:\n${issues}`);
  }
  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export const publicEnv: PublicEnv = publicSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ANALYTICS_DRIVER: process.env.NEXT_PUBLIC_ANALYTICS_DRIVER,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

export function getAppUrl(): string {
  return publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
}
