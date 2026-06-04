declare const __APP_CONFIG__: {
  readonly appEnv: 'development' | 'production';
  readonly devHost?: string;
  readonly deploymentsApiBaseUrl: string;
};

const DEV_PORTS = { rawCore: 3001, mf: 8081 } as const;

const PROD = {
  apiBaseUrl: 'https://api.vrittiai.com',
  mfHostUrl: 'https://mf.vrittiai.com',
} as const;

const raw = __APP_CONFIG__;
const isDev = raw.appEnv === 'development';

export const config = {
  appEnv: raw.appEnv,
  isDev,

  api: {
    deploymentsBaseUrl: raw.deploymentsApiBaseUrl,
    fallbackBaseUrl: isDev ? `http://${raw.devHost}:${DEV_PORTS.rawCore}` : PROD.apiBaseUrl,
    devRawCoreBaseUrl: isDev ? `http://${raw.devHost}:${DEV_PORTS.rawCore}` : undefined,
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
