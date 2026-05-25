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
    devRawCoreBaseUrl: isDev ? raw.apiBaseUrl : undefined,
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
