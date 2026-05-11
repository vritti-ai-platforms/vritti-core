declare module '*.css';
declare const __APP_CONFIG__: {
  readonly appEnv: 'development' | 'production';
  readonly devHost?: string;
  readonly deploymentsApiBaseUrl: string;
};
