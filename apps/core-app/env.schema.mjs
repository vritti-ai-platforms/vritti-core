import { z } from 'zod';

const hostOnly = z.string().regex(/^[a-zA-Z0-9.-]+$/, 'host/IP only — no protocol or port (e.g. 192.168.1.57)');

// core-server serves more than one GraphQL surface on different paths (a public storefront schema
// and this internal one), so the path is configuration rather than a constant.
const graphqlPath = z.string().regex(/^\/[a-zA-Z0-9/_-]*$/, 'must be a root-relative path (e.g. /graphql)');

export const envSchema = z.discriminatedUnion('APP_ENV', [
  z.object({
    APP_ENV: z.literal('development'),
    DEV_HOST: hostOnly,
    API_BASE_URL: z.string().url(),
    DEPLOYMENTS_API_BASE_URL: z.string().url(),
    GRAPHQL_PATH: graphqlPath,
  }),
  z.object({
    APP_ENV: z.literal('production'),
    API_BASE_URL: z.string().url(),
    DEPLOYMENTS_API_BASE_URL: z.string().url(),
    GRAPHQL_PATH: graphqlPath,
  }),
]);
