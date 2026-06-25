declare const __APP_CONFIG__: {
  readonly appEnv: 'development' | 'production';
  readonly devHost?: string;
  readonly apiBaseUrl: string;
  readonly deploymentsApiBaseUrl: string;
};

const DEV_PORTS = { mf: 8081 } as const;

const PROD = {
  mfHostUrl: 'https://mf.vrittiai.com',
} as const;

const raw = __APP_CONFIG__;
const isDev = raw.appEnv === 'development';

export const config = {
  appEnv: raw.appEnv,
  isDev,

  api: {
    deploymentsBaseUrl: raw.deploymentsApiBaseUrl,
    fallbackBaseUrl: raw.apiBaseUrl,
    // Undefined → buildOrganizationApiBaseURL applies the real org subdomain
    // (https://<org>.local.vrittiai.com:3001); the backend resolves the org from that subdomain.
    // Set a value only to force a single raw core host in dev (skips per-org subdomain routing).
    devRawCoreBaseUrl: undefined,
  },

  mf: {
    hostUrl: isDev ? `http://${raw.devHost}:${DEV_PORTS.mf}` : PROD.mfHostUrl,
    devHost: raw.devHost,
  },

  security: {
    keychainServicePrefix: 'com.vrittiai.coreapp.secure',
  },
} as const;

export type AppConfig = typeof config;

// Dev-only API host override: in development, API_BASE_URL (config.api.devRawCoreBaseUrl) is the single
// source of truth for the API base URL — it wins over any selected-deployment/tenant URL. In production
// devRawCoreBaseUrl is undefined, so the real (deployment-resolved) URL is returned unchanged.
export function resolveApiBaseUrl(productionUrl: string): string {
  return config.api.devRawCoreBaseUrl ?? productionUrl;
}
