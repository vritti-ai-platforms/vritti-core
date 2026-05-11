import { z } from 'zod';

const hostOnly = z.string().regex(/^[a-zA-Z0-9.-]+$/, 'host/IP only — no protocol or port (e.g. 192.168.1.57)');

export const envSchema = z.discriminatedUnion('APP_ENV', [
  z.object({
    APP_ENV: z.literal('development'),
    DEV_HOST: hostOnly,
    DEPLOYMENTS_API_BASE_URL: z.string().url(),
  }),
  z.object({
    APP_ENV: z.literal('production'),
    DEPLOYMENTS_API_BASE_URL: z.string().url(),
  }),
]);
