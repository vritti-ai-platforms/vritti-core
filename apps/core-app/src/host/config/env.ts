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
    // Undefined → real org subdomain is applied; set a value only to force a single raw core host in dev.
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

// Dev-only API host override: devRawCoreBaseUrl wins in dev; in prod it's undefined so the real URL passes through.
export function resolveApiBaseUrl(productionUrl: string): string {
  return config.api.devRawCoreBaseUrl ?? productionUrl;
}
