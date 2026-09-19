import { z } from 'zod';

const hostOnly = z.string().regex(/^[a-zA-Z0-9.-]+$/, 'host/IP only — no protocol or port (e.g. 192.168.1.57)');

export const envSchema = z.discriminatedUnion('APP_ENV', [
  z.object({
    APP_ENV: z.literal('development'),
    // Optional — the dev host is derived from the bundle's own origin at runtime (see
    // src/host/config/devHost.ts). Set it only to point remotes at a different machine.
    DEV_HOST: hostOnly.optional(),
    API_BASE_URL: z.string().url(),
    DEPLOYMENTS_API_BASE_URL: z.string().url(),
  }),
  z.object({
    APP_ENV: z.literal('production'),
    API_BASE_URL: z.string().url(),
    DEPLOYMENTS_API_BASE_URL: z.string().url(),
  }),
]);
