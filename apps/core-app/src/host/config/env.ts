import { resolveDevHost } from './devHost';

declare const __APP_CONFIG__: {
  readonly appEnv: 'development' | 'production';
  readonly devHost?: string;
  readonly apiBaseUrl: string;
  readonly deploymentsApiBaseUrl: string;
};

const DEV_PORTS = { mf: 8081 } as const;

// core-server serves more than one GraphQL surface on different paths — a public storefront schema
// and this internal one. Which surface this app talks to is a property of the app, not of the
// environment, so it is the same everywhere and belongs here rather than in configuration.
const GRAPHQL_PATH = '/mobile-graphql';

const PROD = {
  mfHostUrl: 'https://mf.vrittiai.com',
} as const;

const raw = __APP_CONFIG__;
const isDev = raw.appEnv === 'development';

// Derived from the bundle's own origin rather than DEV_HOST, so it stays correct when the LAN IP
// changes and works on simulator and device alike. DEV_HOST remains an override for the case the
// bundle host is not the machine serving the remotes.
const devHost = isDev ? resolveDevHost(raw.devHost) : undefined;

export const config = {
  appEnv: raw.appEnv,
  isDev,

  api: {
    deploymentsBaseUrl: raw.deploymentsApiBaseUrl,
    fallbackBaseUrl: raw.apiBaseUrl,
    // core-server serves two GraphQL surfaces on different paths — this app talks to the internal one
    graphqlPath: GRAPHQL_PATH,
    // Undefined → real org subdomain is applied; set a value only to force a single raw core host in dev.
    devRawCoreBaseUrl: undefined,
  },

  mf: {
    hostUrl: isDev ? `http://${devHost}:${DEV_PORTS.mf}` : PROD.mfHostUrl,
    devHost,
  },

  security: {
    keychainServicePrefix: 'com.vrittiai.coreapp.secure',
  },
} as const;

export type AppConfig = typeof config;

// Dev-only API host override: devRawCoreBaseUrl wins in dev; in prod it's undefined so the real URL passes through.
export function resolveApiBaseUrl(productionUrl: string): string {
  return config.api.devRawCoreBaseUrl ?? productionUrl;
}
